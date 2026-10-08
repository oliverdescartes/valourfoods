"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../checkout-script.js"), "utf8")
  .replace(/\binit\(\);\s*$/, "");

function checkout({ available = false, decision = "continue", method = "COD", failCheck = false, cutoffRace = false } = {}) {
  const events = [];
  const nodes = new Map();
  const classList = { add() {}, remove() {}, toggle() {} };
  const element = () => ({ hidden: true, style: {}, classList, textContent: "", setAttribute() {} });
  const listeners = new Map();
  const dialog = {
    ...element(), returnValue: "", open: false,
    addEventListener(type, listener) { listeners.set(type, listener); },
    showModal() {
      this.open = true;
      events.push("popup");
      queueMicrotask(() => this.close(decision));
    },
    close(value) { this.returnValue = value; this.open = false; listeners.get("close")?.(); },
  };
  nodes.set("[data-delivery-window-modal]", dialog);
  const storage = new Map();
  const storageApi = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const context = vm.createContext({
    Intl, Date, console: { error() {}, warn() {} }, queueMicrotask,
    window: { location: { origin: "http://checkout.test", pathname: "/checkout.html", href: "checkout.html" }, crypto: { randomUUID: () => "test_checkout_id_12345678" } },
    document: {
      body: { classList },
      querySelector(selector) {
        if (!nodes.has(selector)) nodes.set(selector, element());
        return nodes.get(selector);
      },
      querySelectorAll: () => [],
    },
    localStorage: storageApi, sessionStorage: storageApi,
  });
  vm.runInContext(source, context);
  vm.runInContext(`
    state.cart = [{ id: 'velvety-butter-chicken', name: 'Velvety Butter Chicken', price: 350, quantity: 1 }];
    state.totals = { total: 350, subtotal: 350, shipping: 0, discount: 0 };
    state.step = CHECKOUT_STEPS.REVIEW;
  `, context);
  vm.runInContext(`state.paymentMethod = ${JSON.stringify(method)}`, context);
  for (const name of ["renderSummary", "trackMetaOrderButtonClick", "trackEvent"]) context[name] = () => {};
  context.showToast = () => events.push("toast");
  context.confirmCartIsInStock = async () => true;
  context.validateForm = context.hasVerifiedUser = () => true;
  context.getFormValues = () => ({ phone: "9876543210" });
  context.getStoredUser = () => ({ phoneVerificationToken: "verified" });
  context.getCheckoutAttribution = () => ({});
  context.getWhatsappConsent = () => ({ granted: false });
  let checks = 0, orders = 0;
  const nextDay = {
    expectedDeliveryDate: "2026-10-08", estimatedDelivery: "Next-day delivery · 8 Oct 2026",
    deliveryWindow: { oneHourAvailable: false, noticeKey: "2026-10-08" },
  };
  context.postJSON = async (url, payload) => {
    if (url.endsWith("/delivery-window")) {
      checks++;
      if (failCheck) throw new Error("Delivery check failed");
      if (available && !(cutoffRace && checks > 1)) {
        events.push("eligible-check");
        return { delivery: { estimatedDelivery: "Within 1 hour", deliveryWindow: { oneHourAvailable: true } } };
      }
      events.push("admin-one");
      await Promise.resolve();
      events.push("admin-two");
      return { delivery: nextDay };
    }
    if (url.endsWith("/api/orders/cod") || url.endsWith("/api/payment/create-order")) {
      orders++;
      if (cutoffRace && orders === 1) {
        events.push("cutoff-admin-one", "cutoff-admin-two");
        throw Object.assign(new Error("Confirm delivery"), {
          code: "DELIVERY_NOTICE_REQUIRED", data: { delivery: nextDay },
        });
      }
      if (!available || cutoffRace) assert.equal(payload.order.deliveryWindowAcknowledgedFor, "2026-10-08");
      events.push(method === "COD" ? "cod-order" : "payment-create");
      return { orderId: "confirmed", order: { estimatedDelivery: nextDay.estimatedDelivery }, order_id: "order_test" };
    }
    throw new Error(`Unexpected checkout endpoint: ${url}`);
  };
  context.startRazorpayPayment = async () => {
    events.push("payment-open");
    return { orderId: "confirmed", order: { estimatedDelivery: nextDay.estimatedDelivery } };
  };
  return { context, events, dialog, nodes, checks: () => checks, orders: () => orders };
}

for (const method of ["COD", "upi"]) {
  test(`${method}: both admin attempts precede the notice, and accepting continues the normal order flow`, async () => {
    const ui = checkout({ method });
    await ui.context.placeOrder();
    assert(ui.events.indexOf("admin-two") < ui.events.indexOf("popup"));
    assert(ui.events.indexOf("popup") < ui.events.indexOf(method === "COD" ? "cod-order" : "payment-create"));
    assert.equal(ui.context.window.location.href, "order-success.html");
    assert.equal(ui.orders(), 1);
    assert.equal(ui.dialog.open, false);
    assert.match(ui.nodes.get("[data-next-day-delivery-date]").textContent, /8 Oct/);
  });
}

test("cancel or Escape returns to checkout without creating an order or collecting payment", async () => {
  const ui = checkout({ decision: "cancel", method: "upi" });
  await ui.context.placeOrder();
  assert(ui.events.includes("popup"));
  assert.equal(ui.orders(), 0);
  assert.equal(ui.context.window.location.href, "checkout.html");
  assert.equal(vm.runInContext("state.cart.length", ui.context), 1);
});

test("one-hour eligible checkout has no popup", async () => {
  const ui = checkout({ available: true });
  await ui.context.placeOrder();
  assert(!ui.events.includes("popup"));
  assert.equal(ui.orders(), 1);
});

test("rapid clicks share one delivery check and create only one order", async () => {
  const ui = checkout();
  await Promise.all([ui.context.placeOrder(), ui.context.placeOrder()]);
  assert.equal(ui.checks(), 1);
  assert.equal(ui.orders(), 1);
  assert.equal(ui.events.filter((event) => event === "popup").length, 1);
});

test("delivery check failure keeps the basket and does not open payment", async () => {
  const ui = checkout({ failCheck: true, method: "upi" });
  await ui.context.placeOrder();
  assert.equal(ui.orders(), 0);
  assert(!ui.events.includes("popup"));
  assert.equal(ui.context.window.location.href, "checkout.html");
  assert.equal(vm.runInContext("state.isPlacingOrder", ui.context), false);
});

test("crossing the cutoff between check and submit asks once, then retries with the accepted date", async () => {
  const ui = checkout({ available: true, cutoffRace: true });
  await ui.context.placeOrder();
  assert(ui.events.indexOf("cutoff-admin-two") < ui.events.indexOf("popup"));
  assert.equal(ui.events.filter((event) => event === "popup").length, 1);
  assert.equal(ui.orders(), 2);
  assert.equal(ui.context.window.location.href, "order-success.html");
});

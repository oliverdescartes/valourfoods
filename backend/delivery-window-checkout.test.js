"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createDatabase } = require("./whatsapp-test-db");
Object.assign(process.env, {
  NODE_ENV: "test", MONGO_URI: "mongodb://127.0.0.1:1/isolated",
  OPENROUTER_API_KEY: "mock", RAZORPAY_KEY_ID: "mock", RAZORPAY_KEY_SECRET: "mock",
  GUPSHUP_API_KEY: "mock", GUPSHUP_APP_NAME: "mock", GUPSHUP_SOURCE_NUMBER: "919999999999",
  TRACKING_TOKEN_SECRET: "delivery-window-test", META_ACCESS_TOKEN: "",
  WHATSAPP_ADMIN_NEW_ORDER_TEMPLATE_ID: "680c3021-6889-4c60-86b4-6ebb0c7d7b1b",
});
const axios = require("axios");
axios.defaults.adapter = async () => { throw new Error("External HTTP blocked in isolated test"); };
const api = require("./server")._test;
let database, sent, rejectRecipient;
axios.post = async (url, form) => {
  assert.match(url, /^https:\/\/api\.gupshup\.io\/wa\/api\/v1\/template\/msg$/);
  const fields = Object.fromEntries(form);
  if (fields.destination === rejectRecipient) {
    throw Object.assign(new Error("Provider rejected test submission"), { response: { status: 400 } });
  }
  await new Promise((resolve) => setTimeout(resolve, 5));
  sent.push({ destination: fields.destination, template: JSON.parse(fields.template) });
  return { data: { status: "submitted", messageId: `delivery-provider-${sent.length}` } };
};

function fresh(t, value = 1, unit = "hours", time = "21:00:00") {
  t.mock.timers.enable({ apis: ["Date"], now: new Date(`2026-10-07T${time}+05:30`) });
  database = createDatabase();
  api.setDatabaseForTests(database);
  sent = [];
  rejectRecipient = null;
  database.collection("products").rows.push({
    sku: "velvety-butter-chicken", name: "Velvety Butter Chicken", size: "520 ml",
    active: true, pricePaise: 35000, compareAtPaise: 35000, weightKg: 0.52, stockQuantity: 10,
  });
  database.collection("pricing_rules").rows.push({
    _id: "checkout", freeShippingThresholdPaise: 0, defaultShippingPaise: 0,
    deliveryTimeValue: value, deliveryTimeUnit: unit, coupons: {},
  });
}

function order() {
  return {
    checkout: {
      name: "Delivery Test", phone: "9876543210", email: "delivery@example.com",
      address: "18 Lake View Road", city: "Agartala", state: "Tripura", pincode: "799001",
    },
    payment: { method: "COD", label: "Cash on delivery" },
    products: [{ id: "velvety-butter-chicken", quantity: 1, price: 1 }],
    totals: { total: 1 },
    phoneVerificationToken: api.signCheckoutPhoneToken("9876543210", "delivery-test"),
    whatsappConsent: { granted: false },
  };
}

async function withServer(run) {
  const server = api.app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const post = async (path, payload, headers = {}) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
        method: "POST", headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify({ order: payload }),
      });
      return { status: response.status, body: await response.json() };
    };
    await run(post);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("late checkout awaits both configured admin templates, identifies timing, and deduplicates clicks", async (t) => {
  fresh(t);
  await withServer(async (post) => {
    const payload = order();
    const result = await post("/api/checkout/delivery-window", payload);
    assert.equal(result.status, 200);
    assert.equal(result.body.delivery.expectedDeliveryDate, "2026-10-08");
    assert.equal(result.body.adminAlerts.submitted, 2);
    assert.equal(sent.length, 2, "both provider submissions complete before response");
    assert.deepEqual(sent.map((message) => message.destination).sort(), ["917005328132", "919233054806"]);
    for (const message of sent) {
      assert.equal(message.template.id, process.env.WHATSAPP_ADMIN_NEW_ORDER_TEMPLATE_ID);
      assert.equal(message.template.params.length, 6);
      assert.match(message.template.params[4], /Checkout request \(not placed\)/);
      assert.match(message.template.params[4], /9:00 pm IST/i);
      assert.match(message.template.params[4], /Outside 11am-9pm/);
      assert.match(message.template.params[4], /Delivery on 8 Oct 2026/);
      assert.match(message.template.params[4], /Rs\. 350/);
    }
    const again = await post("/api/checkout/delivery-window", payload);
    assert.equal(again.body.adminAlerts.duplicates, 2);
    assert.equal(sent.length, 2);
    assert.equal(database.collection("orders").rows.length, 0);
    assert.equal(database.collection("payment_attempts").rows.length, 0);
    assert.equal(database.collection("products").rows[0].stockQuantity, 10);
  });
});

test("eligible checkout bypasses the notice; a non-hour admin setting requires it during opening hours", async (t) => {
  fresh(t, 1, "hours", "11:00:00");
  await withServer(async (post) => {
    const result = await post("/api/checkout/delivery-window", order());
    assert.equal(result.body.delivery.deliveryWindow.oneHourAvailable, true);
    assert.equal(result.body.delivery.estimatedDelivery, "Within 1 hour");
    assert.equal(sent.length, 0);
    database.collection("pricing_rules").rows[0].deliveryTimeValue = 3;
    const slower = await post("/api/checkout/delivery-window", order());
    assert.equal(slower.body.delivery.deliveryWindow.reason, "admin_delivery_setting");
    assert.equal(slower.body.adminAlerts.submitted, 2);
    assert.match(sent[0].template.params[4], /Admin setting is not 1 hour/);
  });
});

test("invalid verification cannot trigger admin alerts", async (t) => {
  fresh(t);
  await withServer(async (post) => {
    const payload = order();
    payload.phoneVerificationToken = "forged";
    const result = await post("/api/checkout/delivery-window", payload);
    assert.notEqual(result.status, 200);
    assert.equal(sent.length, 0);
    assert.equal(database.collection("admin_template_sends").rows.length, 0);
  });
});

test("both COD and online submission enforce a fresh notice before inventory or payment creation", async (t) => {
  fresh(t);
  await withServer(async (post) => {
    for (const path of ["/api/orders/cod", "/api/payment/create-order"]) {
      const payload = order();
      payload.deliveryWindowAcknowledgedFor = "2026-10-07";
      const result = await post(path, payload, { "Idempotency-Key": "delivery_test_cod_12345" });
      assert.equal(result.status, 409);
      assert.equal(result.body.code, "DELIVERY_NOTICE_REQUIRED");
      assert.equal(result.body.delivery.expectedDeliveryDate, "2026-10-08");
    }
    assert.equal(sent.length, 2);
    assert.equal(database.collection("orders").rows.length, 0);
    assert.equal(database.collection("payment_attempts").rows.length, 0);
    assert.equal(database.collection("products").rows[0].stockQuantity, 10);
  });
});

test("confirmed next-day COD order saves the accepted date and keeps ordinary admin notifications", async (t) => {
  fresh(t);
  await withServer(async (post) => {
    const payload = order();
    const checked = await post("/api/checkout/delivery-window", payload);
    payload.deliveryWindowAcknowledgedFor = checked.body.delivery.deliveryWindow.noticeKey;
    const placed = await post("/api/orders/cod", payload, { "Idempotency-Key": "delivery_test_cod_12345" });
    assert.equal(placed.status, 201);
    assert.equal(placed.body.order.expectedDeliveryDate, "2026-10-08");
    assert.equal(placed.body.order.expectedDeliveryAt, null);
    assert.equal(placed.body.order.deliveryWindow.oneHourAvailable, false);
    assert.doesNotMatch(placed.body.order.estimatedDelivery, /Within 1 hour/);
    assert.equal(database.collection("products").rows[0].stockQuantity, 9);
    await new Promise((resolve) => setTimeout(resolve, 40));
    const confirmedAlerts = sent.filter((message) =>
      message.template.id === process.env.WHATSAPP_ADMIN_NEW_ORDER_TEMPLATE_ID &&
      !message.template.params[4].includes("Checkout request"),
    );
    assert.equal(confirmedAlerts.length, 2);
    assert.ok(confirmedAlerts.every((message) => /Next-day order.*Delivery on 8 Oct 2026/.test(message.template.params[4])));
  });
});

test("one provider rejection does not skip the other admin and retries only the failed recipient", async (t) => {
  fresh(t);
  rejectRecipient = "917005328132";
  await withServer(async (post) => {
    const result = await post("/api/checkout/delivery-window", order());
    assert.equal(result.status, 200);
    assert.equal(result.body.adminAlerts.submitted, 1);
    assert.equal(result.body.adminAlerts.failed, 1);
    rejectRecipient = null;
    const retry = await post("/api/checkout/delivery-window", order());
    assert.equal(retry.body.adminAlerts.submitted, 1);
    assert.equal(retry.body.adminAlerts.duplicates, 1);
    assert.equal(sent.length, 2);
  });
});

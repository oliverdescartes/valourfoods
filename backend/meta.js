"use strict";
const crypto = require("node:crypto");
const { isIP } = require("node:net");
const proxyaddr = require("proxy-addr");
const CUSTOM = ["coupon_applied", "payment_failed", "coupon_invalid", "otp_send", "cart_quantity_update", "user_verified", "checkout_step_cart", "delivery_area_unavailable", "checkout_view", "begin_checkout", "payment_select", "remove_from_cart", "checkout_progress_click", "checkout_step_review"].map(x => `valour_${x}`);
const ALLOWED = new Set(["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "AddPaymentInfo", "Lead", "Contact", ...CUSTOM]);
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const text = value => typeof value === "string" ? value.trim().slice(0, 256) : "";
const letters = value => text(value).toLowerCase().replace(/[^\p{L}]/gu, "");
const PRODUCTION_HOSTS = new Set(["liquidspice.in", "www.liquidspice.in"]);
const MAX_TEST_EXPIRY = Date.now() + 24 * 3600000;
function testMode(env = process.env, now = Date.now()) {
  const code = String(env.META_CAPI_TEST_EVENT_CODE || "").trim();
  const inactive = reason => ({ enabled: false, codeConfigured: Boolean(code), reason });
  if (!code) return inactive("test_code_missing");
  if (env.META_DEPLOYMENT_ENV === "production") return inactive("production_deployment");
  if (["development", "test"].includes(env.NODE_ENV)) return { enabled: true, codeConfigured: true, reason: "nonproduction_node_env", code };
  if (env.META_CAPI_TEST_MODE !== "true") return inactive("explicit_test_mode_required");
  if (!["staging", "test", "development"].includes(env.META_DEPLOYMENT_ENV)) return inactive("nonproduction_deployment_required");
  try {
    const site = new URL(env.PUBLIC_SITE_URL);
    if (!["https:", "http:"].includes(site.protocol) || PRODUCTION_HOSTS.has(site.hostname)) return inactive("production_or_invalid_site");
  } catch { return inactive("production_or_invalid_site"); }
  const until = Date.parse(env.META_CAPI_TEST_MODE_UNTIL || "");
  if (!Number.isFinite(until) || until <= now || until > MAX_TEST_EXPIRY) return inactive("test_window_invalid_or_expired");
  return { enabled: true, codeConfigured: true, reason: "temporary_staging_override", code };
}
function config(env = process.env) {
  return { pixel: /^\d+$/.test(env.META_PIXEL_ID || "") ? env.META_PIXEL_ID : "2927690960901306",
    token: env.META_CAPI_ACCESS_TOKEN || env.META_CAPI_TOKEN,
    tokenSource: env.META_CAPI_ACCESS_TOKEN ? "META_CAPI_ACCESS_TOKEN" : env.META_CAPI_TOKEN ? "META_CAPI_TOKEN" : "missing",
    version: /^v\d+\.0$/.test(env.META_GRAPH_API_VERSION || "") ? env.META_GRAPH_API_VERSION : "v26.0",
    test: testMode(env).code };
}
function diagnostics(env = process.env) {
  const mode = testMode(env);
  let publicOrigin;
  try { publicOrigin = new URL(env.PUBLIC_SITE_URL).origin; } catch { publicOrigin = "invalid_or_missing"; }
  return { nodeEnv: ["production", "development", "test"].includes(env.NODE_ENV) ? env.NODE_ENV : env.NODE_ENV ? "other" : "unset",
    deploymentEnv: ["production", "staging", "development", "test"].includes(env.META_DEPLOYMENT_ENV) ? env.META_DEPLOYMENT_ENV : "unset_or_other",
    tokenConfigured: Boolean(config(env).token), tokenSource: config(env).tokenSource,
    tokenAliasesDiffer: Boolean(env.META_CAPI_ACCESS_TOKEN && env.META_CAPI_TOKEN && env.META_CAPI_ACCESS_TOKEN !== env.META_CAPI_TOKEN),
    tokenHasWhitespace: /\s/.test(config(env).token || ""),
    testCodeConfigured: mode.codeConfigured, testEventsEnabled: mode.enabled, testModeReason: mode.reason, publicOrigin };
}
function sourceUrl(value, base = process.env.PUBLIC_SITE_URL) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value, base);
    const site = new URL(base);
    const allowedOrigins = new Set([site.origin]);
    // Both verified VALOUR hosts serve the same site without a canonical redirect.
    if (site.protocol === "https:" && !site.port && PRODUCTION_HOSTS.has(site.hostname)) {
      for (const hostname of PRODUCTION_HOSTS) allowedOrigins.add(`https://${hostname}`);
    }
    if (!["https:", "http:"].includes(url.protocol) || !allowedOrigins.has(url.origin)) return undefined;
    // Tracking/review/payment tokens and customer query parameters never leave the site.
    const safePaths = /^\/(?:index\.html|checkout(?:\.html)?|cart\.html|order-success\.html|payment-failed\.html|privacy-policy(?:\.html)?|review(?:\.html)?|pay-order\.html|track-order\.html)?$/;
    return url.origin + (safePaths.test(url.pathname) ? url.pathname : "/");
  } catch { return undefined; }
}
function matching(customer = {}) {
  if (!customer || typeof customer !== "object" || Array.isArray(customer)) return {};
  const result = {};
  const add = (key, value) => { if (value) result[key] = [hash(value)]; };
  const email = text(customer.email).toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) add("em", email);
  let phone = text(customer.phone).replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(phone)) phone = `91${phone}`;
  if (/^[1-9]\d{10,14}$/.test(phone)) add("ph", phone);
  const names = text(customer.customerName || customer.name).split(/\s+/).filter(Boolean);
  add("fn", letters(customer.firstName || names[0]));
  add("ln", letters(customer.lastName || (names.length > 1 ? names.slice(1).join(" ") : "")));
  add("ct", letters(customer.city));
  // Normalize the site's explicit supported state; never treat its "Other" option as a location.
  const state = text(customer.state).toLowerCase();
  if (state === "tripura") add("st", "tr");
  else if (/^[a-z]{2}$/.test(state)) add("st", state);
  if (/^\d{6}$/.test(text(customer.pincode))) add("zp", text(customer.pincode));
  return result;
}
function requestData(req) {
  const result = {};
  let ip = req.ip;
  // Trust only explicitly configured proxy subnets; never blindly use forwarded headers.
  try {
    if (process.env.META_TRUST_PROXY) ip = proxyaddr(req, proxyaddr.compile(process.env.META_TRUST_PROXY.split(",").map(x => x.trim())));
  } catch { ip = undefined; }
  if (isIP(ip || "")) result.client_ip_address = ip;
  const ua = text(req.get("user-agent"));
  if (ua) result.client_user_agent = ua;
  for (const [key, value] of (req.get("cookie") || "").split(";").map(x => x.trim().split("="))) {
    if (["_fbp", "_fbc"].includes(key) && /^fb\.[0-2]\.\d{13}\.[A-Za-z0-9_-]{1,500}$/.test(value || "")) result[key.slice(1)] = value;
  }
  return result;
}
function customData(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out = {};
  for (const key of ["content_type", "content_name", "currency", "order_id", "payment_method", "step", "coupon"]) {
    if (text(input[key])) out[key] = text(input[key]);
  }
  if (letters(input.city)) out.city = letters(input.city);
  if (Number.isInteger(input.quantity) && input.quantity > 0 && input.quantity <= 30) out.quantity = input.quantity;
  if (Number.isFinite(input.value) && input.value >= 0 && input.value <= 10000000) out.value = input.value;
  if (input.currency) out.currency = "INR";
  if (Array.isArray(input.contents)) {
    out.contents = input.contents.slice(0, 30).filter(x => x && /^[a-zA-Z0-9_-]{1,100}$/.test(x.id) && Number.isInteger(x.quantity) && x.quantity > 0 && x.quantity <= 30).map(x => ({ id: x.id, quantity: x.quantity, ...(Number.isFinite(x.item_price) && x.item_price >= 0 ? { item_price: x.item_price } : {}) }));
    out.content_ids = out.contents.map(x => x.id);
    out.num_items = out.contents.reduce((n, x) => n + x.quantity, 0);
  } else {
    const ids = input.content_ids || (input.item_id ? [input.item_id] : []);
    if (Array.isArray(ids) && ids.length) out.content_ids = ids.slice(0, 30).filter(x => typeof x === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(x));
  }
  return out;
}
function purchaseData(order) {
  const quote = order.pricingSnapshot;
  if (!quote || quote.currency !== "INR" || !Number.isSafeInteger(quote.totalPaise) || quote.totalPaise < 0 || !quote.items?.length) throw new Error("Invalid Meta order snapshot");
  if (!Array.isArray(quote.items) || quote.items.length > 30 || quote.items.some(x => !x || !/^[a-zA-Z0-9_-]{1,100}$/.test(x.sku || "") || !Number.isInteger(x.quantity) || x.quantity < 1 || x.quantity > 30 || !Number.isSafeInteger(x.unitPricePaise) || x.unitPricePaise < 0)) throw new Error("Invalid Meta order lines");
  return customData({ currency: "INR", value: quote.totalPaise / 100, content_type: "product", order_id: String(order._id), contents: quote.items.map(x => ({ id: x.sku, quantity: x.quantity, item_price: x.unitPricePaise / 100 })) });
}
function confirmed(order) {
  return !order.metaPurchase?.requiresCapture && order.channel === "website" && Boolean(order._id) && order.purchaseIntent === "completed" && (order.paymentStatus === "paid" || (order.paymentMethod === "COD" && order.paymentStatus === "pending_cod"));
}
function pending(req, now = new Date()) {
  return { status: "pending", attempts: 0, eventTime: Math.floor(now.getTime() / 1000), nextAt: now, sourceUrl: sourceUrl(req.get("referer")) || sourceUrl("/checkout"), userData: requestData(req) };
}
async function send(event, { env = process.env, fetchImpl = fetch } = {}) {
  const cfg = config(env);
  const finish = result => {
    if (!result.ok || testMode(env).codeConfigured) {
      const fields = { stage: "transport", event: ALLOWED.has(event.event_name) || event.event_name === "Purchase" ? event.event_name : "invalid",
        eventId: /^[A-Za-z0-9_-]{8,128}$/.test(event.event_id || "") ? event.event_id : undefined,
        accepted: result.ok, testEventsEnabled: Boolean(cfg.test), tokenSource: cfg.tokenSource, httpStatus: result.status, code: result.code,
        reason: result.disabled ? "token_missing" : result.ok ? "accepted" : "delivery_failed" };
      if (result.ok) console.info("[META]", fields); else console.warn("[META]", fields);
    }
    return result;
  };
  if (!cfg.token) return finish({ ok: false, retry: true, disabled: true });
  const age = Math.floor(Date.now() / 1000) - event.event_time;
  if ((!ALLOWED.has(event.event_name) && event.event_name !== "Purchase") || !/^[A-Za-z0-9_-]{8,128}$/.test(event.event_id || "") || !Number.isInteger(age) || age < -60 || age > 604800 || !event.event_source_url) return finish({ ok: false, retry: false, code: "validation" });
  try {
    const response = await fetchImpl(`https://graph.facebook.com/${cfg.version}/${cfg.pixel}/events`, {
      method: "POST", headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ ...event, action_source: "website" }], ...(cfg.test ? { test_event_code: cfg.test } : {}) }), signal: AbortSignal.timeout(5000),
    });
    const body = await response.json().catch(() => ({}));
    const ok = response.ok && body.events_received === 1;
    return finish({ ok, retry: !ok && (response.status === 429 || response.status >= 500 || body.error?.is_transient === true), status: response.status, code: typeof body.error?.code === "number" ? body.error.code : undefined });
  } catch { return finish({ ok: false, retry: true, code: "network" }); }
}
function install(app, getOrders, getPaymentAttempts, getMetaEvents) {
  console.info("[META][CONFIG]", diagnostics());
  const buckets = new Map();
  app.get("/api/meta/config", (_req, res) => res.json({ pixelId: config().pixel }));
  app.post("/api/meta/events", async (req, res) => {
    const reject = (status, reason) => {
      console.warn("[META]", { stage: "ingress", status, reason });
      return res.status(status).json({ ok: false, reason });
    };
    const origin = sourceUrl(req.get("origin"));
    if (!origin) return reject(403, "origin_not_allowed");
    if (req.get("sec-fetch-site") === "cross-site") return reject(403, "cross_site_request");
    const now = Date.now();
    if (buckets.size > 10000) buckets.clear();
    const requestUserData = requestData(req);
    const rateKey = requestUserData.client_ip_address || req.ip;
    const bucket = buckets.get(rateKey) || { start: now, count: 0 };
    if (now - bucket.start > 60000) { bucket.start = now; bucket.count = 0; }
    buckets.set(rateKey, bucket);
    if (++bucket.count > 120) return reject(429, "rate_limited");
    const body = req.body || {};
    if (Object.keys(body).some(key => !["event_name", "event_id", "event_time", "event_source_url", "custom_data", "customer"].includes(key)) || (body.custom_data != null && (typeof body.custom_data !== "object" || Array.isArray(body.custom_data))) || (body.customer != null && (typeof body.customer !== "object" || Array.isArray(body.customer)))) return reject(400, "invalid_payload_shape");
    if (!ALLOWED.has(body.event_name)) return reject(400, "event_not_allowed");
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(body.event_id || "")) return reject(400, "invalid_event_id");
    if (JSON.stringify(body).length > 12000) return reject(400, "payload_too_large");
    if (!Number.isInteger(body.event_time) || Math.abs(Math.floor(now / 1000) - body.event_time) > 300) return reject(400, "invalid_event_time");
    const url = sourceUrl(body.event_source_url);
    if (!url) return reject(400, "source_url_not_allowed");
    const data = customData(body.custom_data);
    if (body.custom_data?.currency != null && body.custom_data.currency !== "INR") return reject(400, "invalid_currency");
    if (["ViewContent", "AddToCart", "InitiateCheckout", "AddPaymentInfo"].includes(body.event_name) && (!data.contents?.length || data.currency !== "INR" || data.value == null || data.content_type !== "product")) return reject(400, "invalid_commerce_data");
    const deliveryPayload = { event_name: body.event_name, event_id: body.event_id, event_time: body.event_time, event_source_url: url, user_data: { ...matching(body.customer), ...requestUserData }, custom_data: data };
    let diagnosticsCollection;
    let shouldSend = true;
    try {
      diagnosticsCollection = getMetaEvents?.();
      await diagnosticsCollection?.insertOne({ eventName: body.event_name, eventId: body.event_id, occurredAt: new Date(body.event_time * 1000), receivedAt: new Date(), browserAttempted: true, capiAttempts: 0, capiAccepted: false, status: "processing", deliveryPayload });
    } catch (error) {
      if (error?.code === 11000 && diagnosticsCollection) {
        const existing = await diagnosticsCollection.findOne({ eventName: body.event_name, eventId: body.event_id });
        const stale = existing?.status === "processing" && new Date(existing.receivedAt || 0).getTime() < Date.now() - 2 * 60_000;
        shouldSend = (existing?.status === "failed" && existing?.retryable === true) || stale;
        if (shouldSend) {
          const claim = await diagnosticsCollection.updateOne({ _id: existing._id, status: existing.status }, { $set: { status: "processing", receivedAt: new Date(), lastAttemptAt: new Date() } });
          shouldSend = claim.modifiedCount === 1;
        }
      }
    }
    if (!shouldSend) return res.status(200).json({ ok: true, duplicate: true });
    const result = await send(deliveryPayload);
    const deliveryStatus = result.ok ? "accepted" : result.retry ? "pending" : "failed";
    try {
      await diagnosticsCollection?.updateOne(
        { eventName: body.event_name, eventId: body.event_id },
        { $set: { status: deliveryStatus, retryable: Boolean(result.retry), nextAt: new Date(Date.now() + 10000), capiAccepted: result.ok, httpStatus: result.status || null, errorCode: result.code || (result.disabled ? "token_missing" : null), updatedAt: new Date() }, $inc: { capiAttempts: 1 }, ...(deliveryStatus !== "pending" ? { $unset: { deliveryPayload: "" } } : {}) },
      );
    } catch { /* diagnostics must not affect event delivery */ }
    return res.sendStatus(204);
  });
  app.post("/api/meta/browser-attempt", async (req, res) => {
    if (!sourceUrl(req.get("origin")) || req.get("sec-fetch-site") === "cross-site") return res.status(403).json({ ok: false });
    const eventId = String(req.body?.event_id || "");
    const match = eventId.match(/^purchase_([a-f\d]{24})$/i);
    if (!match) return res.status(400).json({ ok: false });
    try {
      await getOrders().updateOne(
        {
          _id: new (require("mongodb").ObjectId)(match[1]),
          channel: "website",
          purchaseIntent: "completed",
          $or: [
            { paymentStatus: "paid" },
            { paymentMethod: "COD", paymentStatus: "pending_cod" },
          ],
        },
        {
          $set: {
            "metaPurchase.browserAttempted": true,
            "metaPurchase.browserAttemptedAt": new Date(),
          },
        },
      );
    } catch { /* diagnostics only */ }
    return res.sendStatus(204);
  });
  let running = false;
  let indexed = false;
  async function drain() {
    if (running) return;
    running = true;
    try {
      const orders = getOrders();
      if (!indexed) {
        await orders.createIndex({ "metaPurchase.status": 1, "metaPurchase.nextAt": 1 }, { sparse: true });
        indexed = true;
      }
      // Stay inside the browser/server deduplication window even after a long outage.
      await orders.updateMany({ "metaPurchase.status": "pending", "metaPurchase.eventTime": { $lt: Math.floor(Date.now() / 1000) - 47 * 3600 } }, { $set: { "metaPurchase.status": "failed", "metaPurchase.errorCode": "expired" }, $unset: { "metaPurchase.userData": "" } });
      if (!config().token) return;
      const eventDiagnostics = getMetaEvents?.();
      if (eventDiagnostics) {
        await eventDiagnostics.updateMany({ status: "processing", nextAt: { $lte: new Date() } }, { $set: { status: "pending" } });
        for (let i = 0; i < 50; i++) {
          const pendingEvent = await eventDiagnostics.findOneAndUpdate(
            { status: "pending", nextAt: { $lte: new Date() }, capiAttempts: { $lt: 8 }, occurredAt: { $gte: new Date(Date.now() - 47 * 3600_000) } },
            { $set: { status: "processing", nextAt: new Date(Date.now() + 60_000) } },
            { returnDocument: "after" },
          );
          if (!pendingEvent) break;
          const result = await send(pendingEvent.deliveryPayload || {});
          const status = result.ok ? "accepted" : result.retry && pendingEvent.capiAttempts + 1 < 8 ? "pending" : "failed";
          await eventDiagnostics.updateOne(
            { _id: pendingEvent._id, status: "processing" },
            { $set: { status, retryable: status === "pending", nextAt: new Date(Date.now() + Math.min(3600_000, 10000 * 2 ** pendingEvent.capiAttempts)), capiAccepted: result.ok, httpStatus: result.status || null, errorCode: result.code || null, updatedAt: new Date() }, $inc: { capiAttempts: 1 }, ...(status !== "pending" ? { $unset: { deliveryPayload: "" } } : {}) },
          );
        }
        await eventDiagnostics.updateMany(
          { status: { $in: ["pending", "processing"] }, occurredAt: { $lt: new Date(Date.now() - 47 * 3600_000) } },
          { $set: { status: "failed", retryable: false, errorCode: "expired", updatedAt: new Date() }, $unset: { deliveryPayload: "" } },
        );
      }
      for (let i = 0; i < 20; i++) {
        const now = new Date();
        const order = await orders.findOneAndUpdate({ "metaPurchase.status": "pending", "metaPurchase.nextAt": { $lte: now } }, { $set: { "metaPurchase.nextAt": new Date(now.getTime() + 60000) }, $inc: { "metaPurchase.attempts": 1 } }, { returnDocument: "after" });
        if (!order) break;
        if (order.metaPurchase.requiresCapture) {
          const captured = getPaymentAttempts && await getPaymentAttempts().findOne({ razorpayOrderId: order.razorpayOrderId, metaCapturedAt: { $exists: true } });
          if (!captured) {
            await orders.updateOne({ _id: order._id, "metaPurchase.attempts": order.metaPurchase.attempts }, { $inc: { "metaPurchase.attempts": -1 } });
            continue;
          }
          order.metaPurchase.eventTime = Math.floor(new Date(captured.metaCapturedAt).getTime() / 1000);
          order.metaPurchase.requiresCapture = false;
          await orders.updateOne({ _id: order._id }, { $set: { "metaPurchase.requiresCapture": false, "metaPurchase.eventTime": order.metaPurchase.eventTime } });
        }
        let result = { ok: false, retry: false, code: "unconfirmed" };
        try {
          if (confirmed(order)) result = await send({ event_name: "Purchase", event_id: `purchase_${order._id}`, event_time: order.metaPurchase.eventTime, event_source_url: order.metaPurchase.sourceUrl, user_data: { ...matching(order), ...order.metaPurchase.userData }, custom_data: purchaseData(order) });
        } catch { result = { ok: false, retry: false, code: "snapshot" }; }
        const status = result.ok ? "sent" : result.retry && order.metaPurchase.attempts < 12 ? "pending" : "failed";
        await orders.updateOne({ _id: order._id, "metaPurchase.attempts": order.metaPurchase.attempts }, { $set: { "metaPurchase.status": status, "metaPurchase.nextAt": new Date(Date.now() + Math.min(3600000, 10000 * 2 ** order.metaPurchase.attempts)), "metaPurchase.httpStatus": result.status || null, "metaPurchase.errorCode": result.code || null, "metaPurchase.updatedAt": new Date() }, ...(status !== "pending" ? { $unset: { "metaPurchase.userData": "" } } : {}) });
        console.info("[META]", { event: "Purchase", eventId: `purchase_${order._id}`, status, httpStatus: result.status, code: result.code });
      }
    } catch { console.warn("[META] Purchase delivery deferred"); } finally { running = false; }
  }
  const timer = setInterval(() => { void drain(); }, 10000);
  timer.unref();
  return { drain, stop: () => clearInterval(timer) };
}
module.exports = { ALLOWED, config, diagnostics, testMode, sourceUrl, matching, requestData, customData, purchaseData, confirmed, pending, send, install };

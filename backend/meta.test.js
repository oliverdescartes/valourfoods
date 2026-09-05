"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const vm = require("node:vm");
const fs = require("node:fs");
const express = require("express");
const meta = require("./meta");
const hash = s => crypto.createHash("sha256").update(s).digest("hex");
const env = { META_CAPI_ACCESS_TOKEN: "test-only-placeholder", NODE_ENV: "test", META_CAPI_TEST_EVENT_CODE: "TEST_LOCAL" };
const event = () => ({ event_name: "PageView", event_id: "event_12345678", event_time: Math.floor(Date.now() / 1000), event_source_url: "https://example.test/", user_data: {} });
const order = () => ({ _id: "order12345678", channel: "website", purchaseIntent: "completed", paymentMethod: "COD", paymentStatus: "pending_cod", pricingSnapshot: { currency: "INR", totalPaise: 45000, items: [{ sku: "spice", quantity: 3, unitPricePaise: 16000 }] }, metaPurchase: { status: "pending", attempts: 0, nextAt: new Date(0), eventTime: Math.floor(Date.now() / 1000), sourceUrl: "https://example.test/checkout", userData: { client_user_agent: "test-agent" } } });
test("normalization hashes genuine matching fields and omits unavailable data", () => {
  const data = meta.matching({ name: "  Asha Devi ", email: " ASHA@EXAMPLE.COM ", phone: "+91 98765 43210", city: "New Delhi", state: "DL", pincode: "110001" });
  assert.deepEqual(data, { em: [hash("asha@example.com")], ph: [hash("919876543210")], fn: [hash("asha")], ln: [hash("devi")], ct: [hash("newdelhi")], st: [hash("dl")], zp: [hash("110001")] });
  assert.deepEqual(meta.matching({ name: "Asha", state: "unknown" }), { fn: [hash("asha")] });
  assert.deepEqual(meta.matching(null), {});
  assert.deepEqual(meta.matching({ state: "Tripura" }), { st: [hash("tr")] });
  assert.deepEqual(meta.matching({ state: "Other" }), {});
});
test("IP, UA and genuine cookies stay unhashed; no fabricated click/browser IDs", () => {
  const headers = { "user-agent": "browser", cookie: "_fbp=fb.1.1780000000000.123; _fbc=fb.1.1780000000000.RealClick_123" };
  assert.deepEqual(meta.requestData({ ip: "203.0.113.1", get: k => headers[k] }), { client_ip_address: "203.0.113.1", client_user_agent: "browser", fbp: "fb.1.1780000000000.123", fbc: "fb.1.1780000000000.RealClick_123" });
  assert.deepEqual(meta.requestData({ get: () => "" }), {});
});
test("source URLs drop secrets, fragments and token paths; custom data excludes PII", () => {
  assert.equal(meta.sourceUrl("https://example.test/checkout?token=private#secret", "https://example.test"), "https://example.test/checkout");
  assert.equal(meta.sourceUrl("https://example.test/api/order-tracking/private", "https://example.test"), "https://example.test/");
  assert.equal(meta.sourceUrl("https://evil.test/", "https://example.test"), undefined);
  assert.deepEqual(meta.customData({ phone: "123", email: "private", reason: "private", item_id: "spice" }), { content_ids: ["spice"] });
  assert.equal(meta.sourceUrl(undefined, "https://example.test"), undefined);
  assert.equal(meta.sourceUrl("https://liquidspice.in/checkout", "https://www.liquidspice.in/"), "https://liquidspice.in/checkout");
  assert.equal(meta.sourceUrl("https://www.liquidspice.in/checkout", "https://liquidspice.in/"), "https://www.liquidspice.in/checkout");
  assert.equal(meta.sourceUrl("https://evil.liquidspice.in/", "https://www.liquidspice.in"), undefined);
});
test("Purchase uses authoritative rupees, quantities and real order ID", () => {
  const saved = order(); saved.totalAmount = 999999;
  const data = meta.purchaseData(saved);
  assert.equal(data.value, 450); assert.equal(data.num_items, 3); assert.equal(data.order_id, saved._id);
  assert.equal(data.contents[0].item_price, 160);
  assert.throws(() => meta.purchaseData({ ...saved, pricingSnapshot: { ...saved.pricingSnapshot, items: [{ sku: "", quantity: 1, unitPricePaise: 16000 }] } }), /Invalid Meta order lines/);
  for (const status of ["failed", "pending", "cancelled"]) assert.equal(meta.confirmed({ ...saved, paymentStatus: status }), false);
  assert.equal(meta.confirmed(saved), true);
  assert.equal(meta.confirmed({ ...saved, paymentMethod: "online", paymentStatus: "paid" }), true);
  assert.equal(meta.confirmed({ ...saved, channel: "whatsapp" }), false);
  assert.equal(meta.confirmed({ ...saved, paymentMethod: "online", paymentStatus: "paid", metaPurchase: { requiresCapture: true } }), false);
});
test("transport protects token and test mode, validates time and classifies failures", async () => {
  let captured;
  const transport = async (url, options) => { captured = { url, options }; return { ok: true, status: 200, json: async () => ({ events_received: 1 }) }; };
  assert.equal((await meta.send(event(), { env, fetchImpl: transport })).ok, true);
  assert.equal(captured.url.includes(env.META_CAPI_ACCESS_TOKEN), false);
  assert.equal(captured.options.headers.Authorization, `Bearer ${env.META_CAPI_ACCESS_TOKEN}`);
  assert.equal(JSON.parse(captured.options.body).test_event_code, "TEST_LOCAL");
  await meta.send(event(), { env: { ...env, NODE_ENV: "production" }, fetchImpl: transport });
  assert.equal(JSON.parse(captured.options.body).test_event_code, undefined);
  assert.equal((await meta.send({ ...event(), event_time: 1 }, { env, fetchImpl: transport })).retry, false);
  for (const [status, retry] of [[400, false], [401, false], [429, true], [503, true]]) assert.equal((await meta.send(event(), { env, fetchImpl: async () => ({ ok: false, status, json: async () => ({ error: { code: 100 } }) }) })).retry, retry);
  assert.equal((await meta.send(event(), { env, fetchImpl: async () => { throw new Error("private error"); } })).retry, true);
  assert.equal(meta.config({ META_CAPI_TOKEN: "alias" }).token, "alias");
});
test("restricted HTTP endpoint rejects fake Purchase, foreign origin and arbitrary payload", async () => {
  const tokens = [process.env.META_CAPI_ACCESS_TOKEN, process.env.META_CAPI_TOKEN];
  delete process.env.META_CAPI_ACCESS_TOKEN; delete process.env.META_CAPI_TOKEN;
  const old = process.env.PUBLIC_SITE_URL; process.env.PUBLIC_SITE_URL = "https://example.test";
  const app = express(); app.use(express.json()); const worker = meta.install(app, () => { throw new Error(); });
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/meta/events`;
  try {
    const body = { ...event(), custom_data: {} }; delete body.user_data;
    for (const [payload, origin, status] of [[{ ...body, event_name: "Purchase" }, "https://example.test", 400], [{ ...body, event_name: "valour_purchase" }, "https://example.test", 400], [body, "https://evil.test", 403], [{ ...body, access_token: "bad" }, "https://example.test", 400], [{ ...body, event_name: "AddToCart" }, "https://example.test", 400], [body, "https://example.test", 204]]) {
      const response = await fetch(url, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(payload) }); assert.equal(response.status, status);
    }
  } finally { worker.stop(); await new Promise(resolve => server.close(resolve)); if (old == null) delete process.env.PUBLIC_SITE_URL; else process.env.PUBLIC_SITE_URL = old; for (const [index, key] of ["META_CAPI_ACCESS_TOKEN", "META_CAPI_TOKEN"].entries()) { if (tokens[index] == null) delete process.env[key]; else process.env[key] = tokens[index]; } }
});
test("durable worker retries same ID, excludes failed orders and does not resend sent orders", async () => {
  const oldToken = process.env.META_CAPI_ACCESS_TOKEN; const oldFetch = global.fetch;
  process.env.META_CAPI_ACCESS_TOKEN = "local-test-only";
  const saved = order(); const ids = []; let fail = true; let captured = null;
  const db = { createIndex: async () => {}, updateMany: async () => {}, findOneAndUpdate: async (_filter, update) => {
    if (saved.metaPurchase.status !== "pending" || saved.metaPurchase.nextAt > new Date()) return null;
    saved.metaPurchase.attempts++; saved.metaPurchase.nextAt = update.$set["metaPurchase.nextAt"]; return structuredClone(saved);
  }, updateOne: async (_filter, update) => {
    for (const [key, value] of Object.entries(update.$set || {})) saved.metaPurchase[key.split(".")[1]] = value;
    if (update.$inc) saved.metaPurchase.attempts += update.$inc["metaPurchase.attempts"];
    if (update.$unset) delete saved.metaPurchase.userData;
  } };
  global.fetch = async (_url, options) => { ids.push(JSON.parse(options.body).data[0].event_id); return { ok: !fail, status: fail ? 503 : 200, json: async () => fail ? {} : { events_received: 1 } }; };
  const worker = meta.install(express(), () => db, () => ({ findOne: async () => captured }));
  try {
    await Promise.all([worker.drain(), worker.drain()]); assert.equal(ids.length, 1); assert.equal(saved.metaPurchase.status, "pending");
    saved.metaPurchase.nextAt = new Date(0); fail = false; await worker.drain(); await worker.drain();
    assert.deepEqual(ids, ["purchase_order12345678", "purchase_order12345678"]); assert.equal(saved.metaPurchase.status, "sent"); assert.equal(saved.metaPurchase.userData, undefined);
    saved.metaPurchase.status = "pending"; saved.metaPurchase.nextAt = new Date(0); saved.paymentStatus = "failed"; await worker.drain(); assert.equal(ids.length, 2); assert.equal(saved.metaPurchase.status, "failed");
    saved._id = "authorized123"; saved.paymentStatus = "paid"; saved.metaPurchase = { ...order().metaPurchase, requiresCapture: true };
    await worker.drain(); assert.equal(ids.length, 2); assert.equal(saved.metaPurchase.attempts, 0);
    captured = { metaCapturedAt: new Date() }; saved.metaPurchase.nextAt = new Date(0); await worker.drain();
    assert.equal(ids[2], "purchase_authorized123"); assert.equal(saved.metaPurchase.status, "sent");
  } finally { worker.stop(); global.fetch = oldFetch; if (oldToken == null) delete process.env.META_CAPI_ACCESS_TOKEN; else process.env.META_CAPI_ACCESS_TOKEN = oldToken; }
});
test("browser shares IDs, queues before init, strips PII and prevents refresh/back duplicate Purchase", async () => {
  const source = fs.readFileSync(require.resolve("../meta-pixel.js"), "utf8");
  const store = new Map(); const pixels = []; const requests = [];
  function browser() {
    const context = { window: {}, location: { origin: "https://example.test", pathname: "/checkout" }, crypto, localStorage: { getItem: k => store.get(k), setItem: (k, v) => store.set(k, v) }, fetch: async (url, options) => { if (options?.body) requests.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ pixelId: "2927690960901306" }) }; } };
    context.window.fbq = (...args) => pixels.push(args); vm.runInNewContext(source, context); return context.window.valourMeta;
  }
  const client = browser();
  client.track("track", "AddToCart", { currency: "INR", value: 160, contents: [{ id: "spice", quantity: 1 }], phone: "private" });
  await new Promise(setImmediate);
  assert.equal(pixels[0][0], "init");
  const pixel = pixels.find(x => x[1] === "AddToCart"); const capi = requests.find(x => x.event_name === "AddToCart");
  assert.equal(pixel[3].eventID, capi.event_id); assert.equal(pixel[2].phone, undefined);
  client.track("track", "Purchase", { order_id: "order12345678", value: 450, currency: "INR" });
  client.track("track", "Purchase", { order_id: "order12345678", value: 450, currency: "INR" });
  const refreshed = browser(); await new Promise(setImmediate);
  refreshed.track("track", "Purchase", { order_id: "order12345678", value: 450, currency: "INR" });
  refreshed.track("track", "Purchase", { order_id: "different123", value: 450, currency: "INR" });
  assert.equal(pixels.filter(x => x[1] === "Purchase").length, 2);
  assert.equal(pixels.find(x => x[1] === "Purchase")[3].eventID, "purchase_order12345678");
  assert.equal(requests.some(x => x.event_name === "Purchase"), false);
});

const stagingEnv = () => ({ ...env, NODE_ENV: "production", META_DEPLOYMENT_ENV: "staging", META_CAPI_TEST_MODE: "true", META_CAPI_TEST_MODE_UNTIL: new Date(Date.now() + 3600000).toISOString(), PUBLIC_SITE_URL: "https://staging.example.test" });
function replaceEnv(values) {
  const before = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) { if (value == null) delete process.env[key]; else process.env[key] = value; }
  return () => { for (const [key, value] of Object.entries(before)) { if (value == null) delete process.env[key]; else process.env[key] = value; } };
}
test("temporary staging test mode is explicit, expires, and refuses production deployments/hosts", () => {
  assert.equal(meta.config({ ...env, NODE_ENV: "production" }).test, undefined);
  assert.equal(meta.config({ ...env, NODE_ENV: undefined }).test, undefined);
  assert.equal(meta.config(stagingEnv()).test, "TEST_LOCAL");
  assert.equal(meta.testMode(stagingEnv(), Date.now() + 2 * 3600000).enabled, false);
  for (const changes of [
    { META_CAPI_TEST_MODE: "false" }, { META_DEPLOYMENT_ENV: "production" }, { META_DEPLOYMENT_ENV: undefined },
    { META_CAPI_TEST_MODE_UNTIL: "invalid" }, { META_CAPI_TEST_MODE_UNTIL: new Date(Date.now() - 1000).toISOString() },
    { META_CAPI_TEST_MODE_UNTIL: new Date(Date.now() + 48 * 3600000).toISOString() },
    { PUBLIC_SITE_URL: "https://liquidspice.in" }, { PUBLIC_SITE_URL: "https://www.liquidspice.in" },
    { PUBLIC_SITE_URL: "invalid" }, { META_CAPI_TEST_EVENT_CODE: "" },
  ]) assert.equal(meta.config({ ...stagingEnv(), ...changes }).test, undefined, JSON.stringify(changes));
  assert.equal(meta.config({ ...env, META_DEPLOYMENT_ENV: "production" }).test, undefined);
  const output = JSON.stringify(meta.diagnostics(stagingEnv()));
  assert.equal(output.includes(env.META_CAPI_ACCESS_TOKEN), false);
  assert.equal(output.includes(env.META_CAPI_TEST_EVENT_CODE), false);
  assert.equal(meta.diagnostics(stagingEnv()).nodeEnv, "production");
  assert.equal(meta.diagnostics(stagingEnv()).testEventsEnabled, true);
});
test("real browser helper and HTTP ingress plus Purchase worker use normal names and staging test code", async () => {
  const restore = replaceEnv(stagingEnv());
  const oldFetch = global.fetch;
  const graph = []; const pixels = []; const requests = [];
  const saved = order(); saved.metaPurchase.sourceUrl = "https://staging.example.test/checkout";
  const db = { createIndex: async () => {}, updateMany: async () => {}, findOneAndUpdate: async () => {
    if (saved.metaPurchase.status !== "pending") return null;
    saved.metaPurchase.attempts++; return structuredClone(saved);
  }, updateOne: async (_filter, update) => {
    for (const [key, value] of Object.entries(update.$set || {})) saved.metaPurchase[key.split(".")[1]] = value;
  } };
  global.fetch = async (url, options) => {
    assert.match(String(url), /^https:\/\/graph\.facebook\.com\//);
    graph.push(JSON.parse(options.body));
    return { ok: true, status: 200, json: async () => ({ events_received: 1 }) };
  };
  const app = express(); app.use(express.json()); const worker = meta.install(app, () => db);
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const context = { window: {}, location: { origin: "https://staging.example.test", pathname: "/checkout" }, crypto, console,
      localStorage: { getItem: () => null, setItem: () => {} }, fetch: (url, options = {}) => {
        const request = oldFetch(base + url, { ...options, headers: { ...options.headers, Origin: "https://staging.example.test", "Sec-Fetch-Site": "same-origin" } });
        requests.push(request); return request;
      } };
    context.window.fbq = (...args) => pixels.push(args);
    vm.runInNewContext(fs.readFileSync(require.resolve("../meta-pixel.js"), "utf8"), context);
    const data = { currency: "INR", value: 160, content_type: "product", contents: [{ id: "spice", quantity: 1, item_price: 160 }] };
    for (const name of ["ViewContent", "AddToCart", "InitiateCheckout"]) context.window.valourMeta.track("track", name, data);
    // Bound the wait for the actual local HTTP requests; no external Meta connection occurs.
    for (let i = 0; i < 100 && graph.length < 4; i++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(graph.length, 4);
    await Promise.all(requests);
    await worker.drain();
    context.window.valourMeta.track("track", "Purchase", meta.purchaseData(saved));
    assert.deepEqual(graph.map(x => x.data[0].event_name).sort(), ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"].sort());
    for (const payload of graph) {
      const sent = payload.data[0];
      assert.equal(payload.test_event_code, "TEST_LOCAL");
      assert.equal(sent.action_source, "website");
      assert.equal(pixels.find(x => x[1] === sent.event_name)[3].eventID, sent.event_id);
    }
    assert.equal(graph.some(x => x.data[0].event_name === "TestEvent"), false);
    assert.equal(saved.metaPurchase.status, "sent");
  } finally { worker.stop(); await new Promise(resolve => server.close(resolve)); global.fetch = oldFetch; restore(); }
});
test("HTTP rejections expose safe reason codes for origin, timestamps, payloads and rate limits", async () => {
  const restore = replaceEnv({ PUBLIC_SITE_URL: "https://www.liquidspice.in" });
  const warnings = []; const oldWarn = console.warn; console.warn = (...args) => warnings.push(args);
  const app = express(); app.use(express.json()); const worker = meta.install(app, () => { throw new Error(); });
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/meta/events`;
  const body = { event_name: "PageView", event_id: "audit_event_123456", event_time: Math.floor(Date.now() / 1000), event_source_url: "https://liquidspice.in/" };
  const post = async (payload, origin = "https://liquidspice.in") => {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(payload) });
    return { status: response.status, data: await response.json() };
  };
  try {
    for (const [payload, origin, reason] of [
      [body, "https://evil.test", "origin_not_allowed"], [body, null, "origin_not_allowed"],
      [{ ...body, event_time: 1 }, "https://liquidspice.in", "invalid_event_time"],
      [{ ...body, event_name: "TestEvent" }, "https://liquidspice.in", "event_not_allowed"],
      [{ ...body, event_id: "12345" }, "https://liquidspice.in", "invalid_event_id"],
      [{ ...body, event_name: "Purchase" }, "https://liquidspice.in", "event_not_allowed"],
      [{ ...body, access_token: "private-value" }, "https://liquidspice.in", "invalid_payload_shape"],
      [{ ...body, event_source_url: "https://evil.test/private" }, "https://liquidspice.in", "source_url_not_allowed"],
      [{ ...body, custom_data: { currency: "USD" } }, "https://liquidspice.in", "invalid_currency"],
      [{ ...body, event_name: "AddToCart" }, "https://liquidspice.in", "invalid_commerce_data"],
    ]) assert.equal((await post(payload, origin)).data.reason, reason);
    let limited;
    for (let i = 0; i < 121; i++) { limited = await post({}); if (limited.status === 429) break; }
    assert.equal(limited.data.reason, "rate_limited");
    assert.equal(JSON.stringify(warnings).includes("private-value"), false);
    assert.equal(warnings.some(x => x[1].stage === "ingress"), true);
  } finally { worker.stop(); await new Promise(resolve => server.close(resolve)); console.warn = oldWarn; restore(); }
});

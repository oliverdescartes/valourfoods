"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const acquisition = require("./attribution");

const source = fs.readFileSync(path.join(__dirname, "..", "attribution.js"), "utf8");
function page({ url, referrer = "", local = new Map(), session = new Map(), now = Date.now(), blocked = false, storageUnavailable = false }) {
  const requests = [];
  const location = new URL(url);
  const context = {
    URL, URLSearchParams,
    location,
    document: { referrer, title: "VALOUR" },
    navigator: { doNotTrack: blocked ? "1" : "0" },
    crypto: require("node:crypto"),
    Date: class extends Date { static now() { return now; } },
    localStorage: { getItem: key => { if (storageUnavailable) throw new Error("blocked"); return local.get(key) || null; }, setItem: (key, value) => { if (storageUnavailable) throw new Error("blocked"); local.set(key, value); } },
    sessionStorage: { getItem: key => { if (storageUnavailable) throw new Error("blocked"); return session.get(key) || null; }, setItem: (key, value) => { if (storageUnavailable) throw new Error("blocked"); session.set(key, value); } },
    fetch: async (requestUrl, options) => { requests.push({ requestUrl, body: JSON.parse(options.body) }); return { ok: true }; },
    window: {},
  };
  context.window = context;
  vm.runInNewContext(source, context);
  return { state: context.valourAttribution.get(), requests, local, session };
}

test("a partial new campaign is a fresh record and never inherits old fields", () => {
  const local = new Map(); const session = new Map();
  const initial = page({ url: "https://liquidspice.in/?utm_source=instagram&utm_medium=paid_social&utm_campaign=launch&utm_content=reel_01", local, session });
  const next = page({ url: "https://liquidspice.in/?utm_source=facebook&utm_medium=organic_social", local, session, now: Date.now() + 1000 });
  assert.equal(next.state.latestNonDirect.source, "facebook");
  assert.equal(next.state.latestNonDirect.campaign, "");
  assert.equal(next.state.latestNonDirect.content, "");
  assert.equal(next.state.firstTouch.campaign, "launch");
  assert.notEqual(next.state.sessionId, initial.state.sessionId);
});

test("direct and internal/payment referrals preserve latest non-direct attribution", () => {
  const local = new Map(); const session = new Map();
  page({ url: "https://www.liquidspice.in/?utm_source=google&utm_medium=cpc&utm_campaign=search", local, session });
  for (const referrer of ["https://liquidspice.in/cart", "https://checkout.razorpay.com/"]) {
    const next = page({ url: "https://liquidspice.in/checkout", referrer, local, session, now: Date.now() + 2000 });
    assert.equal(next.state.latestNonDirect.source, "google");
    assert.equal(next.state.currentSession.source, "google");
  }
  const returning = page({ url: "https://liquidspice.in/", local, session, now: Date.now() + 31 * 60 * 1000 });
  assert.equal(returning.state.currentSession.channel, "direct");
  assert.equal(returning.state.latestNonDirect.source, "google");
});

test("external referrers classify channels and sensitive parameters are discarded", () => {
  const result = page({ url: "https://liquidspice.in/?utm_source=instagram&utm_medium=paid_social&email=private@example.com&token=secret", referrer: "https://www.facebook.com/post" });
  assert.equal(result.state.latestNonDirect.channel, "paid_social");
  assert.doesNotMatch(result.state.latestNonDirect.landingPage, /private|secret|token|email/);
  const organic = page({ url: "https://liquidspice.in/", referrer: "https://www.google.co.in/search?q=private" });
  assert.equal(organic.state.latestNonDirect.channel, "organic_search");
  const click = page({ url: "https://liquidspice.in/?gclid=AbC_123-Z" });
  assert.equal(click.state.latestNonDirect.channel, "paid_search");
  assert.equal(click.state.latestNonDirect.gclid, "AbC_123-Z");
});

test("blocked measurement sends nothing and server validation rejects malformed IDs", () => {
  assert.equal(page({ url: "https://liquidspice.in/", blocked: true }).requests.length, 0);
  assert.equal(acquisition.event({ event: "page_view" }), null);
  const result = page({ url: "https://liquidspice.in/?utm_source=whatsapp&utm_medium=messaging" });
  assert.equal(acquisition.event(result.requests[0].body).attribution.latestNonDirect.channel, "whatsapp");
  const fallback = page({ url: "https://liquidspice.in/?utm_source=instagram&utm_medium=organic_social", storageUnavailable: true });
  assert.equal(fallback.state.latestNonDirect.source, "instagram");
  assert.equal(fallback.requests.length, 1);
});

test("every public customer HTML page loads attribution before Meta", () => {
  for (const file of ["index.html", "cart.html", "checkout.html", "order-success.html", "payment-failed.html", "pay-order.html", "privacy-policy.html", "review.html", "track-order.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    assert.ok(html.indexOf('/attribution.js') >= 0, file);
    assert.ok(html.indexOf('/attribution.js') < html.indexOf('/meta-pixel.js'), file);
    assert.equal((html.match(/gtag\(['\"]config['\"]/g) || []).length, 1, `${file} GA config count`);
  }
});

test("checkout payload selection carries complete first/latest/session attribution", () => {
  const checkout = fs.readFileSync(path.join(__dirname, "..", "checkout-script.js"), "utf8");
  const functionSource = checkout.match(/function getCheckoutAttribution\(\) \{[\s\S]*?\n\}/)[0];
  const campaign = page({ url: "https://liquidspice.in/?utm_source=instagram&utm_medium=paid_social&utm_campaign=launch&utm_content=reel_01&utm_id=campaign_7&fbclid=AbC123" }).state;
  const context = { window: { valourAttribution: { get: () => campaign } }, URLSearchParams, document: { referrer: "" }, sessionStorage: { getItem: () => null, setItem: () => {} } };
  vm.createContext(context); vm.runInContext(functionSource, context);
  const result = vm.runInContext("getCheckoutAttribution()", context);
  assert.equal(result.source, "instagram");
  assert.equal(result.content, "reel_01");
  assert.equal(result.id, "campaign_7");
  assert.equal(result.fbclid, "AbC123");
  assert.equal(result.firstTouch.campaign, "launch");
  assert.equal(result.latestNonDirect.medium, "paid_social");
  assert.match(result.visitorId, /^vis_/);
  assert.match(result.sessionId, /^ses_/);
});

test("Facebook paid UTM visits are classified as paid social", () => {
  const visit = page({ url: "https://liquidspice.in/?utm_source=fb&utm_medium=paid&utm_campaign=campaign_1" }).state;
  assert.equal(visit.currentSession.channel, "paid_social");
  assert.equal(visit.currentSession.source, "fb");
  assert.equal(visit.currentSession.medium, "paid");
});

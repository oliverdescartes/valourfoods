const test = require("node:test");
const assert = require("node:assert/strict");
const { createBrevoEmail, renderUtility } = require("./brevo-email");

const order = {
  first_name: "Asha",
  order_number: "VALOUR-123",
  amount_paid: "Rs. 599",
  items: "Velvety Butter Chicken Liquid Spice",
  delivery_estimate: "23 September",
  tracking_url: "https://liquidspice.in/track/example",
};

test("utility rendering requires order fields and HTTPS tracking", () => {
  assert.match(renderUtility("order_confirmation", order).text, /VALOUR-123/);
  assert.throws(() => renderUtility("order_confirmation", { ...order, amount_paid: "" }), /amount_paid/);
  assert.throws(() => renderUtility("order_confirmation", { ...order, tracking_url: "http:\/\/test" }), /HTTPS/);
});

test("utility send uses Brevo SMTP without changing the existing transport", async () => {
  let config;
  let mail;
  const brevo = createBrevoEmail({
    env: { BREVO_SMTP_LOGIN: "login@smtp-brevo.com", BREVO_EMAIL_SMPT_KEY: "test-key", BREVO_EMAIL_FROM: "orders@example.com" },
    makeTransport: (value) => { config = value; return { sendMail: async (value) => { mail = value; return { messageId: "sample-id" }; } }; },
  });
  assert.deepEqual(await brevo.sendUtility({ to: "Asha@Example.com", templateKey: "order_confirmation", params: order }), { category: "utility", messageId: "sample-id" });
  assert.equal(config.host, "smtp-relay.brevo.com");
  assert.equal(config.requireTLS, true);
  assert.equal(mail.to, "asha@example.com");
});

test("marketing enrollment requires consent and an API key", async () => {
  const brevo = createBrevoEmail({ env: { BREVO_MARKETING_LIST_ID: "42" } });
  await assert.rejects(brevo.enrollMarketing({ email: "a@example.com" }), /consentAt/);
  await assert.rejects(brevo.enrollMarketing({ email: "a@example.com", consentAt: "2026-09-19T00:00:00Z", consentSource: "checkout" }), /BREVO_API_KEY/);
});

test("marketing enrollment preserves an unsubscribed contact", async () => {
  const calls = [];
  const brevo = createBrevoEmail({
    env: { BREVO_API_KEY: "test-api-key", BREVO_MARKETING_LIST_ID: "42" },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 200, json: async () => ({ emailBlacklisted: false, listUnsubscribed: [42], listIds: [] }) };
    },
  });
  const result = await brevo.enrollMarketing({ email: "a@example.com", consentAt: "2026-09-19T00:00:00Z", consentSource: "checkout" });
  assert.equal(result.status, "suppressed");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, "GET");
});

test("marketing enrollment creates a new contact on the configured list", async () => {
  const calls = [];
  const brevo = createBrevoEmail({
    env: { BREVO_API_KEY: "test-api-key", BREVO_MARKETING_LIST_ID: "42" },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (options.method === "GET") return { ok: false, status: 404 };
      return { ok: true, status: 201, json: async () => ({ id: 100 }) };
    },
  });
  const result = await brevo.enrollMarketing({ email: "New@Example.com", consentAt: "2026-09-19T00:00:00Z", consentSource: "checkout" });
  assert.equal(result.status, "enrolled");
  assert.deepEqual(JSON.parse(calls[1].options.body), { email: "new@example.com", listIds: [42], updateEnabled: false });
});

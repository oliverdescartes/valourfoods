const nodemailer = require("nodemailer");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEMPLATES = {
  order_confirmation: {
    category: "utility",
    fields: ["order_number", "amount_paid", "items", "delivery_estimate", "tracking_url"],
    subject: (p) => `VALOUR order ${p.order_number} confirmed`,
    body: (p) => `Hi ${p.first_name || "there"},\n\nYour VALOUR order ${p.order_number} is confirmed.\n\nAmount paid: ${p.amount_paid}\nItems: ${p.items}\nExpected delivery: ${p.delivery_estimate}\n\nTrack your order: ${p.tracking_url}\n\nVALOUR Customer Care`,
  },
  order_status_update: {
    category: "utility",
    fields: ["order_number", "shipping_status", "payment_method", "payment_status", "delivery_estimate", "tracking_url"],
    subject: (p) => `Update on VALOUR order ${p.order_number}`,
    body: (p) => `Hi ${p.first_name || "there"},\n\nHere is the latest update for order ${p.order_number}:\n\nShipping status: ${p.shipping_status}\nPayment method: ${p.payment_method}\nPayment status: ${p.payment_status}\nExpected delivery: ${p.delivery_estimate}\n\nTrack your order: ${p.tracking_url}\n\nVALOUR Customer Care`,
  },
};

function validEmail(value) {
  return typeof value === "string" && EMAIL_PATTERN.test(value.trim());
}

function renderUtility(templateKey, params = {}) {
  const template = TEMPLATES[templateKey];
  if (!template) throw new Error(`Unknown utility template: ${templateKey}`);
  const missing = template.fields.filter((field) => !String(params[field] || "").trim());
  if (missing.length) throw new Error(`Missing template fields: ${missing.join(", ")}`);
  if (!/^https:\/\//i.test(params.tracking_url)) {
    throw new Error("tracking_url must be HTTPS");
  }
  return { category: template.category, subject: template.subject(params), text: template.body(params) };
}

function createBrevoEmail({ env = process.env, makeTransport = nodemailer.createTransport, fetchImpl = fetch } = {}) {
  function smtpConfig() {
    // Keep the existing SES SMTP settings independent of this sample.
    const login = env.BREVO_SMTP_LOGIN || (env.SMTP_HOST === "smtp-relay.brevo.com" ? env.SMTP_USER : "");
    const key = env.BREVO_EMAIL_SMPT_KEY || env.BREVO_EMAIL_SMTP_KEY;
    const from = env.BREVO_EMAIL_FROM || env.EMAIL_FROM;
    if (!login || !key || !validEmail(from)) {
      throw new Error("Brevo SMTP needs BREVO_SMTP_LOGIN, BREVO_EMAIL_SMPT_KEY, and a verified BREVO_EMAIL_FROM (or EMAIL_FROM)");
    }
    return { login, key, from };
  }

  async function sendUtility({ to, templateKey, params }) {
    if (!validEmail(to)) throw new Error("A valid recipient email is required");
    const rendered = renderUtility(templateKey, params);
    const { login, key, from } = smtpConfig();
    const transport = makeTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: login, pass: key },
    });
    const result = await transport.sendMail({
      from: { name: "VALOUR Liquid Spice", address: from },
      to: to.trim().toLowerCase(),
      subject: rendered.subject,
      text: rendered.text,
    });
    return { category: "utility", messageId: result.messageId };
  }

  async function brevoRequest(method, route, body) {
    if (!env.BREVO_API_KEY) throw new Error("BREVO_API_KEY is required for Brevo marketing lists; the SMTP key cannot manage contacts");
    const response = await fetchImpl(`https://api.brevo.com/v3${route}`, {
      method,
      headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 404 && method === "GET") return null;
    if (!response.ok) throw new Error(`Brevo contacts API returned ${response.status}`);
    return response.status === 204 ? null : response.json();
  }

  async function enrollMarketing({ email, consentAt, consentSource }) {
    if (!validEmail(email)) throw new Error("A valid contact email is required");
    if (!consentAt || Number.isNaN(Date.parse(consentAt)) || !String(consentSource || "").trim()) {
      throw new Error("Recorded email marketing consentAt and consentSource are required");
    }
    const listId = Number(env.BREVO_MARKETING_LIST_ID);
    if (!Number.isSafeInteger(listId) || listId <= 0) throw new Error("BREVO_MARKETING_LIST_ID must be a positive integer");
    const normalized = email.trim().toLowerCase();
    const existing = await brevoRequest("GET", `/contacts/${encodeURIComponent(normalized)}`);
    if (existing?.emailBlacklisted || existing?.listUnsubscribed?.includes(listId)) {
      return { category: "marketing", status: "suppressed", email: normalized };
    }
    if (existing?.listIds?.includes(listId)) {
      return { category: "marketing", status: "already_enrolled", email: normalized };
    }
    if (existing) {
      const result = await brevoRequest("POST", `/contacts/lists/${listId}/contacts/add`, { emails: [normalized] });
      if (!result?.success?.includes(normalized)) throw new Error("Brevo did not add the contact to the marketing list");
    } else {
      await brevoRequest("POST", "/contacts", { email: normalized, listIds: [listId], updateEnabled: false });
    }
    return { category: "marketing", status: "enrolled", email: normalized, listId };
  }

  return { renderUtility, sendUtility, enrollMarketing };
}

module.exports = { createBrevoEmail, renderUtility };

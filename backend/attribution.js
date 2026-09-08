"use strict";

const CHANNELS = new Set(["paid_social", "organic_social", "paid_search", "organic_search", "referral", "email", "whatsapp", "direct", "unknown"]);
const EVENTS = new Set(["page_view", "view_content", "add_to_cart", "checkout_started", "add_payment_info", "lead", "contact"]);
const TOUCH_KEYS = ["source", "medium", "campaign", "content", "term", "id", "fbclid", "gclid", "channel", "landingPage", "referrer", "capturedAt"];

function text(value, max = 256) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function touch(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = Object.fromEntries(TOUCH_KEYS.map(key => [key, text(value[key], ["landingPage", "fbclid", "gclid"].includes(key) ? 1500 : 256)]));
  result.channel = CHANNELS.has(result.channel) ? result.channel : "unknown";
  const date = new Date(result.capturedAt);
  result.capturedAt = Number.isNaN(date.getTime()) ? null : date;
  return result;
}
function attribution(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const visitorId = text(value.visitorId, 100);
  const sessionId = text(value.sessionId, 100);
  if (!/^vis_[A-Za-z0-9_-]{12,90}$/.test(visitorId) || !/^ses_[A-Za-z0-9_-]{12,90}$/.test(sessionId)) return null;
  return {
    visitorId,
    sessionId,
    firstTouch: touch(value.firstTouch),
    latestNonDirect: touch(value.latestNonDirect),
    currentSession: touch(value.currentSession),
  };
}
function event(body = {}) {
  const eventName = text(body.event, 80).toLowerCase();
  const eventId = text(body.eventId, 128);
  const occurredAt = new Date(body.occurredAt);
  const measuredAt = Number.isNaN(occurredAt.getTime()) || Math.abs(Date.now() - occurredAt.getTime()) > 5 * 60_000 ? new Date() : occurredAt;
  const campaign = attribution(body.attribution);
  if (!EVENTS.has(eventName) || !/^[A-Za-z0-9_-]{12,128}$/.test(eventId) || !campaign) return null;
  const raw = body.details && typeof body.details === "object" && !Array.isArray(body.details) ? body.details : {};
  const details = {};
  for (const key of ["title", "itemId", "contentName", "paymentMethod"]) if (raw[key] != null) details[key] = text(raw[key], 200);
  if (Number.isFinite(Number(raw.value)) && Number(raw.value) >= 0) details.value = Math.min(Number(raw.value), 10_000_000);
  if (raw.currency === "INR") details.currency = "INR";
  const customer = raw.customer && typeof raw.customer === "object" ? raw.customer : {};
  if (customer.phone) details.phone = text(customer.phone, 20).replace(/\D/g, "").slice(-10);
  if (customer.email) details.email = text(customer.email, 254).toLowerCase();
  return { eventId, event: eventName, occurredAt: measuredAt, attribution: campaign, details };
}

function selectedTouch(document, model = "latest") {
  const attr = document.attribution || {};
  return model === "first" ? attr.firstTouch : attr.latestNonDirect || attr.currentSession;
}

module.exports = { CHANNELS, EVENTS, text, touch, attribution, event, selectedTouch };

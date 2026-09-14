"use strict";

// Only exact commands are actions. Issue descriptions must remain customer text.
const normalizeAction = (value) => String(value || "").normalize("NFKC")
  .toLowerCase().replace(/[^\p{L}\p{N}_\s'-]/gu, " ").replace(/\s+/g, " ").trim();
const aliases = {};
for (const [action, names] of Object.entries({
  MENU: ["menu", "main menu", "back", "product_back", "hi", "hello", "hey", "restart", "start over", "cancel"],
  OPT_OUT: ["stop", "unsubscribe", "opt out", "opt-out", "stop messages", "stop marketing", "cancel marketing", "no promotions"],
  MENU_COOK: ["menu_cook", "start cooking", "product_start_cooking", "start guided cooking", "cook butter chicken", "watch the valour cooking tutorial", "cooking video", "cooking_video", "delivered_cooking_video", "watch cooking video", "video", "watch video", "watch cooking demo", "tutorial"],
  MENU_EXPLORE: ["menu_explore", "explore product", "explore the product", "explore products", "explore valour products"],
  MENU_ORDER: ["menu_order", "menu_buy", "buy now", "order now", "order online"],
  MENU_TRACK: ["menu_track", "track an order", "track order"],
  MENU_SUPPORT: ["menu_support", "customer care", "contact support"],
  NEED_HELP: ["need help", "need_help", "help", "delivered_need_help", "speak to customer care"],
  OPEN_LID: ["how to open the lid", "how_to_open_the_lid", "open the lid", "delivered_open_lid"],
  DONE: ["done", "finished", "complete", "completed", "cooked"],
  LOVED: ["loved it", "loved_it", "loved my experience", "loved_my_experience"],
  BETTER: ["could be better", "could_be_better", "could've been better"],
  RATE: ["rate valour"], NOT_NOW: ["not now"],
  TOMORROW: ["tomorrow"], WEEKEND: ["this weekend", "weekend"], LATER: ["remind me later"],
  SUPPORT_ORDER_STATUS: ["support_order_status", "order status"],
  SUPPORT_RETURN_REFUND: ["support_return_refund", "return or refund"],
  SUPPORT_DAMAGED_ITEM: ["support_damaged_item", "damaged or missing"],
  SUPPORT_PRODUCT_HELP: ["support_product_help", "product or cooking"],
  SUPPORT_CUSTOMER_CARE: ["support_customer_care"],
})) for (const name of names) aliases[normalizeAction(name)] = action;

function candidates(value, depth = 0) {
  if (depth > 8 || value == null) return [];
  if (typeof value === "string" || typeof value === "number") return [String(value).trim()];
  if (Array.isArray(value)) return value.flatMap(item => candidates(item, depth + 1));
  return ["postbackText", "payload", "id", "button_reply", "list_reply", "button", "interactive", "title", "text", "body", "description"]
    .flatMap(key => candidates(value[key], depth + 1));
}

function readInbound(message = {}) {
  const native = message.gupshupPayload;
  const explicit = Boolean(message.button || message.interactive ||
    /button|quick.?reply|list/i.test(native?.type || message.type || ""));
  const values = candidates(message.interactive || message.button || (native ? native.payload : message.text?.body));
  const text = (explicit ? values.find(value => aliases[normalizeAction(value)] || /^(ADMIN_|SUPPORT_)/i.test(value)) : null) || values[0] || "";
  return { text, explicit, action: aliases[normalizeAction(text)] || null };
}

function parseNative(body = {}) {
  const payload = body.payload || {};
  if (body.type === "message-event") return { message: null, status: {
    id: payload.gsId || payload.id,
    whatsappMessageId: payload.gsId ? payload.id : payload.payload?.whatsappMessageId,
    destination: payload.destination, status: payload.type,
    timestamp: payload.ts || payload.payload?.ts || body.timestamp,
    errors: payload.type === "failed" ? payload.payload || { code: payload.code } : undefined,
  } };
  if (body.type !== "message") return { message: null, status: null };
  const from = payload.source || payload.sender?.phone || payload.phone || payload.payload?.sender?.phone;
  // Do not invent time-based IDs: two genuine events can share a timestamp.
  if (!from || !payload.id) return { message: null, status: null };
  const message = { from: String(from), id: payload.id, type: payload.type || "text", gupshupPayload: payload,
    profileName: payload.sender?.name || "" };
  message.text = { body: readInbound(message).text };
  return { message, status: null };
}

function parseWebhook(body = {}) {
  const messages = [], statuses = [];
  for (const entry of body.entry || []) for (const change of entry.changes || []) {
    const value = change.value || {};
    for (const status of value.statuses || []) if (status.id && status.status) statuses.push({ ...status,
      id: status.gs_id || status.id, whatsappMessageId: status.gs_id ? status.id : undefined });
    for (const message of value.messages || []) if (message.id && message.from) messages.push({ ...message,
      profileName: value.contacts?.find(contact => contact.wa_id === message.from)?.profile?.name || "" });
  }
  const native = parseNative(body);
  if (native.message) messages.push(native.message);
  if (native.status) statuses.push(native.status);
  return { messages, statuses };
}

module.exports = { normalizeAction, readInbound, parseNative, parseWebhook };

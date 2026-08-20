const assert = require("assert");
const { _test } = require("./server");

assert.deepEqual(
  _test.parseTrackingLookupDetails("9233054806, 799003"),
  { phone: "9233054806", pincode: "799003" },
);
assert.deepEqual(
  _test.parseTrackingLookupDetails("phone +91 9233054806 pincode 799003"),
  { phone: "9233054806", pincode: "799003" },
);
assert.deepEqual(
  _test.parseTrackingLookupDetails("799003"),
  { phone: "", pincode: "799003" },
);

const beforeQuietHours = new Date("2026-08-18T01:00:00.000Z"); // 06:30 IST
assert.equal(
  _test.nextIstSendTime(beforeQuietHours).toISOString(),
  "2026-08-18T03:30:00.000Z",
);

const afterQuietHours = new Date("2026-08-18T15:30:00.000Z"); // 21:00 IST
assert.equal(
  _test.nextIstSendTime(afterQuietHours).toISOString(),
  "2026-08-19T03:30:00.000Z",
);

const daytime = new Date("2026-08-18T06:30:00.000Z"); // 12:00 IST
assert.equal(_test.nextIstSendTime(daytime).toISOString(), daytime.toISOString());

assert.equal(
  _test.getCookingReminderTime("tomorrow", daytime).toISOString(),
  "2026-08-19T04:30:00.000Z",
);

const order = {
  _id: "507f1f77bcf86cd799439011",
  orderNumber: "VALOUR-ABC123",
  totalAmount: 415,
  products: [{ id: "velvety-butter-chicken", sku: "velvety-butter-chicken", name: "Velvety Butter Chicken Liquid Spice", size: "520 ml", price: 415, quantity: 1 }],
};
assert.equal(_test.getOrderReference(null), "");
assert.equal(_test.getOrderReference(order), order._id);
const prepaidParams = _test.getOrderTemplateParams(order);
assert.equal(prepaidParams.length, 4);
assert.deepEqual(prepaidParams.slice(0, 3), [
  "VALOUR-ABC123",
  "Rs. 415",
  "Velvety Butter Chicken Liquid Spice (520 ml) x 1",
]);
const codParams = _test.getCodTemplateParams(order);
assert.equal(codParams.length, 5);
assert.deepEqual(codParams.slice(0, 3), [
  "VALOUR-ABC123",
  "Velvety Butter Chicken Liquid Spice (520 ml) x 1",
  "Rs. 415",
]);
assert.equal(_test.readOrderPaymentToken(codParams[3]), order._id);
assert.equal(_test.readOrderTrackingToken(codParams[4]), order._id);
const trackingCreatedAt = Date.parse("2026-08-19T00:00:00.000Z");
const expiringTrackingToken = _test.createOrderTrackingToken(order, trackingCreatedAt);
assert.equal(_test.readOrderTrackingToken(expiringTrackingToken, trackingCreatedAt), order._id);
assert.equal(_test.readOrderTrackingToken(expiringTrackingToken, trackingCreatedAt + 181 * 24 * 60 * 60_000), null);
assert.deepEqual(_test.getPublicOrderItems(order), [{
  id: "velvety-butter-chicken",
  sku: "velvety-butter-chicken",
  name: "Velvety Butter Chicken Liquid Spice",
  size: "520 ml",
  quantity: 1,
  unitPrice: 415,
  lineTotal: 415,
}]);
const statusParams = _test.getOrderStatusTemplateParams({
  ...order,
  shippingStatus: "Dispatched",
  paymentMethodLabel: "UPI",
  paymentStatus: "paid",
  estimatedDelivery: "21 August 2026",
});
assert.equal(statusParams.length, 6);
assert.deepEqual(statusParams.slice(0, 5), [
  "VALOUR-ABC123",
  "Dispatched",
  "UPI",
  "Paid",
  "21 August 2026",
]);
const defaultDelivery = _test.getDefaultExpectedDeliveryFields(
  new Date("2026-08-20T10:00:00.000Z"),
  { deliveryMinDays: 1, deliveryMaxDays: 2 },
);
assert.equal(defaultDelivery.expectedDeliveryStartDate, "2026-08-21");
assert.equal(defaultDelivery.expectedDeliveryEndDate, "2026-08-22");
assert.equal(defaultDelivery.estimatedDelivery, "21 Aug 2026 – 22 Aug 2026");

const failedEvent = _test.parseGupshupV2Webhook({
  type: "message-event",
  timestamp: 1787044000000,
  payload: {
    id: "gupshup-message-id",
    type: "failed",
    destination: "919999999999",
    payload: { code: 1002, reason: "Number Does Not Exist On WhatsApp" },
  },
});
assert.equal(failedEvent.status.id, "gupshup-message-id");
assert.equal(failedEvent.status.status, "failed");
assert.equal(failedEvent.status.errors.code, 1002);

const deliveredEvent = _test.parseGupshupV2Webhook({
  type: "message-event",
  timestamp: 1787044000000,
  payload: {
    id: "whatsapp-message-id",
    gsId: "gupshup-message-id",
    type: "delivered",
    destination: "919999999999",
    ts: 1787044000,
  },
});
assert.equal(deliveredEvent.status.id, "gupshup-message-id");
assert.equal(deliveredEvent.status.whatsappMessageId, "whatsapp-message-id");
assert.equal(deliveredEvent.status.status, "delivered");

const inboundEvent = _test.parseGupshupV2Webhook({
  type: "message",
  timestamp: 1787044000000,
  payload: {
    id: "incoming-id",
    source: "919999999999",
    type: "text",
    payload: { text: "MENU" },
  },
});
assert.equal(inboundEvent.message.from, "919999999999");
assert.equal(inboundEvent.message.text.body, "MENU");

const mediaConfig = _test.getWhatsappTemplateMediaConfig(JSON.stringify({
  valour_product_demo: {
    type: "image",
    url: "https://example.com/whatsapp/product-demo.jpg",
  },
  valour_cooking_video: {
    type: "video",
    url: "https://example.com/whatsapp/cooking.mp4",
  },
}));
assert.equal(mediaConfig.valour_product_demo.type, "image");
assert.equal(mediaConfig.valour_cooking_video.type, "video");
assert.throws(
  () => _test.getWhatsappTemplateMediaConfig('{"broken":'),
  /Invalid WHATSAPP_TEMPLATE_MEDIA JSON/,
);
assert.throws(
  () => _test.getWhatsappTemplateMediaConfig(JSON.stringify({ bad: { type: "audio", url: "https://example.com/a.mp3" } })),
  /type must be image, video, or document/,
);
assert.throws(
  () => _test.getWhatsappTemplateMediaConfig(JSON.stringify({ bad: { type: "image", url: "http://localhost/a.jpg" } })),
  /must be a public HTTPS URL/,
);
assert.doesNotThrow(() => _test.validateWhatsappAutomationConfig());
assert.doesNotThrow(() =>
  _test.validateWhatsappTemplatePayload("valour_order_confirmation", prepaidParams),
);
assert.throws(
  () => _test.validateWhatsappTemplatePayload("valour_review_request", ["unexpected"]),
  /requires 0 parameters; received 1/,
);
console.log("WhatsApp automation unit tests passed");

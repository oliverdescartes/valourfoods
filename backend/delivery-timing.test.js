"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  _test: {
    formatDeliveryTiming,
    formatOrderConfirmationCaption,
    getCodTemplateParams,
    getDefaultExpectedDeliveryFields,
    getDeliveryTimingFromRules,
    getExpectedDeliveryText,
    getOrderDeliverySnapshot,
    getOrderTemplateParams,
    getOrderStatusTemplateParams,
    parseIstDateTimeLocal,
  },
} = require("./server");

const createdAt = new Date("2026-09-12T08:00:00.000Z");

for (const [value, unit, expectedIso, label] of [
  [1, "hours", "2026-09-12T09:00:00.000Z", "Within 1 hour"],
  [3, "hours", "2026-09-12T11:00:00.000Z", "Within 3 hours"],
  [1, "days", "2026-09-13T08:00:00.000Z", "Within 1 day"],
  [2, "days", "2026-09-14T08:00:00.000Z", "Within 2 days"],
]) {
  test(`creates a consistent ${value} ${unit} delivery snapshot`, () => {
    const quote = getDefaultExpectedDeliveryFields(createdAt, {
      deliveryTimeValue: value,
      deliveryTimeUnit: unit,
    });
    assert.equal(quote.expectedDeliveryAt, expectedIso);
    assert.equal(quote.estimatedDelivery, label);
    assert.equal(quote.deliveryPromise, label);

    const saved = getOrderDeliverySnapshot(quote, createdAt);
    assert.ok(saved.expectedDeliveryAt instanceof Date);
    assert.equal(saved.expectedDeliveryAt.toISOString(), expectedIso);
    assert.equal(saved.deliverySource, "pricing_rules_snapshot");

    const displayed = getExpectedDeliveryText(saved);
    assert.match(displayed, new RegExp(`^${label} · expected by `));
    assert.doesNotMatch(displayed, /Invalid Date/i);
  });
}

test("normalizes database unit capitalization and whitespace", () => {
  assert.deepEqual(
    getDeliveryTimingFromRules({
      deliveryTimeValue: 3,
      deliveryTimeUnit: " HOURS ",
    }),
    { value: 3, unit: "hours" },
  );
});

test("rejects missing or invalid delivery configuration", () => {
  assert.equal(getDeliveryTimingFromRules({}), null);
  assert.equal(
    getDeliveryTimingFromRules({
      deliveryTimeValue: 0,
      deliveryTimeUnit: "hours",
    }),
    null,
  );
  assert.throws(
    () => getDefaultExpectedDeliveryFields(createdAt, {}),
    /has not been configured/i,
  );
});

test("legacy orders have safe delivery text and never show Invalid Date", () => {
  assert.equal(
    getExpectedDeliveryText({}),
    "Delivery estimate will be confirmed shortly",
  );
  assert.equal(getExpectedDeliveryText({ estimatedDelivery: "2026-09-15" }), "15 Sept 2026");
  assert.doesNotMatch(
    getExpectedDeliveryText({ expectedDeliveryAt: "not-a-date" }),
    /Invalid Date/i,
  );
});

test("prepaid and COD template payloads use the same saved ETA text", () => {
  process.env.TRACKING_TOKEN_SECRET = "delivery-test-secret";
  const order = {
    _id: "order-delivery-test",
    orderNumber: "VALOUR-TEST",
    totalAmount: 350,
    products: [{ name: "Velvety Butter Chicken", quantity: 1 }],
    ...getOrderDeliverySnapshot(
      { deliveryTimeValue: 1, deliveryTimeUnit: "hours" },
      createdAt,
    ),
  };
  const expected = `Expected delivery: ${getExpectedDeliveryText(order)}`;
  assert.match(getOrderTemplateParams(order)[2], new RegExp(expected));
  assert.match(getCodTemplateParams(order)[1], new RegExp(expected));
  assert.equal(getOrderStatusTemplateParams(order)[4], getExpectedDeliveryText(order));
  assert.match(formatOrderConfirmationCaption(order), new RegExp(expected));
});

test("delivery labels handle singular and plural units", () => {
  assert.equal(formatDeliveryTiming(1, "hours"), "Within 1 hour");
  assert.equal(formatDeliveryTiming(2, "hours"), "Within 2 hours");
  assert.equal(formatDeliveryTiming(1, "days"), "Within 1 day");
  assert.equal(formatDeliveryTiming(2, "days"), "Within 2 days");
});

test("admin delivery date and hour are parsed explicitly as Asia/Kolkata", () => {
  assert.equal(
    parseIstDateTimeLocal("2026-09-12T18:45").toISOString(),
    "2026-09-12T13:15:00.000Z",
  );
  assert.equal(parseIstDateTimeLocal("2026-02-30T10:00"), null);
  assert.equal(parseIstDateTimeLocal("2026-09-12"), null);
});

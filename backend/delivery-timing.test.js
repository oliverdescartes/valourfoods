"use strict";

process.env.NODE_ENV = "test";

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

for (const [value, unit] of [[1, "hours"], [3, "hours"], [1, "days"], [2, "days"]]) {
  test(`creates a consistent window-aware ${value} ${unit} delivery snapshot`, () => {
    const quote = getDefaultExpectedDeliveryFields(createdAt, {
      deliveryTimeValue: value,
      deliveryTimeUnit: unit,
    });
    const saved = getOrderDeliverySnapshot(quote, createdAt);
    const displayed = getExpectedDeliveryText(saved);
    if (value === 1 && unit === "hours") {
      assert.equal(quote.expectedDeliveryAt, "2026-09-12T09:00:00.000Z");
      assert.equal(quote.estimatedDelivery, "Within 1 hour");
      assert.ok(saved.expectedDeliveryAt instanceof Date);
      assert.equal(saved.expectedDeliveryAt.toISOString(), quote.expectedDeliveryAt);
      assert.match(displayed, /^Within 1 hour · expected by /);
    } else {
      assert.equal(quote.expectedDeliveryAt, null);
      assert.equal(quote.expectedDeliveryDate, "2026-09-13");
      assert.equal(quote.estimatedDelivery, "Next-day delivery · 13 Sept 2026");
      assert.equal(saved.expectedDeliveryDate, quote.expectedDeliveryDate);
      assert.equal(saved.expectedDeliveryAt, null);
      assert.equal(displayed, "13 Sept 2026");
    }
    assert.equal(saved.deliverySource, "delivery_window_snapshot");
    assert.doesNotMatch(displayed, /Invalid Date/i);
  });
}

for (const [indiaTime, available] of [
  ["10:59:59", false], ["11:00:00", true], ["20:59:59", true],
  ["21:00:00", false], ["23:59:59", false], ["00:00:00", false],
]) {
  test(`one-hour delivery at ${indiaTime} IST is ${available}`, () => {
    const quote = getDefaultExpectedDeliveryFields(new Date(`2026-10-07T${indiaTime}+05:30`), {
      deliveryTimeValue: 1, deliveryTimeUnit: "hours",
    });
    assert.equal(quote.deliveryWindow.oneHourAvailable, available);
    if (!available) {
      assert.equal(quote.expectedDeliveryDate, "2026-10-08");
      assert.equal(quote.deliveryWindow.reason, "outside_delivery_hours");
      assert.doesNotMatch(quote.estimatedDelivery, /Within 1 hour/);
    }
  });
}

test("tomorrow follows India's date at midnight and year rollover", () => {
  const rules = { deliveryTimeValue: 1, deliveryTimeUnit: "hours" };
  const afterMidnight = getDefaultExpectedDeliveryFields(new Date("2026-10-07T18:30:00Z"), rules);
  assert.equal(afterMidnight.expectedDeliveryDate, "2026-10-09");
  const newYear = getDefaultExpectedDeliveryFields(new Date("2026-12-31T23:30:00+05:30"), rules);
  assert.equal(newYear.expectedDeliveryDate, "2027-01-01");
});

test("payment finishing after the cutoff preserves its agreed delivery snapshot", () => {
  const rules = { deliveryTimeValue: 1, deliveryTimeUnit: "hours" };
  const early = getDefaultExpectedDeliveryFields(new Date("2026-10-07T20:59:00+05:30"), rules);
  const paid = getOrderDeliverySnapshot(early, new Date("2026-10-07T21:05:00+05:30"));
  assert.equal(paid.deliveryWindow.oneHourAvailable, true);
  assert.equal(paid.expectedDeliveryAt.toISOString(), "2026-10-07T16:35:00.000Z");
  const late = getDefaultExpectedDeliveryFields(new Date("2026-10-07T23:59:00+05:30"), rules);
  const nextDay = getOrderDeliverySnapshot(late, new Date("2026-10-08T00:05:00+05:30"));
  assert.equal(nextDay.expectedDeliveryDate, "2026-10-08");
  assert.equal(nextDay.expectedDeliveryAt, null);
});

test("normalizes database unit capitalization and whitespace", () => {
  assert.deepEqual(
    getDeliveryTimingFromRules({
      deliveryTimeValue: 3,
      deliveryTimeUnit: " HOURS ",
    }),
    { value: 3, unit: "hours" },
  );
});

test("missing or invalid delivery configuration defaults to next day and cannot enable one-hour delivery", () => {
  assert.equal(getDeliveryTimingFromRules({}), null);
  assert.equal(
    getDeliveryTimingFromRules({
      deliveryTimeValue: 0,
      deliveryTimeUnit: "hours",
    }),
    null,
  );
  for (const rules of [{}, null, { deliveryTimeValue: 0, deliveryTimeUnit: "hours" }]) {
    const quote = getDefaultExpectedDeliveryFields(createdAt, rules);
    assert.equal(quote.deliveryWindow.oneHourAvailable, false);
    assert.equal(quote.deliveryWindow.reason, "admin_delivery_setting");
    assert.equal(quote.expectedDeliveryDate, "2026-09-13");
  }
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

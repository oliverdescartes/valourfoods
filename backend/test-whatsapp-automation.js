const assert = require("assert");
const { _test } = require("./server");

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

console.log("WhatsApp automation unit tests passed");

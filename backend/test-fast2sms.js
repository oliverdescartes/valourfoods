const assert = require("node:assert/strict");
const { normalizeFast2SmsNumber, sendFast2SmsQuickSms } = require("./fast2sms");

assert.equal(normalizeFast2SmsNumber("+91 98765 43210"), "9876543210");
assert.equal(normalizeFast2SmsNumber("9876543210"), "9876543210");
assert.equal(normalizeFast2SmsNumber("12345"), "");

let request;
const axiosClient = {
  async post(url, body, options) {
    request = { url, body, options };
    return { data: { return: true, request_id: "test-request" } };
  },
};

(async () => {
  const result = await sendFast2SmsQuickSms({
    axiosClient,
    apiKey: "test-key",
    phone: "+919876543210",
    message: "Your VALOUR code is 123456.",
    reference: "shipping_phone_otp",
  });
  assert.equal(result.request_id, "test-request");
  assert.equal(request.body.route, "q");
  assert.equal(request.body.numbers, "9876543210");
  assert.equal(request.options.headers.Authorization, "test-key");
  assert.equal(request.options.timeout, 15000);
  console.log("Fast2SMS tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

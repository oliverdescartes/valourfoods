const DEFAULT_ENDPOINT = "https://www.fast2sms.com/dev/bulkV2";

function normalizeFast2SmsNumber(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : "";
}

async function sendFast2SmsQuickSms({
  axiosClient,
  apiKey = process.env.FAST2SMS_API_KEY,
  phone,
  message,
  reference = "",
  endpoint = DEFAULT_ENDPOINT,
}) {
  if (!axiosClient) throw new Error("Fast2SMS requires an HTTP client");
  if (!apiKey) throw new Error("FAST2SMS_API_KEY is not configured");

  const number = normalizeFast2SmsNumber(phone);
  if (!number) throw new Error("Fast2SMS requires a valid Indian mobile number");

  const text = String(message || "").trim();
  if (!text) throw new Error("Fast2SMS message cannot be empty");

  const response = await axiosClient.post(
    endpoint,
    {
      route: "q",
      message: text,
      numbers: number,
      sms_details: "1",
      ...(reference ? { udf1: String(reference).slice(0, 100) } : {}),
    },
    {
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    },
  );

  if (response.data?.return !== true) {
    const error = new Error(
      response.data?.message?.join?.(", ") ||
      response.data?.message ||
      "Fast2SMS rejected the message",
    );
    error.providerResponse = response.data;
    throw error;
  }
  return response.data;
}

module.exports = { normalizeFast2SmsNumber, sendFast2SmsQuickSms };

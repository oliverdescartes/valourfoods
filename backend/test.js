// expected-tat.js

const BASE_URL = "https://track.delhivery.com";
const TOKEN = "4d4127ef7554bf701307e208fc35d9feb15648de"; // ⚠️ don't hardcode in production
// expected-tat-fixed.js
// expected-tat-final.js

function validatePin(pin, name) {
  if (!/^\d{6}$/.test(String(pin))) {
    throw new Error(`${name} must be a valid 6-digit pincode`);
  }
}

function getFormattedDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

async function getEstimatedDeliveryDate({
  origin_pin,
  destination_pin,
  mot = "S", // S = surface, E = express
  pdt = "B2C",
  expected_pickup_date,
}) {
  validatePin(origin_pin, "origin_pin");
  validatePin(destination_pin, "destination_pin");

  const params = new URLSearchParams({
    origin_pin: String(origin_pin),
    destination_pin: String(destination_pin),
    mot,
    pdt,
  });

  params.set(
    "expected_pickup_date",
    expected_pickup_date || getFormattedDate(),
  );

  const url = `${BASE_URL}/api/dc/expected_tat?${params.toString()}`;
  console.log(url);
  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${TOKEN}`,
      Accept: "application/json",
    },
  });

  const data = await res.json();

  // 🔴 HTTP-level failure
  if (!res.ok) {
    throw new Error(
      data?.detail || data?.error || data?.msg || `HTTP ${res.status}`,
    );
  }

  // 🔴 Business-level failure (CRITICAL)
  if (data?.success === false) {
    throw new Error(data?.msg || "Expected TAT failed");
  }

  // ✅ Success
  return {
    tat_days: data.tat,
    estimated_delivery_date: data.expected_delivery_date,
    raw: data,
  };
}

(async () => {
  try {
    const result = await getEstimatedDeliveryDate({
      origin_pin: 799003,
      destination_pin: 799001,
    });

    console.log("📦 Delivery:", result);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();

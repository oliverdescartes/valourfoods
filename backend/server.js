const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const axios = require("axios");
const EMAIL = "bhattacharyapritam58@gmail.com";
const PASSWORD = "e6e$cBv82mf@Sq^6T86MM2%WBz5!TqIg";

// ===== DELHIVERY CONFIG =====
const DELHIVERY_TOKEN = "4d4127ef7554bf701307e208fc35d9feb15648de";
pickup = 799001;
delivert_pin = 799003;

function getMinDays(daysStr) {
  if (!daysStr) return Infinity;
  const match = daysStr.toString().match(/\d+/);
  return match ? parseInt(match[0]) : Infinity;
}

function formatShiprocketCourier(c) {
  return {
    source: "Shiprocket",
    name: c.courier_name,
    price: c.rate,
    delivery_days: c.estimated_delivery_days,
    min_days: getMinDays(c.estimated_delivery_days),
  };
}

function getCheapest(list) {
  return list.reduce((min, c) => (c.price < min.price ? c : min));
}

function getFastest(list) {
  return list.reduce((fast, c) => (c.min_days < fast.min_days ? c : fast));
}

function getBest(list) {
  return [...list].sort((a, b) => {
    if (a.min_days !== b.min_days) return a.min_days - b.min_days;
    return a.price - b.price;
  })[0];
}

// ============================
// SHIPROCKET
// ============================

async function getShiprocketCouriers() {
  try {
    const login = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      { email: EMAIL, password: PASSWORD },
      { timeout: 5000 },
    );

    const token = login.data.token;

    const res = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/courier/serviceability/",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          pickup_postcode: 799003,
          delivery_postcode: 799155,
          weight: 1,
          cod: 0,
          length: 20,
          breadth: 11,
          height: 15,
        },
        timeout: 5000,
      },
    );

    const raw = res.data?.data?.available_courier_companies;

    if (!raw || raw.length === 0) return [];

    return raw.map(formatShiprocketCourier);
  } catch (err) {
    console.error("Shiprocket Error:", err.response?.data || err.message);
    return [];
  }
}

// ============================
// DELHIVERY SERVICEABILITY
// ============================

async function checkDelhiveryServiceability(pincode) {
  try {
    const res = await axios.get(
      "https://track.delhivery.com/c/api/pin-codes/json/",
      {
        headers: { Authorization: `Token ${DELHIVERY_TOKEN}` },
        params: { filter_codes: pincode },
        timeout: 5000,
      },
    );
    // console.log(pincode);

    const data = res.data.delivery_codes;

    const isValid = data && data.length > 0 && data[0].remark !== "Embargo";

    // console.log("📍 Delhivery Serviceable:", isValid);

    return isValid;
  } catch (err) {
    console.error(
      "Delhivery Serviceability Error:",
      err.response?.data || err.message,
    );
    return false;
  }
}

// ============================
// DELHIVERY RATE FILTER (FIXED)
// ============================

function pickCorrectDelhiveryRate(data, paymentType = "Prepaid") {
  const normalizedType = paymentType.toLowerCase();

  let selected = data.find((item) => item.ss?.toLowerCase() === "delivered");

  if (!selected) {
    selected = data.find((item) => item.ss?.toLowerCase() === "delivered");
  }

  return selected;
}

// ============================
// DELHIVERY RATE API
// ============================

async function getDelhiveryRates() {
  try {
    const res = await axios.get(
      "https://track.delhivery.com/api/kinko/v1/invoice/charges/.json",
      {
        headers: {
          Authorization: `Token ${DELHIVERY_TOKEN}`,
        },
        params: {
          md: "S",
          cgm: 1000,
          o_pin: 799003,
          d_pin: delivert_pin,
          ss: "Delivered",
          pt: "Prepaid", // still required for API call
          l: 20,
          b: 11,
          h: 15,
          ipkg_type: "box",
        },
        timeout: 7000,
      },
    );

    // console.log("📦 Raw Delhivery Rates:", res.data);

    const allRates = Array.isArray(res.data) ? res.data : [res.data];

    // 🔥 Convert ALL into courier-like objects
    const options = allRates.map((item) => ({
      source: "Delhivery",
      name: `Delhivery (${item.pt || "Unknown"})`,
      price: item.total_amount,
      base_price: item.charge_DL,
      zone: item.zone,
      charged_weight: item.charged_weight,
      payment_type: item.pt,
      delivery_days: "2-3",
      min_days: 2,
    }));

    return options;
  } catch (err) {
    console.error("Delhivery Rate Error:", err.response?.data || err.message);
    return [];
  }
}
// ============================
// DELHIVERY COMBINED
// ============================
async function getDelhiveryOptions() {
  const isServiceable = await checkDelhiveryServiceability(799003);

  if (!isServiceable) {
    console.log("❌ Delhivery not serviceable");
    return [];
  }

  return await getDelhiveryRates();
}

// ============================
// MAIN RUNNER
// ============================

async function run() {
  try {
    console.log("🔄 Fetching courier options...\n");

    const [shiprocket, delhiveryList] = await Promise.all([
      getShiprocketCouriers(),
      getDelhiveryOptions(),
    ]);

    // console.log("\n📦 Shiprocket:", shiprocket);
    // console.log("📦 Delhivery:", delhiveryList);

    let allOptions = [...shiprocket, ...delhiveryList];

    if (allOptions.length === 0) {
      console.log("❌ No delivery options available");
      return;
    }

    const cheapest = getCheapest(allOptions);
    const fastest = getFastest(allOptions);
    const best = getBest(allOptions);

    // console.log("\n📊 FINAL COMPARISON");
    // console.log("💰 Cheapest:", cheapest);
    // console.log("⚡ Fastest:", fastest);
    // console.log("🏆 Best:", best);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}
// ============================
// RUN
// ============================

run();

const API_VERSION = "v25.0";
const PHONE_NUMBER_ID = "1045071195365149";

const ACCESS_TOKEN =
  "EAA3lacKOE3wBRfP49y0lhMCaY3AflgQrmXL1AzzHyXIUxn7YIoKfao1HhWtyuI482UhBmOrdjTWg2kplog6NigGoa0Q2qOnSwzbhTbCymTk83Xv527WaFLjCMyAv3V2HmZCbO20fsdOUiCLZBqyCUUGlIcGKexkdQEhxnvD9wuoPKf4ZABM84TEOWNJZC36Nl3JHcQha0egiwKsUS3GZCAicWpr7NxkQy5Igo6dxidi45skrM6EsoZAuHylMKZBU4hvTybN2Jm5UZCzSTZAZB3aZC0fZAAZDZD";
const RECIPIENT_PHONE = "919233054806";

const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

const headers = {
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

const data = {
  messaging_product: "whatsapp",
  to: RECIPIENT_PHONE,
  type: "template",
  template: {
    name: "hello_world",
    language: {
      code: "en_US",
    },
  },
};

async function sendMessage() {
  try {
    const response = await axios.post(url, data, {
      headers,
      timeout: 30000,
    });
    console.log("semding...");

    console.log(response.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}

sendMessage();
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// DEBUG
// ======================
app.use((req, res, next) => {
  console.log("➡️ Request:", req.method, req.url);
  next();
});

// ======================
// API ROUTES (🔥 MUST BE FIRST)
// ======================
app.use("/auth", require("./routes/auth"));
app.use("/user", require("./routes/user"));

// ======================
// STATIC FILE SERVING
// ======================
const rootPath = path.join(__dirname, "../");

app.use(express.static(rootPath));
app.use("/assets", express.static(path.join(rootPath, "assets")));
app.use("/vendor", express.static(path.join(rootPath, "vendor")));

// ======================
// ROUTES
// ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(rootPath, "index.html"));
});

app.get("/checkout", (req, res) => {
  res.sendFile(path.join(rootPath, "checkout.html"));
});

// ======================
// FALLBACK
// ======================
app.use((req, res) => {
  res.status(404).send("❌ Route not found");
});

// ======================
// START SERVER
// ======================
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

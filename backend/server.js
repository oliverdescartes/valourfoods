const express = require("express");
const cors = require("cors");
const path = require("path");
const https = require("https");
require("dotenv").config();
const connectDB = require("./db");

const app = express();
const axios = require("axios");
const EMAIL = "bhattacharyapritam58@gmail.com";
const PASSWORD = "e6e$cBv82mf@Sq^6T86MM2%WBz5!TqIg";

const OpenAI = require("openai");

const aiClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",

  apiKey: process.env.OPENROUTER_API_KEY,
});

let db;

(async () => {
  db = await connectDB();
})();

// ---------------for getting messages WB and processing with Ai-------------------
async function sendMessage(phone, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,

      {
        messaging_product: "whatsapp",

        to: phone,

        type: "text",

        text: {
          body: message,
        },
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`,

          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

async function processImageWithAI(url) {
  const imageResponse = await axios.get(url, {
    responseType: "arraybuffer",

    headers: {
      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
    },
  });

  const imageBuffer = Buffer.from(imageResponse.data);

  console.log("Image buffer ready");
  console.log(imageBuffer);

  // SEND TO AI MODEL HERE
}

app.use(express.json());

const token = process.env.AUTH_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
// ========================================
// WEBHOOK MESSAGE FLOW
// ========================================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === "valour123") {
    console.log("WEBHOOK CONNECTED");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const phone = message.from;

    const text = message.text?.body?.trim() || "";

    console.log(phone, text);

    // ========================================
    // COLLECTIONS
    // ========================================

    const users = db.collection("users");

    const sessions = db.collection("sessions");

    const flowDefinitions = db.collection("flow_definitions");

    const hesitationRecovery = db.collection("hesitation_recovery");

    const messages = db.collection("messages");

    const cookingFeedback = db.collection("cooking_feedback");

    // ========================================
    // GREETING HANDLER
    // ========================================

    const greetings = ["hi", "hello", "hey", "yo", "hii"];

    if (greetings.includes(text.toLowerCase())) {
      await sendMessage(
        phone,

        `Hi 😊

What would you like to do today?

1. Cook Milky Mustard Fish
2. Ask A Question`,
      );

      return res.sendStatus(200);
    }

    // ========================================
    // FIND / CREATE USER
    // ========================================

    let user = await users.findOne({
      phone,
    });

    if (!user) {
      const result = await users.insertOne({
        phone,

        current_stage: "new_user",

        preferred_quantity: null,

        confidence_level: "beginner",

        flavor_preference: "balanced",

        total_cooks: 0,

        created_at: new Date(),

        last_active_at: new Date(),
      });

      user = await users.findOne({
        _id: result.insertedId,
      });
    }

    // ========================================
    // UPDATE LAST ACTIVE
    // ========================================

    await users.updateOne(
      {
        _id: user._id,
      },

      {
        $set: {
          last_active_at: new Date(),
        },
      },
    );

    // ========================================
    // FIND ACTIVE SESSION
    // ========================================

    let session = await sessions.findOne({
      user_id: user._id,

      status: "active",
    });

    // ========================================
    // CREATE SESSION
    // ========================================

    if (!session) {
      const sessionResult = await sessions.insertOne({
        user_id: user._id,

        status: "active",

        current_state: "idle",

        selected_quantity: null,

        active_flow_id: null,

        interruption_count: 0,

        started_at: new Date(),

        updated_at: new Date(),
      });

      session = await sessions.findOne({
        _id: sessionResult.insertedId,
      });
    }

    // ========================================
    // SAVE MESSAGE
    // ========================================

    await messages.insertOne({
      user_id: user._id,

      session_id: session._id,

      role: "user",

      message_type: "message",

      content: text,

      created_at: new Date(),
    });

    // ========================================
    // CURRENT STATE
    // ========================================

    const currentState = session.current_state;

    // ========================================
    // ACTIVE FLOW STATES
    // ========================================

    const activeStates = ["quantity_selection", "guided_cooking"];

    const activeFlow = activeStates.includes(currentState);

    // ========================================
    // ACTIVE FLOW
    // ========================================

    if (activeFlow) {
      // ========================================
      // QUANTITY SELECTION
      // ========================================

      if (currentState === "quantity_selection") {
        const validQuantities = ["250g", "500g", "1kg"];

        // ========================================
        // VALID QUANTITY
        // ========================================

        if (validQuantities.includes(text.toLowerCase())) {
          const quantity = text.toLowerCase();

          let flowId = null;

          if (quantity === "250g") {
            flowId = "fish_250g_flow";
          }

          if (quantity === "500g") {
            flowId = "fish_500g_flow";
          }

          if (quantity === "1kg") {
            flowId = "fish_1kg_flow";
          }

          const flow = await flowDefinitions.findOne({
            _id: flowId,
          });

          if (!flow) {
            await sendMessage(
              phone,

              "Cooking flow not found.",
            );

            return res.sendStatus(200);
          }

          // ========================================
          // UPDATE SESSION
          // ========================================

          await sessions.updateOne(
            {
              _id: session._id,
            },

            {
              $set: {
                current_state: "guided_cooking",

                selected_quantity: quantity,

                active_flow_id: flow._id,

                updated_at: new Date(),
              },
            },
          );

          // ========================================
          // FLOW STEPS
          // ========================================

          const steps = flow.steps.map((step) => `• ${step.text}`).join("\n");

          await sendMessage(phone, steps);

          return res.sendStatus(200);
        }

        // ========================================
        // HESITATION DETECTION
        // ========================================

        const hesitation = await hesitationRecovery.findOne({
          $or: [
            {
              trigger: "Spice Fear",
            },

            {
              trigger: "Fish Smell",
            },

            {
              trigger: "Beginner Help",
            },
          ],
        });

        // ========================================
        // AI INTERRUPTION
        // ========================================

        const aiReply = await askAI({
          userMessage: text,

          session,

          user,
        });

        await sendMessage(
          phone,

          `${aiReply}

What quantity are you cooking tonight?

1. 250g
2. 500g
3. 1kg`,
        );

        return res.sendStatus(200);
      }

      // ========================================
      // GUIDED COOKING
      // ========================================

      if (currentState === "guided_cooking") {
        const aiReply = await askAI({
          userMessage: text,

          session,

          user,
        });

        await sendMessage(phone, aiReply);

        return res.sendStatus(200);
      }
    }

    // ========================================
    // ENTRY ROUTING
    // ========================================

    const route = await routeByEntryPoint({
      userMessage: text,
    });

    console.log("Route:", route);

    // ========================================
    // START COOKING FLOW
    // ========================================

    if (route === "cook_milky_mustard_fish") {
      await sessions.updateOne(
        {
          _id: session._id,
        },

        {
          $set: {
            current_state: "quantity_selection",

            updated_at: new Date(),
          },
        },
      );

      await sendMessage(
        phone,

        `Great 😊

What quantity are you cooking tonight?

1. 250g
2. 500g
3. 1kg`,
      );

      return res.sendStatus(200);
    }

    // ========================================
    // SUPPORT
    // ========================================

    if (route === "support") {
      await sendMessage(
        phone,

        "I’ll help you with that. Could you briefly describe the issue?",
      );

      return res.sendStatus(200);
    }

    // ========================================
    // GENERAL AI
    // ========================================

    const aiReply = await askAI({
      userMessage: text,

      session,

      user,
    });

    await sendMessage(phone, aiReply);

    return res.sendStatus(200);
  } catch (err) {
    console.error(err);

    return res.sendStatus(500);
  }
});
// ---------------end-------------------

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

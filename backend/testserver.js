// ========================================
// VALOUR MVP
// Step-Based Guided Cooking System
// WhatsApp + MongoDB + Node.js
// ========================================

const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const OpenAI = require("openai");

dotenv.config();

const app = express();

app.use(express.json());

const VERIFY_TOKEN = "valour123";

// ========================================
// OPENROUTER
// ========================================

const aiClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",

  apiKey: process.env.OPENROUTER_API_KEY,
});

// ========================================
// MONGODB
// ========================================

const client = new MongoClient(process.env.MONGO_URI);

let db;

async function connectDB() {
  await client.connect();

  db = client.db("valour_mvp");

  console.log("✅ MongoDB Connected");
}

connectDB();

// ========================================
// COLLECTIONS
// ========================================

function collections() {
  return {
    users: db.collection("users"),

    sessions: db.collection("sessions"),

    messages: db.collection("messages"),

    cookingOutcomes: db.collection("cooking_outcomes"),

    flowDefinitions: db.collection("flow_definitions"),

    hesitationRecovery: db.collection("hesitation_recovery"),
  };
}

// ========================================
// SEND MESSAGE
// ========================================

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

// ========================================
// SAVE MESSAGE
// ========================================

async function saveMessage({ userId, sessionId, role, content }) {
  const { messages } = collections();

  await messages.insertOne({
    user_id: userId,

    session_id: sessionId,

    role,

    content,

    created_at: new Date(),
  });
}

// ========================================
// GET USER
// ========================================

async function getOrCreateUser(phone) {
  const { users } = collections();

  let user = await users.findOne({
    phone,
  });

  if (!user) {
    const result = await users.insertOne({
      phone,

      created_at: new Date(),

      last_seen_at: new Date(),
    });

    user = await users.findOne({
      _id: result.insertedId,
    });
  }

  await users.updateOne(
    {
      _id: user._id,
    },

    {
      $set: {
        last_seen_at: new Date(),
      },
    },
  );

  return user;
}

// ========================================
// GET SESSION
// ========================================

async function getOrCreateSession(userId) {
  const { sessions } = collections();

  let session = await sessions.findOne({
    user_id: userId,

    active: true,
  });

  if (!session) {
    const result = await sessions.insertOne({
      user_id: userId,

      active: true,

      current_state: "idle",

      selected_quantity: null,

      active_flow_id: null,

      current_step_index: 0,

      started_at: new Date(),
    });

    session = await sessions.findOne({
      _id: result.insertedId,
    });
  }

  return session;
}

// ========================================
// UPDATE SESSION
// ========================================

async function updateSession(sessionId, updates) {
  const { sessions } = collections();

  await sessions.updateOne(
    {
      _id: sessionId,
    },

    {
      $set: updates,
    },
  );
}

// ========================================
// REASSURANCE AI
// ========================================

async function reassuranceAI(userMessage) {
  try {
    const completion = await aiClient.chat.completions.create({
      model: "openrouter/owl-alpha",

      temperature: 0.1,

      max_tokens: 80,

      messages: [
        {
          role: "system",

          content: `
You are a calm cooking reassurance layer for VALOUR.

DO NOT:
- invent recipes
- change quantities
- generate cooking steps
- introduce yourself
- behave like chatbot
- overexplain

ONLY:
- reassure
- reduce fear
- answer briefly

Tone:
- calm
- premium
- minimal
`,
        },

        {
          role: "user",

          content: userMessage,
        },
      ],
    });

    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error(err);

    return "Keep it simple 👌";
  }
}

// ========================================
// START COOKING FLOW
// ========================================

async function startCookingFlow({ session, phone }) {
  await updateSession(session._id, {
    current_state: "awaiting_quantity",
  });

  await sendMessage(
    phone,

    `How much fish are you cooking?

1. 250g
2. 500g
3. 1kg`,
  );
}

// ========================================
// HANDLE QUANTITY
// ========================================

async function handleQuantity({ session, text, phone }) {
  const lower = text.toLowerCase();

  let quantity = null;

  if (lower === "1" || lower.includes("250")) {
    quantity = "250g";
  }

  if (lower === "2" || lower.includes("500")) {
    quantity = "500g";
  }

  if (lower === "3" || lower.includes("1kg")) {
    quantity = "1kg";
  }

  // ========================================
  // INVALID INPUT
  // ========================================

  if (!quantity) {
    const aiReply = await reassuranceAI(text);

    await sendMessage(
      phone,

      `${aiReply}

How much fish are you cooking?

1. 250g
2. 500g
3. 1kg`,
    );

    return;
  }

  // ========================================
  // LOAD FLOW
  // ========================================

  const { flowDefinitions } = collections();

  const flow = await flowDefinitions.findOne({
    quantity,
  });

  if (!flow) {
    await sendMessage(
      phone,

      `Cooking flow unavailable right now.`,
    );

    return;
  }

  // ========================================
  // SAVE SESSION
  // ========================================

  await updateSession(session._id, {
    current_state: "guided_cooking",

    selected_quantity: quantity,

    active_flow_id: flow._id,

    current_step_index: 0,
  });

  // ========================================
  // SEND FIRST STEP
  // ========================================

  const firstStep = flow.steps[0];

  await sendMessage(
    phone,

    `Step 1/${flow.steps.length}

${firstStep.text}

Reply NEXT when ready.`,
  );
}

// ========================================
// HANDLE GUIDED COOKING
// ========================================

async function handleGuidedCooking({ session, text, phone, userId }) {
  const lower = text.toLowerCase();

  // ========================================
  // NEXT STEP
  // ========================================

  if (lower === "next") {
    const { flowDefinitions } = collections();

    const flow = await flowDefinitions.findOne({
      _id: session.active_flow_id,
    });

    if (!flow) {
      await sendMessage(
        phone,

        `Cooking flow unavailable.`,
      );

      return;
    }

    const nextIndex = session.current_step_index + 1;

    // ========================================
    // FLOW COMPLETE
    // ========================================

    if (nextIndex >= flow.steps.length) {
      const { cookingOutcomes } = collections();

      await cookingOutcomes.insertOne({
        user_id: userId,

        quantity: session.selected_quantity,

        outcome: "successful",

        created_at: new Date(),
      });

      await updateSession(session._id, {
        current_state: "post_cook_feedback",
      });

      await sendMessage(
        phone,

        `Done 👌

How did your curry feel?

1. Loved It
2. Too Strong
3. Too Mild
4. Need Help`,
      );

      return;
    }

    // ========================================
    // SEND NEXT STEP
    // ========================================

    const nextStep = flow.steps[nextIndex];

    await updateSession(session._id, {
      current_step_index: nextIndex,
    });

    await sendMessage(
      phone,

      `Step ${nextIndex + 1}/${flow.steps.length}

${nextStep.text}

Reply NEXT when ready.`,
    );

    return;
  }

  // ========================================
  // HESITATION RECOVERY
  // ========================================

  const { hesitationRecovery } = collections();

  const recoveryFlows = await hesitationRecovery.find().toArray();

  for (const item of recoveryFlows) {
    const matched = item.keywords.some((keyword) =>
      lower.includes(keyword.toLowerCase()),
    );

    if (matched) {
      await sendMessage(
        phone,

        `${item.response}

${item.follow_up}`,
      );

      return;
    }
  }

  // ========================================
  // AI FALLBACK
  // ========================================

  const aiReply = await reassuranceAI(text);

  await sendMessage(phone, aiReply);
}

// ========================================
// POST COOK FEEDBACK
// ========================================

async function handlePostCookFeedback({ session, text, phone }) {
  const lower = text.toLowerCase();

  if (lower === "1" || lower.includes("loved")) {
    await sendMessage(
      phone,

      `Really glad to hear that 👌`,
    );
  } else if (lower === "2" || lower.includes("strong")) {
    await sendMessage(
      phone,

      `Next time:
• reduce quantity slightly
• use little more water
• keep flame medium`,
    );
  } else if (lower === "3" || lower.includes("mild")) {
    await sendMessage(
      phone,

      `Next time:
• slightly increase VALOUR
• reduce extra water slightly`,
    );
  } else if (lower === "4" || lower.includes("help")) {
    await sendMessage(
      phone,

      `Tell me what felt difficult.

Examples:
• texture
• spice level
• fish smell
• cooking timing`,
    );

    return;
  } else {
    const aiReply = await reassuranceAI(text);

    await sendMessage(phone, aiReply);

    return;
  }

  await updateSession(session._id, {
    current_state: "idle",
  });
}

// ========================================
// WEBHOOK VERIFY
// ========================================

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];

  const token = req.query["hub.verify_token"];

  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFIED");

    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// ========================================
// MAIN WEBHOOK
// ========================================

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const phone = message.from;

    const text = message.text?.body?.trim() || "";

    const lower = text.toLowerCase();

    console.log(phone, text);

    // ========================================
    // USER + SESSION
    // ========================================

    const user = await getOrCreateUser(phone);

    const session = await getOrCreateSession(user._id);

    // ========================================
    // SAVE MESSAGE
    // ========================================

    await saveMessage({
      userId: user._id,

      sessionId: session._id,

      role: "user",

      content: text,
    });

    // ========================================
    // SUPPORT
    // ========================================

    const supportKeywords = [
      "refund",
      "damaged",
      "broken",
      "late",
      "delivery",
      "replace",
      "support",
    ];

    const isSupport = supportKeywords.some((k) => lower.includes(k));

    if (isSupport) {
      await updateSession(session._id, {
        current_state: "support_mode",
      });

      await sendMessage(
        phone,

        `I’ll help you with that.

Please briefly describe the issue.`,
      );

      return res.sendStatus(200);
    }

    // ========================================
    // GREETING
    // ========================================

    const greetings = ["hi", "hello", "hey", "hii"];

    if (
      greetings.includes(lower) ||
      lower.includes("recipe") ||
      lower.includes("cook") ||
      lower.includes("fish")
    ) {
      await sendMessage(
        phone,

        `Hey 👋

This is VALOUR.

Ready to make restaurant-style mustard fish at home — without grinding spices or complicated prep?

1. Show Recipe
2. What Is VALOUR?
3. Buy Now`,
      );

      return res.sendStatus(200);
    }

    // ========================================
    // WHAT IS VALOUR
    // ========================================

    if (lower === "2" || lower.includes("what is")) {
      await sendMessage(
        phone,

        `MILKY MUSTARD is a ready cooking base for Bengali-style mustard fish curry.

No mustard grinding.
No coconut prep.
No messy spice process.

Just:
oil → fish → VALOUR → cook.`,
      );

      return res.sendStatus(200);
    }

    // ========================================
    // BUY NOW
    // ========================================

    if (lower === "3" || lower.includes("buy")) {
      await sendMessage(
        phone,

        `You can order here:

https://yourwebsite.com`,
      );

      return res.sendStatus(200);
    }

    // ========================================
    // START FLOW
    // ========================================

    if (lower === "1" || lower.includes("show recipe")) {
      await startCookingFlow({
        session,
        phone,
      });

      return res.sendStatus(200);
    }

    // ========================================
    // QUANTITY FLOW
    // ========================================

    if (session.current_state === "awaiting_quantity") {
      await handleQuantity({
        session,
        text,
        phone,
      });

      return res.sendStatus(200);
    }

    // ========================================
    // GUIDED COOKING
    // ========================================

    if (session.current_state === "guided_cooking") {
      await handleGuidedCooking({
        session,
        text,
        phone,
        userId: user._id,
      });

      return res.sendStatus(200);
    }

    // ========================================
    // POST COOK FEEDBACK
    // ========================================

    if (session.current_state === "post_cook_feedback") {
      await handlePostCookFeedback({
        session,
        text,
        phone,
      });

      return res.sendStatus(200);
    }

    // ========================================
    // SUPPORT MODE
    // ========================================

    if (session.current_state === "support_mode") {
      await sendMessage(
        phone,

        `Thanks. Our support team will review this shortly.`,
      );

      return res.sendStatus(200);
    }

    // ========================================
    // FALLBACK
    // ========================================

    await sendMessage(
      phone,

      `You can start with:

1. Show Recipe
2. What Is VALOUR?
3. Buy Now`,
    );

    return res.sendStatus(200);
  } catch (err) {
    console.error(err);

    return res.sendStatus(500);
  }
});

// ========================================
// SERVER
// ========================================

app.listen(3000, () => {
  console.log("✅ VALOUR running on port 3000");
});

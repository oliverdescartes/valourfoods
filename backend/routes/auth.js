const express = require("express");
const router = express.Router();

const { readDB, writeDB, normalizePhone } = require("../utils/db");

// ======================
// OTP STORE
// ======================
let otpStore = {};

// ======================
// SEND OTP
// ======================
router.post("/send-otp", (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }

    const normalized = normalizePhone(phone);

    const otp = "1234"; // demo

    otpStore[normalized] = {
      otp,
      expires: Date.now() + 2 * 60 * 1000, // 2 min
    };

    console.log(`OTP for ${normalized}: ${otp}`);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ SEND OTP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ======================
// VERIFY OTP (LOGIN / SIGNUP)
// ======================
router.post("/verify-otp", (req, res) => {
  try {
    const { phone, name, otp } = req.body;

    // ✅ validation
    if (!phone || !otp) {
      return res.status(400).json({ error: "Missing phone or OTP" });
    }

    const normalized = normalizePhone(phone);

    const record = otpStore[normalized];

    // ✅ OTP validation
    if (!record) {
      return res.status(400).json({ error: "OTP not requested" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (Date.now() > record.expires) {
      return res.status(400).json({ error: "OTP expired" });
    }

    let users = readDB();

    // safety check
    if (!Array.isArray(users)) users = [];

    let user = users.find((u) => u.phone === normalized);

    // ======================
    // SIGNUP (if new user)
    // ======================
    if (!user) {
      user = {
        id: Date.now().toString(),
        name: name || "User",
        phone: normalized,
        address: "",
        orders: [],
      };

      users.push(user);
      writeDB(users);
    }

    // remove used OTP
    delete otpStore[normalized];

    const token = "token_" + user.id;

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error("❌ VERIFY OTP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ======================
// GET CURRENT USER
// ======================
router.get("/me", (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: "No token" });
    }

    const userId = token.replace("token_", "");

    let users = readDB();

    if (!Array.isArray(users)) users = [];

    let user = users.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("❌ ME ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

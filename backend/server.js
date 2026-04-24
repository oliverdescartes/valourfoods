const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ======================
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

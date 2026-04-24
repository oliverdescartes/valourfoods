const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "../db/users.json");

function readDB() {
  return JSON.parse(fs.readFileSync(DB));
}

function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

function normalizePhone(phone) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits;
  return "+" + digits;
}

module.exports = { readDB, writeDB, normalizePhone };

const express = require("express");
const router = express.Router();

const { readDB, writeDB } = require("../utils/helpers");

// get address
router.get("/:id/address", (req, res) => {
  let users = readDB();
  let user = users.find((u) => u.id === req.params.id);

  res.json(user?.addresses || []);
});

// add address
router.post("/:id/address", (req, res) => {
  let users = readDB();
  let user = users.find((u) => u.id === req.params.id);

  const addr = {
    id: Date.now().toString(),
    text: req.body.text,
  };

  user.addresses.push(addr);
  writeDB(users);

  res.json(addr);
});

module.exports = router;

"use strict";
// Read-only configuration audit. No HTTP calls, DB access, or secret-value output.
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const { diagnostics } = require("./meta");
console.info(JSON.stringify(diagnostics(), null, 2));

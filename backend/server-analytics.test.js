"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { _test: { app, acquisitionDateRange, cleanAcquisitionFilter } } = require("./server");

async function withServer(run) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test("acquisition and customer-management endpoints require the admin token", async () => {
  await withServer(async base => {
    for (const path of ["/api/admin/acquisition", "/api/admin/acquisition.csv", "/api/admin/users", "/api/admin/users/507f1f77bcf86cd799439011"]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 401);
    }
  });
});

test("attribution browser code is served while unknown root files remain private", async () => {
  await withServer(async base => {
    const attribution = await fetch(base + "/attribution.js");
    assert.equal(attribution.status, 200);
    assert.match(await attribution.text(), /latestNonDirect/);
    assert.equal((await fetch(base + "/backend/.env")).status, 404);
  });
});

test("admin dashboard exposes responsive customer management and workflow actions", () => {
  const html = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "admin-dashboard.html"), "utf8");
  for (const marker of [
    'data-tab="customers"',
    'id="customers-panel"',
    'id="customer-search"',
    'id="customer-detail"',
    'data-customer-action="orders"',
    'data-customer-action="conversation"',
    'data-customer-action="template"',
    'data-customer-action="consent"',
    'data-customer-action="coupon"',
    '"Full name", user.name',
    '"Address", user.address',
    '"Landmark", user.landmark',
    '"Pincode", user.pincode',
    '"Last order", dateTime',
    '"Purchase intent", user.purchaseIntent',
    '"Latest feedback", summary.latestFeedback',
    '<h3>Action history</h3>',
    'Lead score',
    'PRE-ORDER · ZERO STOCK',
    'Pre-order recorded while stock was zero',
    'Awaiting-stock pre-orders',
    "/api/admin/users",
  ]) assert.match(html, new RegExp(marker));
  assert.match(html, /@media \(max-width: 760px\)[\s\S]*\.customer-layout \{ grid-template-columns: 1fr; \}/);
});

test("admin date filters use complete Asia/Kolkata calendar days", () => {
  const range = acquisitionDateRange({ start: "2026-09-01", end: "2026-09-02" });
  assert.equal(range.start.toISOString(), "2026-08-31T18:30:00.000Z");
  assert.equal(range.end.toISOString(), "2026-09-02T18:29:59.999Z");
  assert.equal(cleanAcquisitionFilter(" Instagram<script> "), "instagramscript");
  assert.throws(() => acquisitionDateRange({ start: "2025-01-01", end: "2026-09-02" }), /366 days/);
});

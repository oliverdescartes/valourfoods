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

test("acquisition reporting and CSV endpoints require the admin token", async () => {
  await withServer(async base => {
    for (const path of ["/api/admin/acquisition", "/api/admin/acquisition.csv"]) {
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

test("admin date filters use complete Asia/Kolkata calendar days", () => {
  const range = acquisitionDateRange({ start: "2026-09-01", end: "2026-09-02" });
  assert.equal(range.start.toISOString(), "2026-08-31T18:30:00.000Z");
  assert.equal(range.end.toISOString(), "2026-09-02T18:29:59.999Z");
  assert.equal(cleanAcquisitionFilter(" Instagram<script> "), "instagramscript");
  assert.throws(() => acquisitionDateRange({ start: "2025-01-01", end: "2026-09-02" }), /366 days/);
});

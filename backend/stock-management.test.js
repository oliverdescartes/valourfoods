"use strict";

process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createDatabase } = require("./whatsapp-test-db");
const {
  _test: {
    app,
    setDatabaseForTests,
    buildStockStatus,
    assertStockAvailable,
    consumeStock,
  },
} = require("./server");

async function withServer(run) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("stock status blocks zero and insufficient quantities", () => {
  const request = [{ sku: "velvety-butter-chicken", quantity: 2 }];
  const zero = [{
    sku: "velvety-butter-chicken",
    name: "Velvety Butter Chicken",
    active: true,
    stockQuantity: 0,
  }];
  assert.equal(buildStockStatus(request, zero).available, false);
  assert.throws(
    () => assertStockAvailable(request, zero),
    (error) =>
      error.statusCode === 409 &&
      error.code === "OUT_OF_STOCK" &&
      error.unavailableItems[0].stockQuantity === 0,
  );

  const enough = [{ ...zero[0], stockQuantity: 2 }];
  assert.equal(buildStockStatus(request, enough).available, true);
});

test("admin can set stock to zero and checkout reports it unavailable", async () => {
  const database = createDatabase();
  setDatabaseForTests(database);
  process.env.ORDER_ADMIN_TOKEN = "stock-test-token";
  await database.collection("products").insertOne({
    sku: "velvety-butter-chicken",
    name: "Velvety Butter Chicken",
    size: "520 ml",
    active: true,
  });

  await withServer(async (base) => {
    const unauthorized = await fetch(`${base}/api/admin/stock`);
    assert.equal(unauthorized.status, 401);

    const saved = await fetch(
      `${base}/api/admin/stock/velvety-butter-chicken`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-token": "stock-test-token",
        },
        body: JSON.stringify({ stockQuantity: 0 }),
      },
    );
    assert.equal(saved.status, 200);
    assert.equal((await saved.json()).product.stockQuantity, 0);

    const checked = await fetch(`${base}/api/stock/check`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: [{ sku: "velvety-butter-chicken", quantity: 1 }],
      }),
    });
    assert.equal(checked.status, 200);
    const result = await checked.json();
    assert.equal(result.stock.available, false);
    assert.equal(result.stock.unavailableItems[0].stockQuantity, 0);

    const quote = await fetch(`${base}/api/checkout/quote`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: [{ sku: "velvety-butter-chicken", quantity: 1 }],
        pincode: "799001",
      }),
    });
    assert.equal(quote.status, 409);
    assert.equal((await quote.json()).code, "OUT_OF_STOCK");
    assert.equal(await database.collection("orders").countDocuments({}), 0);
  });
});

test("confirmed-order stock consumption is atomic for a product", async () => {
  const database = createDatabase();
  setDatabaseForTests(database);
  await database.collection("products").insertOne({
    sku: "velvety-butter-chicken",
    name: "Velvety Butter Chicken",
    active: true,
    stockQuantity: 2,
  });

  await consumeStock([{ sku: "velvety-butter-chicken", quantity: 2 }]);
  const product = await database
    .collection("products")
    .findOne({ sku: "velvety-butter-chicken" });
  assert.equal(product.stockQuantity, 0);
  await assert.rejects(
    consumeStock([{ sku: "velvety-butter-chicken", quantity: 1 }]),
    (error) => error.code === "OUT_OF_STOCK" && error.statusCode === 409,
  );
});

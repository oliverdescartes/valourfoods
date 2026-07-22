const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { MongoClient } = require("mongodb");

const products = [
  {
    sku: "velvety-butter-520",
    name: "Velvety Butter Liquid Spice",
    size: "520 ml",
    pricePaise: 35000,
    compareAtPaise: 42500,
    weightKg: 0.7,
    active: true,
  },
];

const rules = {
  _id: "checkout",
  currency: "INR",
  taxRateBps: 500,
  taxInclusive: false,
  freeShippingThresholdPaise: 79900,
  defaultShippingPaise: 6500,
  coupons: {
    WELCOME10: { active: true, type: "percent", value: 10, minSubtotalPaise: 0 },
    FIRSTORDER: { active: true, type: "fixed", valuePaise: 7500, minSubtotalPaise: 49900 },
    VALOURVIP: { active: true, type: "percent", value: 15, minSubtotalPaise: 79900 },
  },
  updatedAt: new Date(),
};

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const database = client.db("valour_mvp");
    for (const product of products) {
      await database.collection("products").updateOne(
        { sku: product.sku },
        { $set: { ...product, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      );
    }
    await database.collection("pricing_rules").updateOne(
      { _id: rules._id },
      { $set: rules, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
    console.log(`Seeded ${products.length} product(s) and checkout pricing rules`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

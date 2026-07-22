const assert = require("assert");
const { calculateQuote } = require("./pricing");

const products = [{ sku: "sku-1", name: "Product", size: "1 unit", pricePaise: 35000, active: true }];
const rules = { taxRateBps: 500, taxInclusive: false, freeShippingThresholdPaise: 79900, defaultShippingPaise: 6500, coupons: {} };

const quote = calculateQuote({ requestedItems: [{ id: "sku-1", quantity: 2, price: 1 }], products, rules });
assert.equal(quote.subtotalPaise, 70000);
assert.equal(quote.shippingPaise, 6500);
assert.equal(quote.taxPaise, 3500);
assert.equal(quote.totalPaise, 80000);
assert.equal(quote.items[0].unitPricePaise, 35000);
assert.throws(() => calculateQuote({ requestedItems: [{ id: "missing", quantity: 1 }], products, rules }));
console.log("Pricing tests passed");

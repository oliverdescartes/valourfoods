const assert = require("assert");
const { calculateQuote } = require("./pricing");

const products = [{ sku: "sku-1", name: "Product", size: "1 unit", pricePaise: 27500, compareAtPaise: 35000, active: true }];
const rules = { taxRateBps: 0, taxInclusive: true, freeShippingThresholdPaise: 79900, defaultShippingPaise: 6500, coupons: {} };

const quote = calculateQuote({ requestedItems: [{ id: "sku-1", quantity: 2, price: 1 }], products, rules });
assert.equal(quote.subtotalPaise, 70000);
assert.equal(quote.shippingPaise, 6500);
assert.equal(quote.taxPaise, 0);
assert.equal(quote.totalPaise, 76500);
assert.equal(quote.items[0].unitPricePaise, 35000);
assert.equal(quote.items[0].compareAtPaise, 35000);

const discountedQuote = calculateQuote({
  requestedItems: [{ id: "sku-1", quantity: 2 }],
  products,
  rules: {
    ...rules,
    coupons: {
      SAVE10: { active: true, type: "percent", value: 10, minSubtotalPaise: 0 },
    },
  },
  couponCode: "SAVE10",
});
assert.equal(discountedQuote.subtotalPaise, 70000);
assert.equal(discountedQuote.discountPaise, 7000);
assert.equal(discountedQuote.shippingPaise, 6500);
assert.equal(discountedQuote.taxPaise, 0);
assert.equal(discountedQuote.totalPaise, 69500);

assert.throws(() => calculateQuote({ requestedItems: [{ id: "missing", quantity: 1 }], products, rules }));
console.log("Pricing tests passed");

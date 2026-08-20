const assert = require("assert");
const {
  parseProduct,
  parseQuantity,
  parseOrderItems,
  calculateTotals,
  formatCart,
  parseDeliveryDetails,
  validateDeliveryDetails,
  wantsChatNumber,
  normalizeIndianPhone,
} = require("./whatsapp-order");

assert.equal(parseProduct("Velvety Butter").id, "velvety_butter");
assert.equal(parseProduct("buy").id, "velvety_butter");
assert.equal(parseProduct("unknown"), null);
assert.equal(parseQuantity("3 bottles"), 3);
assert.equal(parseQuantity("11"), null);
assert.deepEqual(
  parseOrderItems("Order 2 Velvety Butter Chicken Liquid Spice").map(({ id, quantity }) => ({ id, quantity })),
  [{ id: "velvety_butter", quantity: 2 }],
);
assert.deepEqual(
  parseOrderItems("Mithila fish curry x 4").map(({ id, quantity }) => ({ id, quantity })),
  [],
);
assert.deepEqual(parseOrderItems("Order 12 unknown sauce"), []);
assert.deepEqual(calculateTotals([{ price: 350, quantity: 1 }]), {
  subtotal: 350,
  shipping: 65,
  total: 415,
});
assert.deepEqual(calculateTotals([{ price: 350, quantity: 2 }]), {
  subtotal: 700,
  shipping: 65,
  total: 765,
});
assert.equal(calculateTotals([{ price: 350, quantity: 3 }]).shipping, 0);
assert.match(
  formatCart([{ name: "Velvety Butter Chicken Liquid Spice", price: 350, quantity: 2 }]),
  /Total: Rs\. 765/,
);

const delivery = parseDeliveryDetails(`Name: Priya Deb\nLocality: Badhaghat\nCity: Agartala\nState: Tripura\nPincode: 799003\nHouse/Street (optional): House 12`);
assert.equal(delivery.locality, "Badhaghat");
assert.equal(delivery.addressLine, "House 12");
assert.equal(validateDeliveryDetails(delivery).valid, true);
const positionalDelivery = parseDeliveryDetails(`Priya Deb\nBadhaghat\nAgartala\nTripura\n799003\nNear the old market`);
assert.equal(positionalDelivery.customerName, "Priya Deb");
assert.equal(positionalDelivery.addressLine, "Near the old market");
assert.equal(validateDeliveryDetails(positionalDelivery).valid, true);
assert.deepEqual(
  validateDeliveryDetails({ customerName: "P", city: "123", state: "", locality: "", pincode: "12" }).errors,
  [
    "Name is missing or too short",
    "Locality/area is missing or invalid",
    "City is missing or invalid",
    "State is missing or invalid",
    "Pincode must contain exactly 6 digits",
    "House/street is required",
  ],
);
assert.equal(wantsChatNumber("Please use this number"), true);
assert.equal(normalizeIndianPhone("+91 98765 43210"), "9876543210");
assert.equal(normalizeIndianPhone("09876543210"), "9876543210");
assert.equal(normalizeIndianPhone("12345"), null);

console.log("WhatsApp order unit tests passed");

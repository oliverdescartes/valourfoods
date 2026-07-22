const PRODUCT_CATALOG = {
  velvety_butter: {
    id: "velvety_butter",
    name: "Velvety Butter Chicken",
    size: "520 ml",
    price: 350,
    aliases: ["1", "velvety butter", "butter chicken", "velvety"],
  },
  spicy_mustard: {
    id: "spicy_mustard",
    name: "Mithila Fish Curry",
    size: "520 ml",
    price: 350,
    aliases: ["2", "mithila fish curry", "mithila", "spicy mustard", "mustard fish", "fish curry"],
  },
};

function normalize(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function parseProduct(value = "") {
  const input = normalize(value);
  return Object.values(PRODUCT_CATALOG).find((product) =>
    product.aliases.some((alias) => input === alias || (alias.length > 2 && input.includes(alias))),
  ) || null;
}

function parseQuantity(value = "") {
  const match = String(value).match(/\d+/);
  if (!match) return null;
  const quantity = Number(match[0]);
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 10
    ? quantity
    : null;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseOrderItems(value = "") {
  const input = normalize(value);
  const items = [];

  Object.values(PRODUCT_CATALOG).forEach((product) => {
    const names = [product.name, ...product.aliases]
      .filter((name) => !/^\d+$/.test(name))
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join("|");
    const before = new RegExp(`(?:^|\\b)(\\d{1,2})\\s*(?:x\\s*|bottles?\\s+(?:of\\s+)?)?(?:${names})\\b`, "i");
    const after = new RegExp(`(?:${names})\\b\\s*(?:x|qty|quantity)?\\s*(\\d{1,2})(?:\\b|$)`, "i");
    const match = input.match(before) || input.match(after);
    if (!match) return;
    const quantity = Number(match[1]);
    if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 10) {
      items.push({ ...product, aliases: undefined, quantity });
    }
  });

  return items;
}

function calculateTotals(cart = []) {
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const shipping = subtotal >= 799 ? 0 : 65;
  return { subtotal, shipping, total: subtotal + shipping };
}

function formatCart(cart = []) {
  const totals = calculateTotals(cart);
  const lines = cart.map(
    (line, index) => `${index + 1}. ${line.name} x ${line.quantity} - Rs. ${line.price * line.quantity}`,
  );
  return [
    ...lines,
    `Subtotal: Rs. ${totals.subtotal}`,
    `Shipping: ${totals.shipping ? `Rs. ${totals.shipping}` : "FREE"}`,
    `Total: Rs. ${totals.total}`,
  ].join("\n");
}

function parseDeliveryDetails(value = "") {
  const aliases = {
    name: "customerName",
    "full name": "customerName",
    locality: "locality",
    area: "locality",
    city: "city",
    state: "state",
    pincode: "pincode",
    "pin code": "pincode",
    pin: "pincode",
    "house/street (optional)": "addressLine",
    "house/street": "addressLine",
    "house number/street": "addressLine",
    "house number": "addressLine",
    street: "addressLine",
    address: "addressLine",
  };
  const details = {};
  const positionalValues = [];

  String(value)
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\d+[.)]\s*/, ""))
    .filter(Boolean)
    .forEach((line) => {
      const match = line.match(/^([^:\-=]+?)\s*[:=\-]\s*(.+)$/);
      if (match) {
        const field = aliases[normalize(match[1])];
        if (field) {
          details[field] = match[2].trim();
          return;
        }
      }
      positionalValues.push(line);
    });

  const orderedFields = [
    "customerName",
    "locality",
    "city",
    "state",
    "pincode",
    "addressLine",
  ];
  orderedFields
    .filter((field) => !details[field])
    .forEach((field) => {
      if (positionalValues.length) details[field] = positionalValues.shift();
    });

  return details;
}

function validateDeliveryDetails(details = {}) {
  const errors = [];
  const validPlace = (value) =>
    typeof value === "string" &&
    value.trim().length >= 2 &&
    /^[\p{L}][\p{L}\s.'()-]*$/u.test(value.trim());

  if (!details.customerName || details.customerName.trim().length < 2) {
    errors.push("Name is missing or too short");
  }
  if (!validPlace(details.locality)) {
    errors.push("Locality/area is missing or invalid");
  }
  if (!validPlace(details.city)) errors.push("City is missing or invalid");
  if (!validPlace(details.state)) errors.push("State is missing or invalid");
  if (!/^\d{6}$/.test(String(details.pincode || "").trim())) {
    errors.push("Pincode must contain exactly 6 digits");
  }
  if (!details.addressLine || !details.addressLine.trim()) {
    errors.push("House/street is required");
  }

  return { valid: errors.length === 0, errors };
}

function wantsChatNumber(value = "") {
  const input = normalize(value);
  return [
    "use this number",
    "this number",
    "same number",
    "my whatsapp number",
    "use whatsapp number",
    "use my number",
  ].some((phrase) => input === phrase || input.includes(phrase));
}

function normalizeIndianPhone(value = "") {
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

module.exports = {
  PRODUCT_CATALOG,
  parseProduct,
  parseQuantity,
  parseOrderItems,
  calculateTotals,
  formatCart,
  parseDeliveryDetails,
  validateDeliveryDetails,
  wantsChatNumber,
  normalizeIndianPhone,
};

const MAX_LINE_QUANTITY = 10;
const MAX_CART_QUANTITY = 30;

function asPaise(value, field) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error(`${field} must be a non-negative integer in paise`);
  }
  return amount;
}

function normaliseCartItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one product is required");
  }

  const combined = new Map();
  for (const item of items) {
    const sku = String(item?.sku || item?.id || "").trim();
    const quantity = Number(item?.quantity);
    if (!sku || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      throw new Error("Each cart item requires a valid SKU and quantity from 1 to 10");
    }
    combined.set(sku, (combined.get(sku) || 0) + quantity);
  }

  const result = [...combined].map(([sku, quantity]) => ({ sku, quantity }));
  if (result.some((item) => item.quantity > MAX_LINE_QUANTITY)) {
    throw new Error("A product quantity cannot exceed 10");
  }
  if (result.reduce((sum, item) => sum + item.quantity, 0) > MAX_CART_QUANTITY) {
    throw new Error("Cart quantity cannot exceed 30");
  }
  return result;
}

function calculateQuote({ requestedItems, products, rules, couponCode = "", shippingPaise }) {
  const items = normaliseCartItems(requestedItems);
  const productsBySku = new Map(products.map((product) => [product.sku, product]));

  const lines = items.map(({ sku, quantity }) => {
    const product = productsBySku.get(sku);
    if (!product || product.active !== true) throw new Error(`Product is unavailable: ${sku}`);
    const compareAtPaise = asPaise(
      product.compareAtPaise ?? product.pricePaise,
      `compare-at price for ${sku}`,
    );
    return {
      sku,
      name: String(product.name),
      size: String(product.size || ""),
      quantity,
      unitPricePaise: compareAtPaise,
      compareAtPaise,
      lineTotalPaise: compareAtPaise * quantity,
      weightKg: Number(product.weightKg) || 0,
    };
  });

  const subtotalPaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const enteredCode = String(couponCode || "").trim();
  const normalisedCode = enteredCode.toUpperCase();
  const code = rules.coupons?.[enteredCode] ? enteredCode : normalisedCode;
  const coupon = code && rules.coupons ? rules.coupons[code] : null;
  let discountPaise = 0;
  if (coupon?.active && subtotalPaise >= asPaise(coupon.minSubtotalPaise || 0, "coupon minimum")) {
    if (coupon.type === "percent") {
      discountPaise = Math.floor(subtotalPaise * Number(coupon.value) / 100);
    } else if (coupon.type === "fixed") {
      discountPaise = asPaise(coupon.valuePaise, "coupon value");
    }
    discountPaise = Math.min(discountPaise, subtotalPaise);
  }

  const discountedSubtotalPaise = subtotalPaise - discountPaise;
  const freeThreshold = asPaise(rules.freeShippingThresholdPaise || 0, "free shipping threshold");
  const resolvedShippingPaise = discountedSubtotalPaise >= freeThreshold
    ? 0
    : asPaise(shippingPaise ?? rules.defaultShippingPaise, "shipping price");
  const totalPaise = discountedSubtotalPaise + resolvedShippingPaise;

  return {
    currency: "INR",
    items: lines,
    couponCode: coupon ? code : null,
    subtotalPaise,
    discountPaise,
    shippingPaise: resolvedShippingPaise,
    taxPaise: 0,
    totalPaise,
  };
}

module.exports = { calculateQuote, normaliseCartItems };

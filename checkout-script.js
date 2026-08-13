const STORAGE_KEY = "valour_checkout_cart";
const COUPON_KEY = "valour_checkout_coupon";
const DRAFT_KEY = "valour_checkout_address";
const USER_KEY = "user";
const ORDER_RESULT_KEY = "valour_latest_order";
const ATTRIBUTION_KEY = "valour_checkout_attribution";
const OTP_VALIDITY_MS = 5 * 60 * 1000;
const DEMO_OTP_CODE = "123456";
const API_BASE = "https://api.liquidspice.in";

const CHECKOUT_STEPS = {
  CART: "cart",
  DETAILS: "details",
  REVIEW: "review",
  SUCCESS: "success",
};

const sampleCart = [
  {
    id: "velvety-butter-520",
    name: "Velvety Butter Liquid Spice",
    descriptor:
      "Coconut mustard cooking base for fish, chicken, and vegetables.",
    size: "520 ml",
    serves: "Makes up to 1 kg",
    price: 350,
    compareAt: 425,
    image: "assets/images/velvey_buttermain.png",
    quantity: 1,
  },
];

const coupons = {
  WELCOME10: {
    label: "WELCOME10",
    type: "percent",
    value: 10,
    minSubtotal: 0,
    message: "WELCOME10 applied. A measured welcome from Valour.",
  },
  FIRSTORDER: {
    label: "FIRSTORDER",
    type: "fixed",
    value: 75,
    minSubtotal: 499,
    message: "FIRSTORDER applied. Rs. 75 has been removed from your total.",
  },
  VALOURVIP: {
    label: "VALOURVIP",
    type: "percent",
    value: 15,
    minSubtotal: 799,
    message: "VALOURVIP applied. Your kitchen has taste.",
  },
};

const state = {
  cart: [],
  coupon: null,
  totals: {
    subtotal: 0,
    shipping: 0,
    discount: 0,
    tax: 0,
    total: 0,
  },
  pricingRequestId: 0,
  pricingTimer: null,
  step: CHECKOUT_STEPS.CART,
  paymentMethod: "upi",
};

const RAZORPAY_PAYMENT_METHODS = {
  upi: {
    label: "UPI",
    blockName: "Pay using UPI",
  },
  card: {
    label: "Cards",
    blockName: "Pay using card",
  },
  netbanking: {
    label: "Net banking",
    blockName: "Pay using net banking",
  },
  wallet: {
    label: "Wallets",
    blockName: "Pay using wallet",
  },
};

function cloneCart(cart) {
  return JSON.parse(JSON.stringify(cart));
}

const dom = {
  checkoutLayout: document.querySelector(".checkout-layout"),
  cartItems: document.querySelector("[data-cart-items]"),
  emptyState: document.querySelector("[data-empty-state]"),
  couponInput: document.querySelector("[data-coupon-input]"),
  couponMessage: document.querySelector("[data-coupon-message]"),
  couponRow: document.querySelector(".coupon-input-row"),
  mobileBarLabel: document.querySelector("[data-mobile-bar-label]"),
  mobileTotal: document.querySelector("[data-mobile-total]"),
  floatingStepButton: document.querySelector("[data-floating-step-button]"),
  shippingLabel: document.querySelector("[data-shipping-label]"),
  cartPanel: document.querySelector(".cart-panel"),
  couponPanel: document.querySelector(".coupon-panel"),
  stepActions: document.querySelectorAll("[data-step-actions]"),
  form: document.querySelector("[data-checkout-form]"),
  deliveryPanel: document.querySelector(".delivery-panel"),
  trustStrip: document.querySelector(".trust-strip"),
  mobileSummaryPanel: document.querySelector(".mobile-summary-panel"),
  orderButtons: document.querySelectorAll("[data-order-button]"),
  toastRegion: document.querySelector("[data-toast-region]"),
  successPanel: document.querySelector("[data-success-panel]"),
  successOrderItems: document.querySelector("[data-success-order-items]"),
  successOrderId: document.querySelector("[data-success-order-id]"),
  successDelivery: document.querySelector("[data-success-delivery]"),
  successPayment: document.querySelector("[data-success-payment]"),
  successTotal: document.querySelector("[data-success-total]"),
  otpModal: document.querySelector("[data-otp-modal]"),
  otpForm: document.querySelector("[data-otp-form]"),
  otpInput: document.querySelector("[data-otp-input]"),
  otpMessage: document.querySelector("[data-otp-message]"),
  otpError: document.querySelector("[data-otp-error]"),
  mobileBar: document.querySelector("[data-mobile-bar]"),
};

const otpState = {
  code: "",
  phone: "",
  expiresAt: 0,
  pendingUser: null,
  nextAction: null,
};

function money(value) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function readJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
}

function getFormValues() {
  const values = Object.fromEntries(new FormData(dom.form).entries());
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ]),
  );
}

function getStoredUser() {
  return readJSON(USER_KEY, null);
}

function hasVerifiedUser(phone = getFormValues().phone) {
  const user = getStoredUser();
  return Boolean(user && user.phone === String(phone || "").trim());
}

function setOrderButtonLabels() {
  const label = hasVerifiedUser() ? "Place order" : "Continue";
  dom.orderButtons.forEach((button) => {
    button.textContent = label;
  });
  updateFloatingSubtotalBar();
}

function updateFloatingSubtotalBar() {
  if (!dom.floatingStepButton || !dom.mobileBarLabel || !dom.mobileTotal)
    return;

  const isReviewStep = state.step === CHECKOUT_STEPS.REVIEW;
  dom.mobileBarLabel.textContent = isReviewStep ? "Total" : "Subtotal";
  dom.mobileTotal.textContent = isReviewStep
    ? money(state.totals.total)
    : money(state.totals.subtotal);
  dom.floatingStepButton.textContent =
    isReviewStep && hasVerifiedUser() ? "Place order" : "Continue";
}

function setCheckoutStep(step) {
  if (!state.cart.length) {
    state.step = CHECKOUT_STEPS.CART;
  } else {
    state.step = step;
  }

  renderCheckoutStage();
  updateProgress();
}

function renderCheckoutStage() {
  const isEmpty = state.cart.length === 0;
  const isCartStep = state.step === CHECKOUT_STEPS.CART;
  const isDetailsStep = state.step === CHECKOUT_STEPS.DETAILS;
  const isReviewStep = state.step === CHECKOUT_STEPS.REVIEW;
  const isSuccessStep = state.step === CHECKOUT_STEPS.SUCCESS;

  dom.cartPanel.hidden = !isCartStep || isSuccessStep;
  dom.couponPanel.hidden = isEmpty || !isCartStep;
  dom.form.hidden = isEmpty || !isDetailsStep;
  dom.deliveryPanel.hidden = true;
  dom.trustStrip.hidden = !isSuccessStep;
  dom.mobileSummaryPanel.hidden = isEmpty || !isReviewStep;
  dom.successPanel.hidden = !isSuccessStep;
  dom.mobileBar.hidden = isEmpty || isSuccessStep;
  dom.stepActions.forEach((action) => {
    action.hidden = isEmpty || action.dataset.stepActions !== state.step;
  });
  dom.checkoutLayout.classList.add("is-single-column");
  updateFloatingSubtotalBar();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  if (state.coupon) {
    localStorage.setItem(COUPON_KEY, state.coupon);
  } else {
    localStorage.removeItem(COUPON_KEY);
  }
}

function trackEvent(name, payload = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...payload });

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  }

  if (window.fbq) {
    window.fbq("trackCustom", name, payload);
  }
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "is-error" : ""}`;
  toast.textContent = message;
  dom.toastRegion.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
  }, 2800);

  window.setTimeout(() => toast.remove(), 3300);
}

async function postJSON(url, payload) {
  console.log(`POST ${url}`, "hey there!!!!");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Request failed. Please try again.");
  }

  return data;
}

function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error("Unable to load Razorpay. Please check your network."));
    document.head.appendChild(script);
  });
}

function getPaymentMethodLabel(method = state.paymentMethod) {
  if (method === "COD") return "Cash on delivery";
  return RAZORPAY_PAYMENT_METHODS[method]?.label || "UPI";
}

function buildRazorpayMethodOptions(method) {
  const enabledMethod = RAZORPAY_PAYMENT_METHODS[method] ? method : "upi";

  if (enabledMethod === "upi") {
    return {};
  }

  return {
    config: {
      display: {
        blocks: {
          preferred: {
            name: RAZORPAY_PAYMENT_METHODS[enabledMethod].blockName,
            instruments: [{ method: enabledMethod }],
          },
        },
        sequence: ["block.preferred"],
        preferences: {
          show_default_blocks: true,
        },
      },
    },
  };
}

function getCheckoutAttribution() {
  let stored = {};

  try {
    stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || "{}");
  } catch (_error) {
    stored = {};
  }

  const params = new URLSearchParams(window.location.search);
  let referrerHost = "";

  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname : "";
  } catch (_error) {
    referrerHost = "";
  }

  const attribution = {
    source:
      params.get("utm_source") ||
      params.get("source") ||
      stored.source ||
      referrerHost ||
      "direct",
    campaign:
      params.get("utm_campaign") ||
      params.get("campaign") ||
      stored.campaign ||
      "",
    cookingType: "fish",
    purchaseIntent: "high",
    activationPreference: "custom_checkout",
    segment: "checkout_intent",
  };

  sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));

  return attribution;
}

function buildOrderPayload() {
  const values = getFormValues();
  const tracking = getCheckoutAttribution();

  return {
    checkout: values,
    payment: {
      method: state.paymentMethod,
      label: getPaymentMethodLabel(),
    },
    products: state.cart.map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      price: item.price,
      quantity: item.quantity,
    })),
    totals: { ...state.totals },
    coupon: state.coupon,
    tracking,
    delivery: {
      estimate:
        document.querySelector("[data-delivery-window]")?.textContent ||
        "Delivery estimate will be shared soon",
    },
  };
}

function redirectToPaymentFailed(message) {
  sessionStorage.setItem(
    ORDER_RESULT_KEY,
    JSON.stringify({
      status: "failed",
      message,
      totalAmount: state.totals.total,
      paymentMethod: state.paymentMethod,
      paymentMethodLabel: getPaymentMethodLabel(),
      createdAt: new Date().toISOString(),
    }),
  );
  window.location.href = "payment-failed.html";
}

function getSubtotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateShipping(subtotal, pincode = "") {
  if (!subtotal) return 0;
  if (subtotal >= 799) return 0;
  if (/^78/.test(pincode)) return 35;
  return 65;
}

function calculateDiscount(subtotal) {
  if (!state.coupon || !coupons[state.coupon]) return 0;

  const coupon = coupons[state.coupon];
  if (subtotal < coupon.minSubtotal) return 0;

  if (coupon.type === "percent") {
    return Math.round(subtotal * (coupon.value / 100));
  }

  return Math.min(coupon.value, subtotal);
}

function getPincode() {
  const input = dom.form.elements.pincode;
  return input ? input.value.trim() : "";
}

function calculateTotals() {
  const subtotal = getSubtotal();
  const discount = calculateDiscount(subtotal);
  const shipping = calculateShipping(subtotal - discount, getPincode());
  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxable * 0.05);
  const total = Math.max(taxable + shipping + tax, 0);

  state.totals = { subtotal, shipping, discount, tax, total };
}

async function refreshServerPricing() {
  if (!state.cart.length) return;
  const requestId = ++state.pricingRequestId;
  try {
    const result = await postJSON(`${API_BASE}/api/checkout/quote`, {
      items: state.cart.map((item) => ({
        sku: item.id,
        quantity: item.quantity,
      })),
      pincode: /^\d{6}$/.test(getPincode()) ? getPincode() : "",
      couponCode: state.coupon,
    });
    if (requestId !== state.pricingRequestId) return;
    const quote = result.quote;
    state.cart = quote.items.map((line) => ({
      ...(state.cart.find((item) => item.id === line.sku) || {}),
      id: line.sku,
      name: line.name,
      size: line.size,
      price: line.unitPricePaise / 100,
      quantity: line.quantity,
    }));
    state.totals = {
      subtotal: quote.subtotalPaise / 100,
      discount: quote.discountPaise / 100,
      shipping: quote.shippingPaise / 100,
      tax: quote.taxPaise / 100,
      total: quote.totalPaise / 100,
    };
    renderCart();
    renderSummary();
  } catch (error) {
    console.error("Server pricing unavailable", error);
  }
}

function scheduleServerPricing() {
  window.clearTimeout(state.pricingTimer);
  state.pricingTimer = window.setTimeout(refreshServerPricing, 150);
}

function itemCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function setTextAll(selector, text) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = text;
  });
}

function renderCart() {
  dom.cartItems.innerHTML = "";

  state.cart.forEach((item) => {
    const savings = Math.max((item.compareAt - item.price) * item.quantity, 0);
    const article = document.createElement("article");
    article.className = "cart-item";
    article.dataset.itemId = item.id;
    article.innerHTML = `
      <div class="product-media">
        <img src="${item.image}" alt="${item.name}" />
      </div>
      <div class="product-info">
        <h3>${item.name}</h3>
        <p>${item.descriptor}</p>
        <div class="product-meta">
          <span>${item.size}</span>
          <span>${item.serves}</span>
          ${savings ? `<span class="savings-pill">You save ${money(savings)}</span>` : ""}
        </div>
      </div>
      <div class="item-controls">
        <div class="item-price">
          <strong>${money(item.price * item.quantity)}</strong>
          ${item.compareAt ? `<s>${money(item.compareAt * item.quantity)}</s>` : ""}
        </div>
        <div class="qty-control" aria-label="Quantity for ${item.name}">
          <button type="button" data-action="decrease" aria-label="Decrease quantity">-</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase" aria-label="Increase quantity">+</button>
        </div>
        <button class="remove-btn" type="button" data-action="remove">Remove</button>
      </div>
    `;
    dom.cartItems.appendChild(article);
  });

  const isEmpty = state.cart.length === 0;
  dom.emptyState.hidden = !isEmpty;
  dom.cartItems.hidden = isEmpty;
  if (isEmpty) state.step = CHECKOUT_STEPS.CART;
  renderCheckoutStage();
}

function renderCouponState() {
  document.querySelectorAll(".coupon-chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.coupon === state.coupon);
  });

  if (state.coupon && coupons[state.coupon]) {
    setTextAll("[data-applied-coupon]", `${state.coupon} is active`);
    dom.couponInput.value = state.coupon;
  } else {
    setTextAll("[data-applied-coupon]", "No coupon applied");
  }
}

function renderSummary() {
  calculateTotals();

  const count = itemCount();
  setTextAll("[data-subtotal]", money(state.totals.subtotal));
  setTextAll(
    "[data-shipping]",
    state.totals.shipping === 0 ? "Free" : money(state.totals.shipping),
  );
  setTextAll(
    "[data-discount]",
    state.totals.discount ? `- ${money(state.totals.discount)}` : "Rs. 0",
  );
  setTextAll("[data-tax]", money(state.totals.tax));
  setTextAll("[data-total]", money(state.totals.total));
  dom.mobileTotal.textContent =
    state.step === CHECKOUT_STEPS.REVIEW
      ? money(state.totals.total)
      : money(state.totals.subtotal);
  setTextAll(
    "[data-summary-count]",
    `${count} ${count === 1 ? "item" : "items"}`,
  );
  dom.shippingLabel.textContent =
    state.totals.shipping === 0
      ? "Free above threshold"
      : money(state.totals.shipping);
  dom.mobileBar.hidden = state.cart.length === 0;

  updateProgress();
  renderCouponState();
  setOrderButtonLabels();
  updateFloatingSubtotalBar();
}

function updateProgress() {
  const hasCart = state.cart.length > 0;
  const hasAddress = validateForm(false);
  const isCartStep = state.step === CHECKOUT_STEPS.CART;
  const isDetailsStep = state.step === CHECKOUT_STEPS.DETAILS;
  const isReviewStep = state.step === CHECKOUT_STEPS.REVIEW;
  const isSuccessStep = state.step === CHECKOUT_STEPS.SUCCESS;

  document.querySelectorAll("[data-progress-step]").forEach((step) => {
    const name = step.dataset.progressStep;
    step.classList.toggle(
      "is-active",
      (name === "cart" && isCartStep) ||
        (name === "details" && isDetailsStep) ||
        (name === "payment" && (isReviewStep || isSuccessStep)),
    );
    step.classList.toggle(
      "is-complete",
      (name === "cart" && hasCart && !isCartStep) ||
        (name === "details" && hasAddress && (isReviewStep || isSuccessStep)) ||
        (name === "payment" && isSuccessStep),
    );
  });

  document.querySelectorAll(".progress-line").forEach((line, index) => {
    line.classList.toggle(
      "is-complete",
      index === 0
        ? !isCartStep && hasCart
        : (isReviewStep || isSuccessStep) && hasAddress,
    );
  });
}

function renderAll() {
  renderCart();
  renderSummary();
  saveState();
  scheduleServerPricing();
}

function updateQuantity(id, direction) {
  const item = state.cart.find((cartItem) => cartItem.id === id);
  if (!item) return;

  item.quantity += direction;
  if (item.quantity < 1) {
    removeItem(id);
    return;
  }

  trackEvent("valour_cart_quantity_update", {
    item_id: id,
    quantity: item.quantity,
  });
  renderAll();
}

function removeItem(id) {
  const element = document.querySelector(`[data-item-id="${id}"]`);
  if (element) element.classList.add("is-removing");

  window.setTimeout(() => {
    state.cart = state.cart.filter((item) => item.id !== id);
    if (!state.cart.length) state.coupon = null;
    trackEvent("valour_remove_from_cart", { item_id: id });
    renderAll();
    showToast("Removed from cart.");
  }, 180);
}

function restoreCart() {
  state.cart = cloneCart(sampleCart);
  state.coupon = null;
  dom.couponMessage.textContent = "";
  dom.couponMessage.className = "field-message";
  trackEvent("valour_restore_cart");
  renderAll();
  showToast("Sample Valour cart restored.");
}

function applyCoupon(rawCode) {
  const code = rawCode.trim().toUpperCase();
  const subtotal = getSubtotal();
  const coupon = coupons[code];

  dom.couponRow.classList.remove("is-invalid");
  dom.couponMessage.className = "field-message";

  if (!state.cart.length) {
    setCouponError("Add an item before applying a coupon.");
    return;
  }

  if (!code) {
    setCouponError("Enter a coupon code.");
    return;
  }

  if (!coupon) {
    setCouponError("That code is not active for this order.");
    trackEvent("valour_coupon_invalid", { coupon: code });
    return;
  }

  if (state.coupon === code) {
    setCouponError("This coupon is already applied.");
    return;
  }

  if (subtotal < coupon.minSubtotal) {
    setCouponError(`${code} unlocks at ${money(coupon.minSubtotal)}.`);
    return;
  }

  state.coupon = code;
  dom.couponMessage.textContent = coupon.message;
  dom.couponMessage.classList.add("is-success");
  trackEvent("valour_coupon_applied", { coupon: code });
  renderAll();
  showToast(coupon.message);
}

function setCouponError(message) {
  dom.couponRow.classList.add("is-invalid");
  dom.couponMessage.textContent = message;
  dom.couponMessage.classList.add("is-error");
  showToast(message, "error");
}

function clearCoupon() {
  if (!state.coupon && !dom.couponInput.value) return;

  state.coupon = null;
  dom.couponInput.value = "";
  dom.couponRow.classList.remove("is-invalid");
  dom.couponMessage.textContent = "Coupon cleared.";
  dom.couponMessage.className = "field-message";
  trackEvent("valour_coupon_clear");
  renderAll();
}

function validateForm(showErrors = true) {
  const values = getFormValues();
  const errors = {};

  if (!values.name || values.name.trim().length < 2)
    errors.name = "Enter your full name.";
  if (!/^[6-9]\d{9}$/.test((values.phone || "").trim()))
    errors.phone = "Enter a valid 10-digit phone.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((values.email || "").trim()))
    errors.email = "Enter a valid email.";
  if (!values.address || values.address.trim().length < 8)
    errors.address = "Enter your full address.";
  if (!values.city || values.city.trim().length < 2)
    errors.city = "Enter your city.";
  if (!values.state) errors.state = "Select your state.";
  if (!/^\d{6}$/.test((values.pincode || "").trim()))
    errors.pincode = "Enter a valid 6-digit pincode.";

  if (showErrors) {
    document
      .querySelectorAll(".field")
      .forEach((field) => field.classList.remove("is-invalid"));
    document.querySelectorAll("[data-error-for]").forEach((field) => {
      field.textContent = errors[field.dataset.errorFor] || "";
      if (errors[field.dataset.errorFor]) {
        field.closest(".field").classList.add("is-invalid");
      }
    });
  }

  return Object.keys(errors).length === 0;
}

function saveDraft() {
  const values = getFormValues();
  localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
}

function hydrateDraft() {
  const draft = readJSON(DRAFT_KEY, {});
  Object.entries(draft).forEach(([key, value]) => {
    if (dom.form.elements[key]) {
      dom.form.elements[key].value = value;
    }
  });
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }

  return result;
}

function formatDeliveryDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getDeliveryEstimateText(minDays, maxDays) {
  const today = new Date();
  const fromDate = formatDeliveryDate(addBusinessDays(today, minDays));
  const toDate = formatDeliveryDate(addBusinessDays(today, maxDays));
  return `Delivery by ${fromDate} - ${toDate}`;
}

function getFallbackDeliveryEstimate(pincode) {
  const prefix = Number(pincode.slice(0, 2));

  if (prefix >= 70 && prefix <= 79) {
    return getDeliveryEstimateText(2, 4);
  }

  if (prefix >= 10 && prefix <= 59) {
    return getDeliveryEstimateText(4, 6);
  }

  return getDeliveryEstimateText(5, 8);
}

function updateDeliveryEstimate() {
  const pincode = getPincode();
  const deliveryText = /^\d{6}$/.test(pincode)
    ? getFallbackDeliveryEstimate(pincode)
    : "Enter pincode for estimate";

  setTextAll("[data-delivery-window]", deliveryText);
  renderSummary();
  scheduleServerPricing();
}

function setLoading(button, loading) {
  button.classList.toggle("is-loading", loading);
  button.disabled = loading;
}

function setOrderLoading(loading) {
  dom.orderButtons.forEach((button) => setLoading(button, loading));
}

function setPaymentMethod(method) {
  state.paymentMethod = method;

  document.querySelectorAll("[data-payment-input]").forEach((input) => {
    input.checked = input.value === method;
    input
      .closest(".payment-option")
      .classList.toggle("is-selected", input.checked);
  });
}

function renderSuccessOrderItems() {
  if (!dom.successOrderItems) return;

  dom.successOrderItems.innerHTML = "";
  state.cart.forEach((item) => {
    const row = document.createElement("p");
    const name = document.createElement("span");
    const quantity = document.createElement("strong");

    name.textContent = item.name;
    quantity.textContent = `Qty ${item.quantity}`;
    row.append(name, quantity);
    dom.successOrderItems.appendChild(row);
  });

  const deliveryText =
    document.querySelector("[data-delivery-window]")?.textContent ||
    "Delivery estimate will be shared soon";
  const orderId = `VALOUR-${Date.now().toString().slice(-6)}`;

  dom.successOrderId.textContent = orderId;
  dom.successDelivery.textContent = deliveryText;
  dom.successPayment.textContent = getPaymentMethodLabel();
  dom.successTotal.textContent = money(state.totals.total);
}

function continueToDetails() {
  if (!state.cart.length) {
    showToast("Add an item before continuing.", "error");
    return;
  }

  setCheckoutStep(CHECKOUT_STEPS.DETAILS);
  dom.form.scrollIntoView({ behavior: "smooth", block: "start" });
  trackEvent("valour_checkout_step_details");
}

function showReviewStep() {
  saveDraft();
  updateDeliveryEstimate();
  setCheckoutStep(CHECKOUT_STEPS.REVIEW);
  document
    .querySelector(".mobile-summary-panel")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  trackEvent("valour_checkout_step_review", {
    value: state.totals.total,
    currency: "INR",
  });
}

function continueToReview(event) {
  if (event) event.preventDefault();

  if (!validateForm(true)) {
    showToast("A few delivery details need attention.", "error");
    return;
  }

  const values = getFormValues();
  if (!hasVerifiedUser(values.phone)) {
    saveDraft();
    startOtpVerification("review");
    return;
  }

  showReviewStep();
}

function handleFloatingStep() {
  if (state.step === CHECKOUT_STEPS.CART) {
    continueToDetails();
    return;
  }

  if (state.step === CHECKOUT_STEPS.DETAILS) {
    continueToReview();
    return;
  }

  placeOrder();
}

function sendOtp(phone) {
  otpState.code = DEMO_OTP_CODE;
  otpState.phone = phone;
  otpState.expiresAt = Date.now() + OTP_VALIDITY_MS;

  trackEvent("valour_otp_send", { phone });
  showToast(`OTP sent to ${phone}.`);
}

function openOtpModal() {
  dom.otpModal.hidden = false;
  document.body.classList.add("is-modal-open");
  dom.otpInput.value = "";
  dom.otpError.textContent = "";
  dom.otpMessage.textContent = `We sent a 6-digit OTP to ${otpState.phone}. For demo testing, use ${DEMO_OTP_CODE}.`;
  window.setTimeout(() => dom.otpInput.focus(), 50);
}

function closeOtpModal() {
  dom.otpModal.hidden = true;
  document.body.classList.remove("is-modal-open");
}

function startOtpVerification(nextAction = null) {
  const values = getFormValues();
  otpState.nextAction = nextAction;
  otpState.pendingUser = {
    name: values.name,
    phone: values.phone,
    email: values.email,
    address: values.address,
    landmark: values.landmark,
    city: values.city,
    state: values.state,
    pincode: values.pincode,
    verifiedAt: new Date().toISOString(),
  };

  sendOtp(values.phone);
  openOtpModal();
}

function verifyOtp(event) {
  event.preventDefault();

  const enteredOtp = dom.otpInput.value.trim();
  dom.otpError.textContent = "";

  if (!/^\d{6}$/.test(enteredOtp)) {
    dom.otpError.textContent = "Enter the 6-digit OTP.";
    return;
  }

  if (!otpState.code || Date.now() > otpState.expiresAt) {
    dom.otpError.textContent = "This OTP has expired. Please resend it.";
    return;
  }

  if (enteredOtp !== otpState.code) {
    dom.otpError.textContent = "That OTP does not match. Please try again.";
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(otpState.pendingUser));
  otpState.code = "";
  otpState.pendingUser = null;
  closeOtpModal();
  setOrderButtonLabels();
  trackEvent("valour_user_verified", { phone: otpState.phone });
  showToast("Mobile verified.");

  if (otpState.nextAction === "review") {
    otpState.nextAction = null;
    showReviewStep();
    return;
  }

  otpState.nextAction = null;
}

async function startRazorpayPayment({ razorpayOrder, orderPayload }) {
  const values = getFormValues();

  await loadRazorpayCheckout();

  return new Promise((resolve, reject) => {
    const methodOptions = buildRazorpayMethodOptions(state.paymentMethod);

    // Payment step: open Razorpay's standard popup while the customer stays on this custom checkout page.
    const checkout = new window.Razorpay({
      key: razorpayOrder.key_id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "VALOUR",
      description: "Valour checkout payment",
      order_id: razorpayOrder.order_id,
      prefill: {
        name: values.name,
        email: values.email,
        contact: values.phone,
      },
      notes: {
        pincode: values.pincode,
        source: "custom_checkout",
        preferred_payment_method: getPaymentMethodLabel(),
      },
      theme: {
        color: "#831a1a",
      },
      ...methodOptions,
      handler: async (paymentResponse) => {
        try {
          // Signature verification step: backend validates Razorpay's HMAC before saving the order.
          const verifiedOrder = await postJSON(
            `${API_BASE}/api/payment/verify`,
            paymentResponse,
          );
          resolve(verifiedOrder);
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss: () => {
          reject(new Error("Payment was cancelled before completion."));
        },
      },
    });

    checkout.on("payment.failed", (response) => {
      reject(
        new Error(
          response.error?.description ||
            "Razorpay could not complete the payment.",
        ),
      );
    });

    checkout.open();
  });
}

async function placeOrder(event) {
  if (event) event.preventDefault();

  if (!state.cart.length) {
    showToast("Your cart is empty.", "error");
    return;
  }

  if (!validateForm(true)) {
    showToast("A few delivery details need attention.", "error");
    return;
  }

  if (!hasVerifiedUser(getFormValues().phone)) {
    showToast("Verify your mobile number before placing the order.", "error");
    setCheckoutStep(CHECKOUT_STEPS.DETAILS);
    return;
  }

  if (state.paymentMethod === "COD") {
    showToast(
      "Cash on delivery is not active yet. Please choose UPI, Cards, Net banking, or Wallets.",
      "error",
    );
    return;
  }

  setOrderLoading(true);
  showToast(`Opening ${getPaymentMethodLabel()} payment...`);
  trackEvent("valour_begin_checkout", {
    value: state.totals.total,
    currency: "INR",
    coupon: state.coupon,
    payment_method: getPaymentMethodLabel(),
  });

  let razorpayOrder = null;
  try {
    renderSummary();
    const orderPayload = buildOrderPayload();

    // Create order step: backend creates the Razorpay order for the final payable total.
    razorpayOrder = await postJSON(`${API_BASE}/api/payment/create-order`, {
      order: orderPayload,
    });

    // Replace all browser estimates with the authoritative MongoDB-backed quote.
    if (razorpayOrder.quote) {
      const quote = razorpayOrder.quote;
      state.cart = quote.items.map((line) => ({
        ...(state.cart.find((item) => item.id === line.sku) || {}),
        id: line.sku,
        name: line.name,
        size: line.size,
        price: line.unitPricePaise / 100,
        quantity: line.quantity,
      }));
      state.totals = {
        subtotal: quote.subtotalPaise / 100,
        discount: quote.discountPaise / 100,
        shipping: quote.shippingPaise / 100,
        tax: quote.taxPaise / 100,
        total: quote.totalPaise / 100,
      };
      renderCart();
      renderSummary();
    }

    const verifiedOrder = await startRazorpayPayment({
      razorpayOrder,
      orderPayload,
    });

    sessionStorage.setItem(
      ORDER_RESULT_KEY,
      JSON.stringify({
        ...verifiedOrder.order,
        orderId: verifiedOrder.orderId,
        deliveryEstimate: orderPayload.delivery.estimate,
        paymentMethod: state.paymentMethod,
        paymentMethodLabel: getPaymentMethodLabel(),
      }),
    );

    trackEvent("valour_purchase", {
      value: state.totals.total,
      currency: "INR",
      items: state.cart,
      razorpay_order_id: verifiedOrder.order?.razorpayOrderId,
    });

    state.cart = [];
    state.coupon = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COUPON_KEY);

    window.location.href = "order-success.html";
  } catch (error) {
    console.error("Payment failed", error);
    if (razorpayOrder?.order_id) {
      void postJSON(`${API_BASE}/api/payment/client-failure`, {
        razorpay_order_id: razorpayOrder.order_id,
        reason: error.message || "Payment failed",
      }).catch((notificationError) =>
        console.error(
          "Unable to send WhatsApp payment failure notice",
          notificationError,
        ),
      );
    }
    trackEvent("valour_payment_failed", {
      value: state.totals.total,
      currency: "INR",
      reason: error.message,
    });
    showToast(error.message || "Payment failed. Please try again.", "error");
    redirectToPaymentFailed(
      error.message || "Payment failed. Please try again.",
    );
  } finally {
    setOrderLoading(false);
  }
}

function closeSuccess() {
  state.cart = [];
  state.coupon = null;
  dom.couponInput.value = "";
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(COUPON_KEY);
  renderAll();
}

function bindEvents() {
  dom.cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    const item = event.target.closest("[data-item-id]");
    if (!button || !item) return;

    const id = item.dataset.itemId;
    if (button.dataset.action === "increase") updateQuantity(id, 1);
    if (button.dataset.action === "decrease") updateQuantity(id, -1);
    if (button.dataset.action === "remove") removeItem(id);
  });

  document
    .querySelector("[data-action='apply-coupon']")
    .addEventListener("click", () => {
      const button = document.querySelector("[data-action='apply-coupon']");
      setLoading(button, true);
      window.setTimeout(() => {
        setLoading(button, false);
        applyCoupon(dom.couponInput.value);
      }, 300);
    });

  dom.couponInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyCoupon(dom.couponInput.value);
    }
  });

  document.querySelectorAll(".coupon-chip").forEach((chip) => {
    chip.addEventListener("click", () => applyCoupon(chip.dataset.coupon));
  });

  document
    .querySelector("[data-action='clear-coupon']")
    .addEventListener("click", clearCoupon);
  document
    .querySelector("[data-action='restore-cart']")
    .addEventListener("click", restoreCart);
  document
    .querySelector("[data-action='continue-to-details']")
    .addEventListener("click", continueToDetails);
  document
    .querySelector("[data-action='continue-to-review']")
    .addEventListener("click", continueToReview);
  document
    .querySelector("[data-action='floating-step']")
    .addEventListener("click", handleFloatingStep);

  document
    .querySelectorAll("[data-action='focus-checkout']")
    .forEach((button) => {
      button.addEventListener("click", () => {
        dom.form.scrollIntoView({ behavior: "smooth", block: "start" });
        trackEvent("valour_continue_to_checkout");
      });
    });

  document
    .querySelectorAll("[data-action='submit-order']")
    .forEach((button) => {
      button.addEventListener("click", placeOrder);
    });

  dom.form.addEventListener("submit", continueToReview);
  dom.form.addEventListener("input", () => {
    saveDraft();
    updateProgress();
  });
  dom.form.elements.pincode.addEventListener("input", updateDeliveryEstimate);

  document.querySelectorAll("[data-payment-input]").forEach((input) => {
    input.addEventListener("change", () => {
      setPaymentMethod(input.value);
      trackEvent("valour_payment_select", {
        payment_method: input.value,
      });
      updateProgress();
    });
  });

  document
    .querySelector("[data-action='close-success']")
    .addEventListener("click", closeSuccess);
  document
    .querySelector("[data-action='close-otp']")
    .addEventListener("click", closeOtpModal);
  document
    .querySelector("[data-action='resend-otp']")
    .addEventListener("click", () => {
      if (!validateForm(true)) {
        closeOtpModal();
        showToast("Update the delivery details before resending OTP.", "error");
        return;
      }

      startOtpVerification(otpState.nextAction);
    });
  dom.otpForm.addEventListener("submit", verifyOtp);
}

function init() {
  state.cart = cloneCart(readJSON(STORAGE_KEY, sampleCart));
  state.coupon = localStorage.getItem(COUPON_KEY);
  hydrateDraft();

  if (state.coupon && !coupons[state.coupon]) {
    state.coupon = null;
  }

  setPaymentMethod(state.paymentMethod);
  bindEvents();
  renderAll();
  updateDeliveryEstimate();
  trackEvent("valour_checkout_view");
}

init();

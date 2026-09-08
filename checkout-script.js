const STORAGE_KEY = "valour_checkout_cart";
const COUPON_KEY = "valour_checkout_coupon";
const DRAFT_KEY = "valour_checkout_address";
const CUSTOMER_DETAILS_KEY = "valour_customer_shipping_details";
const USER_KEY = "user";
const ORDER_RESULT_KEY = "valour_latest_order";
const ATTRIBUTION_KEY = "valour_checkout_attribution";
const DELIVERY_CITY = "agartala";
const DELIVERY_STATE = "tripura";
const OTP_HELP_WHATSAPP_PHONE = "919233054806";
// The Express app serves both the storefront and API. Keeping requests on the
// current origin avoids stale deployment-domain mappings and works locally too.
const API_BASE = window.location.origin;

const CHECKOUT_STEPS = {
  CART: "cart",
  DETAILS: "details",
  REVIEW: "review",
  SUCCESS: "success",
};

const sampleCart = [
  {
    id: "velvety-butter-chicken",
    name: "Velvety Butter Chicken",
    descriptor:
      "Make restaurant-style Butter Chicken at home. Just add chicken.",
    size: "520 ml",
    serves: "Makes up to 1 kg",
    price: 350,
    compareAt: 350,
    image: "vendor/cdn/cdn/shop/files/velevty_butter_mockupM.webp",
    quantity: 1,
  },
];

const coupons = {};

const state = {
  cart: [],
  coupon: null,
  totals: {
    subtotal: 0,
    shipping: 0,
    discount: 0,
    total: 0,
  },
  pricingRequestId: 0,
  pricingTimer: null,
  delivery: null,
  step: CHECKOUT_STEPS.DETAILS,
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
  couponApplyButton: document.querySelector("[data-action='apply-coupon']"),
  couponMessage: document.querySelector("[data-coupon-message]"),
  couponRow: document.querySelector(".coupon-input-row"),
  availableCoupons: document.querySelector("[data-available-coupons]"),
  usedCoupons: document.querySelector("[data-used-coupons]"),
  universalCouponNotice: document.querySelector(
    "[data-universal-coupon-notice]",
  ),
  universalCouponText: document.querySelector(
    "[data-universal-coupon-text]",
  ),
  universalCouponCodes: document.querySelector(
    "[data-universal-coupon-codes]",
  ),
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
  successMessage: document.querySelector("[data-success-message]"),
  successTotalLabel: document.querySelector("[data-success-total-label]"),
  successTotal: document.querySelector("[data-success-total]"),
  otpModal: document.querySelector("[data-otp-modal]"),
  otpForm: document.querySelector("[data-otp-form]"),
  otpInput: document.querySelector("[data-otp-input]"),
  otpMessage: document.querySelector("[data-otp-message]"),
  otpError: document.querySelector("[data-otp-error]"),
  otpResendButton: document.querySelector("[data-resend-otp]"),
  otpResendStatus: document.querySelector("[data-otp-resend-status]"),
  otpHelpToggle: document.querySelector("[data-otp-help-toggle]"),
  otpHelpPanel: document.querySelector("[data-otp-help-panel]"),
  otpHelpLink: document.querySelector("[data-otp-help-link]"),
  serviceAreaModal: document.querySelector("[data-service-area-modal]"),
  mobileBar: document.querySelector("[data-mobile-bar]"),
};

let serviceAreaLastFocused = null;

const otpState = {
  phone: "",
  challengeId: "",
  pendingUser: null,
  nextAction: null,
  sending: false,
  resendAvailableAt: 0,
  countdownTimer: null,
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
  const verifiedAt = Date.parse(user?.verifiedAt || "");
  return Boolean(
    user &&
    user.phone === String(phone || "").trim() &&
    user.phoneVerificationToken &&
    Number.isFinite(verifiedAt) &&
    Date.now() - verifiedAt < 50 * 60 * 1000,
  );
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
  const cartNetSubtotal = Math.max(
    state.totals.subtotal - state.totals.discount,
    0,
  );
  dom.mobileBarLabel.textContent = isReviewStep
    ? "Total"
    : state.totals.discount
      ? "Net subtotal"
      : "Subtotal";
  dom.mobileTotal.textContent = isReviewStep
    ? money(state.totals.total)
    : money(cartNetSubtotal);
  dom.floatingStepButton.textContent =
    isReviewStep && hasVerifiedUser() ? "Place order" : "Continue";
}

function setCheckoutStep(step) {
  if (!state.cart.length && step === CHECKOUT_STEPS.REVIEW) {
    state.step = CHECKOUT_STEPS.CART;
  } else {
    state.step = step;
  }

  renderCheckoutStage();
  updateProgress();
}

function navigateToProgressStep(progressStep) {
  const destinations = {
    cart: { step: CHECKOUT_STEPS.CART, element: dom.cartPanel },
    details: { step: CHECKOUT_STEPS.DETAILS, element: dom.form },
    payment: {
      step: CHECKOUT_STEPS.REVIEW,
      element: dom.mobileSummaryPanel,
    },
  };
  const destination = destinations[progressStep];
  if (!destination) return;

  if (!state.cart.length && destination.step === CHECKOUT_STEPS.REVIEW) {
    showToast("Add an item before continuing.", "error");
    setCheckoutStep(CHECKOUT_STEPS.CART);
    return;
  }

  if (destination.step === CHECKOUT_STEPS.REVIEW) {
    continueToReview();
    return;
  }

  setCheckoutStep(destination.step);
  window.requestAnimationFrame(() => {
    destination.element?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  trackEvent("valour_checkout_progress_click", { step: progressStep });
}

function renderCheckoutStage() {
  const isEmpty = state.cart.length === 0;
  const isCartStep = state.step === CHECKOUT_STEPS.CART;
  const isDetailsStep = state.step === CHECKOUT_STEPS.DETAILS;
  const isReviewStep = state.step === CHECKOUT_STEPS.REVIEW;
  const isSuccessStep = state.step === CHECKOUT_STEPS.SUCCESS;

  dom.cartPanel.hidden = !isCartStep || isSuccessStep;
  dom.couponPanel.hidden = isEmpty || !isCartStep;
  dom.form.hidden = !isDetailsStep;
  dom.deliveryPanel.hidden = true;
  dom.trustStrip.hidden = !isSuccessStep;
  dom.mobileSummaryPanel.hidden = isEmpty || !isReviewStep;
  dom.successPanel.hidden = !isSuccessStep;
  dom.mobileBar.hidden = isEmpty || isSuccessStep;
  dom.stepActions.forEach((action) => {
    action.hidden =
      action.dataset.stepActions !== state.step ||
      (isEmpty && action.dataset.stepActions === CHECKOUT_STEPS.CART);
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
    window.valourMeta?.track("trackCustom", name, payload);
  }
}

if (window.valourMeta) window.valourMeta.customer = () => getFormValues();

let metaInitiateCheckoutTracked = false;

function getMetaContents(items = []) {
  return items.map((item) => ({
    id: String(item.sku || item.id || ""),
    quantity: Number(item.quantity) || 1,
    item_price:
      Number(
        item.unitPricePaise != null ? item.unitPricePaise / 100 : item.price,
      ) || 0,
  }));
}

function trackMetaInitiateCheckout(quote) {
  if (metaInitiateCheckoutTracked || typeof window.fbq !== "function") return;

  const contents = getMetaContents(quote.items);
  if (!contents.length) return;

  metaInitiateCheckoutTracked = true;
  window.valourMeta?.track("track", "InitiateCheckout", {
    content_ids: contents.map((item) => item.id),
    content_type: "product",
    contents,
    num_items: contents.reduce((total, item) => total + item.quantity, 0),
    value: Number(quote.totalPaise) / 100,
    currency: quote.currency || "INR",
  });
}

function trackMetaAddPaymentInfo() {
  const contents = getMetaContents(state.cart);
  if (!contents.length) return;
  const key = `valour_add_payment_event_${state.paymentMethod}`;
  let eventId = "";
  try { eventId = sessionStorage.getItem(key) || ""; } catch { /* storage may be unavailable */ }
  if (!eventId) {
    eventId = `payment_${state.paymentMethod}_${window.crypto?.randomUUID?.() || Date.now()}`.replace(/[^A-Za-z0-9_-]/g, "");
    try { sessionStorage.setItem(key, eventId); } catch { /* event ID still deduplicates this call */ }
  }
  window.valourMeta?.track("track", "AddPaymentInfo", {
    content_ids: contents.map(item => item.id),
    content_type: "product",
    contents,
    num_items: contents.reduce((total, item) => total + item.quantity, 0),
    value: Number(state.totals.total) || 0,
    currency: "INR",
    payment_method: state.paymentMethod,
  }, { eventID: eventId });
}

function trackMetaPurchase({ value, currency = "INR", items, orderId }) {
  if (typeof window.fbq !== "function" || !Number.isFinite(Number(value)))
    return;

  const contents = getMetaContents(items);
  window.valourMeta?.track("track", "Purchase", {
    content_ids: contents.map((item) => item.id),
    content_type: "product",
    contents,
    num_items: contents.reduce((total, item) => total + item.quantity, 0),
    value: Number(value),
    currency,
    order_id: String(orderId || ""),
  });
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

function normalizeDeliveryPlace(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("en-IN");
}

function isServiceAreaSupported(values = getFormValues()) {
  return (
    normalizeDeliveryPlace(values.city) === DELIVERY_CITY &&
    normalizeDeliveryPlace(values.state) === DELIVERY_STATE
  );
}

function hasUnsupportedServiceArea(values = getFormValues()) {
  const city = normalizeDeliveryPlace(values.city);
  const selectedState = normalizeDeliveryPlace(values.state);
  return Boolean(
    (city && city !== DELIVERY_CITY) ||
    (selectedState && selectedState !== DELIVERY_STATE),
  );
}

function openServiceAreaModal() {
  if (!dom.serviceAreaModal || !dom.serviceAreaModal.hidden) return;
  serviceAreaLastFocused = document.activeElement;
  dom.serviceAreaModal.hidden = false;
  document.body.classList.add("is-modal-open");
  trackEvent("valour_delivery_area_unavailable", {
    city: getFormValues().city,
    state: getFormValues().state,
  });
  window.setTimeout(
    () =>
      dom.serviceAreaModal
        .querySelector("[data-action='close-service-area']")
        ?.focus(),
    50,
  );
}

function closeServiceAreaModal() {
  if (!dom.serviceAreaModal) return;
  dom.serviceAreaModal.hidden = true;
  if (dom.otpModal?.hidden) document.body.classList.remove("is-modal-open");
  serviceAreaLastFocused?.focus?.();
}

function showServiceAreaNoticeIfNeeded() {
  if (hasUnsupportedServiceArea()) openServiceAreaModal();
}

async function postJSON(url, payload, extraHeaders = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Request failed. Please try again.");
  }

  return data;
}

function reportCheckoutDetailsSubmitted() {
  const values = getFormValues();
  if (!values.phone) return;
  const eventKey = "valour_checkout_event_id";
  let eventId = sessionStorage.getItem(eventKey);
  if (!eventId) {
    eventId = window.crypto?.randomUUID?.() || `checkout-${Date.now()}`;
    sessionStorage.setItem(eventKey, eventId);
  }
  window.valourMeta?.track("track", "Lead", {
    content_name: "checkout_details_submitted",
    value: Number(state.totals.total) || 0,
    currency: "INR",
  }, { eventID: `lead_${eventId}` });
  void postJSON(`${API_BASE}/api/customer-events`, {
    eventId,
    event: "checkout_details_submitted",
    phone: values.phone,
    cartId: eventId,
    productName: state.cart.map((item) => item.name).join(", "),
    orderValue: money(state.totals.total),
    attribution: window.valourAttribution?.get?.() || null,
  }).catch((error) =>
    console.warn("Unable to record checkout event", error.message),
  );
}

async function loadUserCoupons() {
  const user = getStoredUser();
  if (dom.universalCouponNotice) dom.universalCouponNotice.hidden = true;
  try {
    const universalRequest = fetch(`${API_BASE}/api/coupons/universal`);
    const assignedRequest = user?.phone
      ? fetch(
          `${API_BASE}/api/coupons/mine?phone=${encodeURIComponent(user.phone)}`,
        )
      : Promise.resolve(null);
    const [universalResponse, assignedResponse] = await Promise.all([
      universalRequest,
      assignedRequest,
    ]);
    const universalData = await universalResponse.json().catch(() => ({}));
    if (!universalResponse.ok || universalData.ok === false)
      throw new Error(universalData.error || "Unable to load coupons");
    const assignedData = assignedResponse
      ? await assignedResponse.json().catch(() => ({}))
      : { coupons: [] };
    if (
      assignedResponse &&
      (!assignedResponse.ok || assignedData.ok === false)
    ) {
      throw new Error(assignedData.error || "Unable to load your coupons");
    }

    const universal = universalData.coupons.map((item) => ({
        ...item,
        status: "available",
        active: true,
        value: item.type === "fixed" ? item.valuePaise : item.value,
        scope: "universal",
      }));
    if (dom.universalCouponText) {
      dom.universalCouponText.textContent =
        universal.length === 1
          ? "1 coupon available"
          : `${universal.length} coupons available`;
    }
    if (dom.universalCouponCodes) {
      dom.universalCouponCodes.textContent = `${universal
        .map((item) => item.code)
        .join("  ·  ")} — apply in the Cart step.`;
    }
    if (dom.universalCouponNotice) {
      dom.universalCouponNotice.hidden = universal.length === 0;
    }
    const assigned = assignedData.coupons || [];
    const available = [
      ...universal,
      ...assigned
        .filter((item) => item.status === "available" && item.active)
        .map((item) => ({ ...item, scope: "assigned" })),
    ].filter(
      (item, index, list) =>
        list.findIndex((candidate) => candidate.code === item.code) === index,
    );
    const used = assigned.filter((item) => item.status === "used").filter(
      (item, index, list) =>
        list.findIndex((candidate) => candidate.code === item.code) === index,
    );
    const retainedHiddenCoupons = Object.fromEntries(
      Object.entries(coupons).filter(([, coupon]) => coupon.scope === "hidden"),
    );
    Object.keys(coupons).forEach((code) => delete coupons[code]);
    available.forEach((item) => {
      coupons[item.code] = {
        label: item.code,
        type: item.type,
        value: item.type === "fixed" ? item.value / 100 : item.value,
        minSubtotal: item.minSubtotalPaise / 100,
        message: `${item.code} applied successfully.`,
        scope: item.scope,
      };
    });
    Object.assign(coupons, retainedHiddenCoupons);
    dom.availableCoupons.innerHTML = available.length
      ? available
          .map((item) => {
            const benefit =
              item.type === "fixed"
                ? `${money(item.value / 100)} off`
                : `${item.value}% off`;
            const minimum = item.minSubtotalPaise
              ? ` above ${money(item.minSubtotalPaise / 100)}`
              : "";
            return `<button class="coupon-chip" type="button" data-coupon="${item.code}"><strong>${item.code}</strong><span>${benefit}${minimum}</span></button>`;
          })
          .join("")
      : "<p>You have no unused coupons right now.</p>";
    dom.usedCoupons.hidden = used.length === 0;
    dom.usedCoupons.innerHTML = used.length
      ? `<p class="field-message">Used coupons: ${used.map((item) => item.code).join(", ")}</p>`
      : "";
    renderCouponState();
  } catch (error) {
    dom.availableCoupons.innerHTML = `<p>${error.message}</p>`;
    if (dom.universalCouponNotice) dom.universalCouponNotice.hidden = true;
  }
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
  const complete = window.valourAttribution?.get?.();
  if (complete) {
    const selected = complete.latestNonDirect || complete.currentSession || {};
    return {
      ...selected,
      visitorId: complete.visitorId,
      sessionId: complete.sessionId,
      firstTouch: complete.firstTouch,
      latestNonDirect: complete.latestNonDirect,
      currentSession: complete.currentSession,
      cookingType: "fish",
      purchaseIntent: "high",
      activationPreference: "custom_checkout",
      segment: "checkout_intent",
    };
  }
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
    medium: params.get("utm_medium") || stored.medium || "",
    content: params.get("utm_content") || stored.content || "",
    term: params.get("utm_term") || stored.term || "",
    landingPage: stored.landingPage || "",
    capturedAt: stored.capturedAt || "",
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
    phoneVerificationToken: getStoredUser()?.phoneVerificationToken || "",
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
  return state.cart.reduce(
    (sum, item) => sum + (item.compareAt || item.price) * item.quantity,
    0,
  );
}

function calculateShipping(subtotal, pincode = "") {
  return 0;
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
  const discountedSubtotal = Math.max(subtotal - discount, 0);
  const total = Math.max(discountedSubtotal + shipping, 0);

  state.totals = { subtotal, discount, shipping, total };
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
      phone: getStoredUser()?.phone || "",
    });
    if (requestId !== state.pricingRequestId) return;
    const quote = result.quote;
    if (
      quote.couponScope === "hidden" &&
      state.coupon &&
      quote.couponCode === state.coupon &&
      Number(quote.discountPaise) > 0
    ) {
      coupons[state.coupon] = {
        label: state.coupon,
        type: "fixed",
        value: quote.discountPaise / 100,
        minSubtotal: 0,
        message: `${state.coupon} applied successfully.`,
        scope: "hidden",
      };
    }
    state.cart = quote.items.map((line) => ({
      ...(state.cart.find((item) => item.id === line.sku) || {}),
      id: line.sku,
      name: line.name,
      size: line.size,
      price: line.unitPricePaise / 100,
      compareAt: (line.compareAtPaise ?? line.unitPricePaise) / 100,
      quantity: line.quantity,
    }));
    state.totals = {
      subtotal: quote.subtotalPaise / 100,
      discount: quote.discountPaise / 100,
      shipping: quote.shippingPaise / 100,
      total: quote.totalPaise / 100,
    };
    trackMetaInitiateCheckout(quote);
    applyQuoteDelivery(quote);
    renderCart();
    renderSummary();
  } catch (error) {
    console.error("Server pricing unavailable", error);
    if (state.coupon && /coupon|already used|usage limit/i.test(error.message)) {
      const rejectedCode = state.coupon;
      delete coupons[rejectedCode];
      state.coupon = null;
      localStorage.removeItem(COUPON_KEY);
      dom.couponInput.value = rejectedCode;
      renderCart();
      renderSummary();
      setCouponError(error.message);
    }
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
  calculateTotals();
  dom.cartItems.innerHTML = "";

  state.cart.forEach((item) => {
    const originalPrice = item.compareAt || item.price;
    const originalLineTotal = originalPrice * item.quantity;
    const lineDiscount =
      state.totals.subtotal > 0
        ? state.totals.discount * (originalLineTotal / state.totals.subtotal)
        : 0;
    const netLineTotal = Math.max(originalLineTotal - lineDiscount, 0);
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
        <div class="cart-trust" aria-label="Product assurances">
          <span>✓ No added preservatives</span>
          <span>✓ Quality checked</span>
          <span>✓ Safety-sealed</span>
        </div>
        </div>
        <div class="item-controls">
          <div class="item-price">
          ${lineDiscount ? `<s>${money(originalLineTotal)}</s>` : ""}
          <strong>${money(netLineTotal)}</strong>
          ${lineDiscount ? `<small>Net after coupon</small>` : ""}
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
  if (isEmpty && state.step === CHECKOUT_STEPS.REVIEW) {
    state.step = CHECKOUT_STEPS.CART;
  }
  renderCheckoutStage();
}

function renderCouponState() {
  document.querySelectorAll(".coupon-chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.coupon === state.coupon);
  });

  if (state.coupon && coupons[state.coupon]) {
    const discountText = state.totals.discount
      ? ` · ${money(state.totals.discount)} off`
      : "";
    setTextAll(
      "[data-applied-coupon]",
      `${state.coupon} applied${discountText}`,
    );
    dom.couponInput.value = state.coupon;
  } else {
    setTextAll("[data-applied-coupon]", "No coupon applied");
  }

  syncCouponApplyButton();
}

function syncCouponApplyButton() {
  if (!dom.couponApplyButton) return;
  const isApplied = Boolean(
    state.coupon && dom.couponInput.value.trim() === state.coupon,
  );
  dom.couponApplyButton.classList.toggle("is-applied", isApplied);
  dom.couponApplyButton.textContent = isApplied ? "Applied" : "Apply";
  dom.couponApplyButton.setAttribute("aria-pressed", String(isApplied));
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
  setTextAll("[data-total]", money(state.totals.total));
  dom.mobileTotal.textContent =
    state.step === CHECKOUT_STEPS.REVIEW
      ? money(state.totals.total)
      : money(Math.max(state.totals.subtotal - state.totals.discount, 0));
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

function applyQuoteDelivery(quote = {}) {
  if (!quote.estimatedDelivery) return;
  state.delivery = {
    expectedDeliveryAt: quote.expectedDeliveryAt,
    deliveryTimeValue: quote.deliveryTimeValue,
    deliveryTimeUnit: quote.deliveryTimeUnit,
    expectedDeliveryStartDate: quote.expectedDeliveryStartDate,
    expectedDeliveryEndDate: quote.expectedDeliveryEndDate,
    estimatedDelivery: quote.estimatedDelivery,
  };
  // setTextAll("[data-delivery-window]", quote.estimatedDelivery);
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
      (name === "details" && hasAddress && !isDetailsStep) ||
        (name === "cart" && hasCart && (isReviewStep || isSuccessStep)) ||
        (name === "payment" && isSuccessStep),
    );
    if (step.classList.contains("is-active")) {
      step.setAttribute("aria-current", "step");
    } else {
      step.removeAttribute("aria-current");
    }
  });

  document.querySelectorAll(".progress-line").forEach((line, index) => {
    line.classList.toggle(
      "is-complete",
      index === 0
        ? (isCartStep || isReviewStep || isSuccessStep) && hasAddress
        : (isReviewStep || isSuccessStep) && hasCart,
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

async function applyCoupon(rawCode) {
  const enteredCode = String(rawCode || "").trim();
  const listedCode = enteredCode.toUpperCase();
  let code = coupons[listedCode] ? listedCode : enteredCode;
  const subtotal = getSubtotal();
  let coupon = coupons[code];

  dom.couponRow.classList.remove("is-invalid");
  dom.couponMessage.className = "field-message";

  if (!state.cart.length) {
    setCouponError("Add an item before applying a coupon.");
    return;
  }

  if (!enteredCode) {
    setCouponError("Enter a coupon code.");
    return;
  }

  if (!coupon) {
    try {
      const result = await postJSON(`${API_BASE}/api/checkout/quote`, {
        items: state.cart.map((item) => ({
          sku: item.id,
          quantity: item.quantity,
        })),
        pincode: /^\d{6}$/.test(getPincode()) ? getPincode() : "",
        couponCode: enteredCode,
        phone: getStoredUser()?.phone || "",
      });
      if (
        result.quote?.couponCode !== enteredCode ||
        Number(result.quote.discountPaise) <= 0
      ) {
        throw new Error("That code is not active for this order.");
      }
      code = result.quote.couponCode;
      coupon = coupons[code] = {
        label: code,
        type: "fixed",
        value: result.quote.discountPaise / 100,
        minSubtotal: 0,
        message: "Coupon applied successfully.",
        scope: result.quote.couponScope || "hidden",
      };
    } catch (error) {
      setCouponError(
        error.message || "That code is not active for this order.",
      );
      trackEvent("valour_coupon_invalid", { coupon: enteredCode });
      return;
    }
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
  dom.couponMessage.className = "field-message is-error";
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
  if (!values.city || values.city.trim().length < 2) {
    errors.city = "Enter your city.";
  } else if (normalizeDeliveryPlace(values.city) !== DELIVERY_CITY) {
    errors.city = "Delivery is currently available only in Agartala.";
  }
  if (!values.state) {
    errors.state = "Select your state.";
  } else if (normalizeDeliveryPlace(values.state) !== DELIVERY_STATE) {
    errors.state = "Delivery is currently available only in Tripura.";
  }
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
    if (!isServiceAreaSupported(values) && hasUnsupportedServiceArea(values)) {
      openServiceAreaModal();
    }
  }

  return Object.keys(errors).length === 0;
}

function saveDraft() {
  const values = getFormValues();
  const shippingFields = [
    "name",
    "phone",
    "email",
    "address",
    "landmark",
    "city",
    "state",
    "pincode",
  ];
  const shippingDetails = Object.fromEntries(
    shippingFields.map((field) => [field, values[field] || ""]),
  );
  localStorage.setItem(DRAFT_KEY, JSON.stringify(shippingDetails));
  const phoneKey = String(shippingDetails.phone).replace(/\D/g, "").slice(-10);
  if (/^[6-9]\d{9}$/.test(phoneKey)) {
    const customers = readJSON(CUSTOMER_DETAILS_KEY, {});
    customers[phoneKey] = {
      ...shippingDetails,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(CUSTOMER_DETAILS_KEY, JSON.stringify(customers));
  }
}

function hydrateDraft() {
  const user = getStoredUser();
  const phoneKey = String(user?.phone || "")
    .replace(/\D/g, "")
    .slice(-10);
  const customers = readJSON(CUSTOMER_DETAILS_KEY, {});
  const draft = customers[phoneKey] || readJSON(DRAFT_KEY, {});
  Object.entries(draft).forEach(([key, value]) => {
    if (dom.form.elements[key]) {
      dom.form.elements[key].value = value;
    }
  });
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
  if (state.paymentMethod === "COD") {
    dom.successMessage.textContent =
      "Your Valour order has been saved. Pay when your order is delivered. We will share dispatch updates on WhatsApp.";
    dom.successTotalLabel.textContent = "Amount due on delivery";
  } else {
    dom.successMessage.textContent =
      "Your payment has been verified and your Valour order is now saved. We will share dispatch updates on WhatsApp.";
    dom.successTotalLabel.textContent = "Total paid";
  }
  dom.successTotal.textContent = money(state.totals.total);
}

function showCartStep() {
  saveDraft();
  scheduleServerPricing();
  setCheckoutStep(CHECKOUT_STEPS.CART);
  dom.cartPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  trackEvent("valour_checkout_step_cart");
}

function continueToCart(event) {
  if (event) event.preventDefault();

  if (!validateForm(true)) {
    showToast("A few delivery details need attention.", "error");
    return;
  }

  const values = getFormValues();
  if (!hasVerifiedUser(values.phone)) {
    saveDraft();
    startOtpVerification("cart");
    return;
  }

  showCartStep();
}

function showReviewStep() {
  saveDraft();
  scheduleServerPricing();
  setCheckoutStep(CHECKOUT_STEPS.REVIEW);
  document
    .querySelector(".mobile-summary-panel")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  trackEvent("valour_checkout_step_review", {
    value: state.totals.total,
    currency: "INR",
  });
  reportCheckoutDetailsSubmitted();
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
  if (state.step === CHECKOUT_STEPS.DETAILS) {
    continueToCart();
    return;
  }

  if (state.step === CHECKOUT_STEPS.CART) {
    continueToReview();
    return;
  }

  placeOrder();
}

async function sendOtp(phone, checkoutDetails = otpState.pendingUser) {
  otpState.phone = phone;
  const result = await postJSON(`${API_BASE}/api/auth/otp/send`, {
    phone,
    checkoutDetails,
  });
  if (result.existingUser) return result;
  otpState.challengeId = result.challengeId;
  console.info("[FAST2SMS_AUTH][OTP_REQUEST_ACCEPTED]", {
    recipient: `***${String(phone).replace(/\D/g, "").slice(-4)}`,
    challengeId: result.challengeId,
  });
  trackEvent("valour_otp_send", { phone });
  showToast(`OTP sent to ${phone}.`);
  return result;
}

function saveVerifiedUser(verification) {
  const verifiedUser = {
    ...otpState.pendingUser,
    verifiedPhoneNumber: verification.phone,
    phoneVerificationToken: verification.verificationToken,
    verifiedAt: verification.verifiedAt,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
  saveDraft();
  otpState.pendingUser = null;
  setOrderButtonLabels();
  loadUserCoupons();
}

function updateOtpResendCountdown() {
  const seconds = Math.max(
    0,
    Math.ceil((otpState.resendAvailableAt - Date.now()) / 1000),
  );
  dom.otpResendButton.disabled = seconds > 0 || otpState.sending;
  dom.otpResendStatus.textContent =
    seconds > 0
      ? `Resend SMS available in 00:${String(seconds).padStart(2, "0")}`
      : "Didn't receive the code?";
  if (seconds === 0 && otpState.countdownTimer) {
    window.clearInterval(otpState.countdownTimer);
    otpState.countdownTimer = null;
  }
}

function startOtpResendCountdown() {
  if (otpState.countdownTimer) window.clearInterval(otpState.countdownTimer);
  otpState.resendAvailableAt = Date.now() + 60_000;
  updateOtpResendCountdown();
  otpState.countdownTimer = window.setInterval(updateOtpResendCountdown, 250);
}

async function resendOtp() {
  if (otpState.sending || Date.now() < otpState.resendAvailableAt) return;
  otpState.sending = true;
  dom.otpError.textContent = "";
  updateOtpResendCountdown();
  try {
    await sendOtp(otpState.phone);
    dom.otpInput.value = "";
    startOtpResendCountdown();
    dom.otpInput.focus();
  } catch (error) {
    dom.otpError.textContent =
      error?.message || "Unable to resend the SMS. Please try again.";
  } finally {
    otpState.sending = false;
    updateOtpResendCountdown();
  }
}

function openOtpModal() {
  dom.otpModal.hidden = false;
  document.body.classList.add("is-modal-open");
  dom.otpInput.value = "";
  dom.otpError.textContent = "";
  dom.otpHelpPanel.hidden = true;
  dom.otpHelpToggle.setAttribute("aria-expanded", "false");
  dom.otpMessage.textContent = `We sent a 6-digit OTP to ${otpState.phone}.`;
  startOtpResendCountdown();
  window.setTimeout(() => dom.otpInput.focus(), 50);
}

function showOtpWhatsappHelp() {
  const customer = otpState.pendingUser || getFormValues();
  const customerName = String(customer.name || "Customer").trim();
  const customerPhone = String(customer.phone || otpState.phone || "").trim();
  const message = [
    "Hello from the VALOUR website.",
    "I need help with OTP verification.",
    `Name: ${customerName}`,
    `Registered phone: +91${customerPhone.replace(/\D/g, "").slice(-10)}`,
  ].join("\n");
  dom.otpHelpLink.href = `https://wa.me/${OTP_HELP_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  dom.otpHelpPanel.hidden = false;
  dom.otpHelpToggle.setAttribute("aria-expanded", "true");
  trackEvent("valour_otp_help_revealed", { phone: customerPhone });
}

function closeOtpModal() {
  dom.otpModal.hidden = true;
  document.body.classList.remove("is-modal-open");
}

async function startOtpVerification(nextAction = null) {
  if (otpState.sending) return;
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
  };
  otpState.sending = true;
  showToast("Sending verification code...");
  try {
    const result = await sendOtp(values.phone);
    if (result.existingUser) {
      saveVerifiedUser(result);
      showToast("Welcome back. Your details have been saved.");
      if (otpState.nextAction === "cart") showCartStep();
      if (otpState.nextAction === "review") showReviewStep();
      otpState.nextAction = null;
      return;
    }
    openOtpModal();
  } catch (error) {
    showToast(
      error?.message || "Phone verification failed. Please try again.",
      "error",
    );
  } finally {
    otpState.sending = false;
  }
}

async function verifyOtp(event) {
  event.preventDefault();

  const enteredOtp = dom.otpInput.value.trim();
  dom.otpError.textContent = "";

  if (!/^\d{6}$/.test(enteredOtp)) {
    dom.otpError.textContent = "Enter the 6-digit OTP.";
    return;
  }

  const verifyButton = dom.otpForm.querySelector("[data-verify-otp]");
  setLoading(verifyButton, true);
  let verification;
  try {
    verification = await postJSON(`${API_BASE}/api/auth/otp/verify`, {
      phone: otpState.phone,
      challengeId: otpState.challengeId,
      otp: enteredOtp,
    });
  } catch (error) {
    dom.otpError.textContent =
      error?.message || "Phone verification failed. Please try again.";
    setLoading(verifyButton, false);
    return;
  }

  saveVerifiedUser(verification);
  setLoading(verifyButton, false);
  closeOtpModal();
  trackEvent("valour_user_verified", { phone: otpState.phone });
  showToast("Mobile verified.");

  if (otpState.nextAction === "cart") {
    otpState.nextAction = null;
    showCartStep();
    return;
  }

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

  trackMetaAddPaymentInfo();

  setOrderLoading(true);
  showToast(
    state.paymentMethod === "COD"
      ? "Placing your COD order..."
      : `Opening ${getPaymentMethodLabel()} payment...`,
  );
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

    if (state.paymentMethod === "COD") {
      const idempotencyStorageKey = "valour_cod_idempotency_key";
      const generatedIdempotencyKey =
        globalThis.crypto?.randomUUID?.() ||
        `cod-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      const idempotencyKey =
        sessionStorage.getItem(idempotencyStorageKey) ||
        generatedIdempotencyKey;
      sessionStorage.setItem(idempotencyStorageKey, idempotencyKey);
      const codOrder = await postJSON(
        `${API_BASE}/api/orders/cod`,
        { order: orderPayload },
        { "Idempotency-Key": idempotencyKey },
      );
      sessionStorage.setItem(
        ORDER_RESULT_KEY,
        JSON.stringify({
          ...codOrder.order,
          orderId: codOrder.orderId,
          deliveryEstimate: orderPayload.delivery.estimate,
          paymentMethod: "COD",
          paymentMethodLabel: "Cash on delivery",
        }),
      );
      trackEvent("valour_purchase", {
        order_id: codOrder.orderId,
        value: codOrder.order.totalAmount,
        currency: "INR",
        items: codOrder.order.products,
        payment_method: "COD",
      });
      trackMetaPurchase({
        value: codOrder.order.totalAmount,
        currency: codOrder.order.currency || "INR",
        items: codOrder.order.products,
        orderId: codOrder.orderId,
      });
      state.cart = [];
      state.coupon = null;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COUPON_KEY);
      sessionStorage.removeItem(idempotencyStorageKey);
      window.location.href = "order-success.html";
      return;
    }

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
        compareAt: (line.compareAtPaise ?? line.unitPricePaise) / 100,
        quantity: line.quantity,
      }));
      state.totals = {
        subtotal: quote.subtotalPaise / 100,
        discount: quote.discountPaise / 100,
        shipping: quote.shippingPaise / 100,
        total: quote.totalPaise / 100,
      };
      applyQuoteDelivery(quote);
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
      order_id: verifiedOrder.orderId,
      value: verifiedOrder.order.totalAmount,
      currency: "INR",
      items: state.cart,
      razorpay_order_id: verifiedOrder.order?.razorpayOrderId,
    });
    if (verifiedOrder.metaPurchaseConfirmed) trackMetaPurchase({
      value: verifiedOrder.order.totalAmount,
      currency: verifiedOrder.order?.currency || "INR",
      items: verifiedOrder.order.products,
      orderId: verifiedOrder.orderId,
    });

    state.cart = [];
    state.coupon = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COUPON_KEY);

    window.location.href = "order-success.html";
  } catch (error) {
    console.error(
      state.paymentMethod === "COD" ? "COD order failed" : "Payment failed",
      error,
    );
    if (state.paymentMethod === "COD") {
      showToast(
        error.message || "Unable to place the COD order. Please try again.",
        "error",
      );
      return;
    }
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
  document.querySelectorAll("[data-progress-step]").forEach((step) => {
    step.addEventListener("click", () =>
      navigateToProgressStep(step.dataset.progressStep),
    );
  });

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
  dom.couponInput.addEventListener("input", syncCouponApplyButton);

  dom.availableCoupons.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-coupon]");
    if (chip) applyCoupon(chip.dataset.coupon);
  });

  document
    .querySelector("[data-action='continue-to-cart']")
    .addEventListener("click", continueToCart);
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

  dom.form.addEventListener("submit", continueToCart);
  dom.form.addEventListener("input", () => {
    saveDraft();
    updateProgress();
  });
  dom.form.elements.pincode.addEventListener("input", scheduleServerPricing);
  dom.form.elements.city.addEventListener(
    "blur",
    showServiceAreaNoticeIfNeeded,
  );
  dom.form.elements.state.addEventListener(
    "change",
    showServiceAreaNoticeIfNeeded,
  );

  document.querySelectorAll("[data-payment-input]").forEach((input) => {
    input.addEventListener("change", () => {
      setPaymentMethod(input.value);
      trackEvent("valour_payment_select", {
        payment_method: input.value,
      });
      trackMetaAddPaymentInfo();
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
    .querySelectorAll("[data-action='close-service-area']")
    .forEach((button) =>
      button.addEventListener("click", closeServiceAreaModal),
    );
  dom.serviceAreaModal?.addEventListener("click", (event) => {
    if (event.target === dom.serviceAreaModal) closeServiceAreaModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dom.serviceAreaModal?.hidden) {
      closeServiceAreaModal();
    }
  });
  dom.otpForm.addEventListener("submit", verifyOtp);
  dom.otpResendButton.addEventListener("click", resendOtp);
  dom.otpHelpToggle.addEventListener("click", showOtpWhatsappHelp);
  dom.otpHelpLink.addEventListener("click", () =>
    trackEvent("valour_otp_help_whatsapp_opened", { phone: otpState.phone }),
  );
}

function init() {
  state.cart = cloneCart(readJSON(STORAGE_KEY, sampleCart)).map((item) =>
    ["milky-mustard-520", "velvety-butter-520"].includes(item.id)
      ? {
          ...item,
          id: "velvety-butter-chicken",
          name: "Velvety Butter Chicken",
          descriptor:
            "Make restaurant-style Butter Chicken at home. Just add chicken.",
        }
      : item,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  state.coupon = localStorage.getItem(COUPON_KEY);
  hydrateDraft();

  setPaymentMethod(state.paymentMethod);
  bindEvents();
  renderAll();
  loadUserCoupons();
  trackEvent("valour_checkout_view");
}

init();

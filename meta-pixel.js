/* Shared Pixel/CAPI IDs. No credentials or raw customer data in Pixel parameters. */
(() => {
  "use strict";
  const original = window.fbq;
  if (!original || window.valourMeta) return;
  if (window.valourAttribution?.get?.().measurementAllowed === false) {
    window.valourMeta = { track() {} };
    return;
  }
  const mirrored = new Set(["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "AddPaymentInfo", "Lead", "Contact", ...["coupon_applied", "payment_failed", "coupon_invalid", "otp_send", "cart_quantity_update", "user_verified", "checkout_step_cart", "delivery_area_unavailable", "checkout_view", "begin_checkout", "payment_select", "remove_from_cart", "checkout_progress_click", "checkout_step_review"].map(x => `valour_${x}`)]);
  const seen = new Set();
  let ready = false;
  const queue = [];
  const safeUrl = () => location.origin + (/^\/(?:index\.html|checkout(?:\.html)?|cart\.html|order-success\.html|payment-failed\.html|privacy-policy(?:\.html)?|review(?:\.html)?|pay-order\.html|track-order\.html)?$/.test(location.pathname) ? location.pathname : "/");
  function clean(data = {}) {
    const out = {};
    for (const key of ["value", "currency", "content_ids", "content_type", "content_name", "contents", "num_items", "order_id", "payment_method", "step", "quantity", "coupon", "city"]) if (data[key] !== undefined) out[key] = data[key];
    if (data.item_id && !out.content_ids) out.content_ids = [data.item_id];
    return out;
  }
  function track(command, name, data = {}, options = {}) {
    if (!["track", "trackCustom"].includes(command)) return original.apply(window, arguments);
    try {
      if (!ready) { queue.push([command, name, data, options]); return; }
      if (!mirrored.has(name) && name !== "Purchase" && name !== "valour_purchase") return original(command, name, data, options);
      const purchase = name === "Purchase" || name === "valour_purchase";
      if (purchase && !data.order_id) return;
      const eventId = purchase ? `${name === "Purchase" ? "purchase" : "valour_purchase"}_${data.order_id}` : options.eventID || crypto.randomUUID();
      const key = `valour_meta_${eventId}`;
      if (purchase || options.eventID) {
        if (seen.has(key)) return;
        try { if (localStorage.getItem(key)) return; } catch { /* Storage may be disabled. */ }
      }
      const safe = clean(data);
      original(command, name, safe, { ...options, eventID: eventId });
      const gaName = { ViewContent: "view_item", AddToCart: "add_to_cart", InitiateCheckout: "begin_checkout", AddPaymentInfo: "add_payment_info", Purchase: "purchase", Lead: "generate_lead" }[name];
      if (gaName && typeof window.gtag === "function") window.gtag("event", gaName, {
        currency: safe.currency,
        value: safe.value,
        transaction_id: safe.order_id,
        payment_type: safe.payment_method,
        items: (safe.contents || []).map(item => ({ item_id: item.id, quantity: item.quantity, price: item.item_price })),
      });
      const measurementEvent = { PageView: "page_view", ViewContent: "view_content", AddToCart: "add_to_cart", InitiateCheckout: "checkout_started", AddPaymentInfo: "add_payment_info", Lead: "lead", Contact: "contact" }[name];
      if (measurementEvent && name !== "PageView") window.valourAttribution?.track(measurementEvent, { itemId: safe.content_ids?.[0], contentName: safe.content_name, value: safe.value, currency: safe.currency, paymentMethod: safe.payment_method }, { eventId });
      if (purchase || options.eventID) {
        seen.add(key);
        try { localStorage.setItem(key, "1"); } catch { /* Stable ID still deduplicates. */ }
      }
      if (purchase) {
        void fetch("/api/meta/browser-attempt", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", keepalive: true, body: JSON.stringify({ event_name: "Purchase", event_id: eventId }) }).catch(() => {});
      }
      if (mirrored.has(name)) {
        let customer = {};
        try {
          const values = window.valourMeta.customer?.() || {};
          for (const key of ["name", "email", "phone", "city", "state", "pincode"]) if (typeof values[key] === "string" && values[key].trim()) customer[key] = values[key].trim().slice(0, 256);
        } catch { /* Early page view. */ }
        void fetch("/api/meta/events", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", keepalive: true,
          body: JSON.stringify({ event_name: name, event_id: eventId, event_time: Math.floor(Date.now() / 1000), event_source_url: safeUrl(), custom_data: safe, customer }) }).then(async response => {
            if (!response.ok) {
              const details = await response.json().catch(() => ({}));
              console.warn("[META]", { stage: "ingress", event: name, status: response.status, reason: details.reason || "request_rejected" });
            }
          }).catch(() => { console.warn("[META]", { stage: "ingress", event: name, reason: "network_error" }); });
      }
    } catch { /* Analytics must never interrupt customer actions. */ }
  }
  window.valourMeta = { track };
  // Leave Meta's fbq object intact: the SDK installs callMethod on this object.
  // Call sites use valourMeta.track; fbq remains available for unrelated tracking.
  fetch("/api/meta/config", { credentials: "same-origin" }).then(r => r.ok ? r.json() : Promise.reject()).then(({ pixelId }) => {
    if (!/^\d+$/.test(pixelId)) throw new Error("Invalid Pixel configuration");
    original("init", pixelId);
    ready = true;
    track("track", "PageView");
    for (const args of queue.splice(0)) track(...args);
  }).catch(() => { console.warn("[META] Pixel configuration unavailable"); });
})();

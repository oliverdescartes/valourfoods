/* Shared Pixel/CAPI IDs. No credentials or raw customer data in Pixel parameters. */
(() => {
  "use strict";
  const original = window.fbq;
  if (!original || window.valourMeta) return;
  const mirrored = new Set(["PageView", "ViewContent", "AddToCart", "InitiateCheckout", ...["coupon_applied", "payment_failed", "coupon_invalid", "otp_send", "cart_quantity_update", "user_verified", "checkout_step_cart", "delivery_area_unavailable", "checkout_view", "begin_checkout", "payment_select", "remove_from_cart", "checkout_progress_click", "checkout_step_review"].map(x => `valour_${x}`)]);
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
      if (purchase) {
        if (seen.has(key)) return;
        try { if (localStorage.getItem(key)) return; } catch { /* Storage may be disabled. */ }
      }
      const safe = clean(data);
      original(command, name, safe, { ...options, eventID: eventId });
      if (purchase) {
        seen.add(key);
        try { localStorage.setItem(key, "1"); } catch { /* Stable ID still deduplicates. */ }
      }
      if (mirrored.has(name)) {
        let customer = {};
        try {
          const values = window.valourMeta.customer?.() || {};
          for (const key of ["name", "email", "phone", "city", "state", "pincode"]) if (typeof values[key] === "string" && values[key].trim()) customer[key] = values[key].trim().slice(0, 256);
        } catch { /* Early page view. */ }
        void fetch("/api/meta/events", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", keepalive: true,
          body: JSON.stringify({ event_name: name, event_id: eventId, event_time: Math.floor(Date.now() / 1000), event_source_url: safeUrl(), custom_data: safe, customer }) }).catch(() => {});
      }
    } catch { /* Analytics must never interrupt customer actions. */ }
  }
  window.valourMeta = { track };
  // Leave Meta's fbq object intact: the SDK installs callMethod on this object.
  // Call sites use valourMeta.track; fbq remains available for unrelated tracking.
  fetch("/api/meta/config", { credentials: "same-origin" }).then(r => r.ok ? r.json() : Promise.reject()).then(({ pixelId }) => {
    if (!/^\d+$/.test(pixelId)) return;
    original("init", pixelId);
    ready = true;
    track("track", "PageView");
    for (const args of queue.splice(0)) track(...args);
  }).catch(() => {});
})();

/* VALOUR first-touch, latest-non-direct and session attribution. */
(() => {
  "use strict";

  const VERSION = 1;
  const FIRST_KEY = "valour_attribution_first_v1";
  const LATEST_KEY = "valour_attribution_latest_v1";
  const VISITOR_KEY = "valour_analytics_visitor_v1";
  const SESSION_KEY = "valour_analytics_session_v1";
  const LEGACY_KEY = "valour_checkout_attribution";
  const SESSION_MS = 30 * 60 * 1000;
  const ATTRIBUTION_MS = 90 * 24 * 60 * 60 * 1000;
  const SAFE_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "fbclid", "gclid"];
  const PAYMENT_HOSTS = /(?:razorpay|paypal|stripe|payu|cashfree|phonepe)\./i;
  const SEARCH_HOSTS = /(?:google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\.)/i;
  const SOCIAL_HOSTS = /(?:instagram\.com|facebook\.com|fb\.com|youtube\.com|youtu\.be|linkedin\.com|twitter\.com|x\.com|pinterest\.com)$/i;
  const memory = new Map();

  const nowIso = () => new Date().toISOString();
  const id = prefix => `${prefix}_${Date.now().toString(36)}_${(crypto.randomUUID?.() || `${Math.random()}${Math.random()}`).replace(/[^a-z0-9]/gi, "").slice(0, 18)}`;
  const clean = (value, max = 256) => String(value || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9._~+{}:-]/g, "").slice(0, max);
  const cleanClickId = value => String(value || "").trim().replace(/[^A-Za-z0-9._~-]/g, "").slice(0, 500);
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return memory.get(key) || null; }
    },
    set(key, value) {
      memory.set(key, value);
      try { localStorage.setItem(key, value); } catch { /* memory fallback */ }
    },
    sessionGet(key) {
      try { return sessionStorage.getItem(key); } catch { return memory.get(`s:${key}`) || null; }
    },
    sessionSet(key, value) {
      memory.set(`s:${key}`, value);
      try { sessionStorage.setItem(key, value); } catch { /* memory fallback */ }
    },
  };
  function read(key, session = false) {
    try { return JSON.parse(session ? storage.sessionGet(key) : storage.get(key)) || null; } catch { return null; }
  }
  function write(key, value, session = false) {
    (session ? storage.sessionSet : storage.set)(key, JSON.stringify(value));
  }
  function hostOf(value) {
    try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
  }
  function isInternal(host) {
    const current = location.hostname.toLowerCase().replace(/^www\./, "");
    return Boolean(host) && host === current;
  }
  function classify(touch) {
    const source = touch.source;
    const medium = touch.medium;
    if (/^(paid|paid_social|social_paid|cpm|paidsocial|paid_video|cpc)$/.test(medium) && /^(fb|facebook|ig|instagram|youtube|linkedin|twitter|x|pinterest)$/.test(source)) return "paid_social";
    if (/^(paid_social|social_paid|cpm|paidsocial|paid_video)$/.test(medium)) return "paid_social";
    if (/^(cpc|ppc|paid_search|search_paid)$/.test(medium) && /google|bing|yahoo/.test(source)) return "paid_search";
    if (/^(organic_social|organic_video|social|social_media)$/.test(medium) || /instagram|facebook|youtube|linkedin|twitter|pinterest/.test(source) && medium === "organic") return "organic_social";
    if (medium === "organic" && /google|bing|yahoo|duckduckgo|ecosia/.test(source)) return "organic_search";
    if (medium === "email") return "email";
    if (/whatsapp/.test(source) || /^(messaging|whatsapp)$/.test(medium)) return "whatsapp";
    if (/^(influencer|partner|affiliate)$/.test(medium)) return "referral";
    if (medium === "qr") return "referral";
    if (medium === "referral") return "referral";
    if (source === "direct") return "direct";
    return source || medium ? "unknown" : "direct";
  }
  function safeLanding() {
    const url = new URL(location.href);
    const params = new URLSearchParams();
    for (const key of SAFE_PARAMS) if (url.searchParams.has(key)) params.set(key, url.searchParams.get(key).slice(0, 500));
    return `${url.pathname}${params.size ? `?${params}` : ""}`.slice(0, 1500);
  }
  function touchFromPage() {
    const params = new URLSearchParams(location.search);
    const hasCampaign = SAFE_PARAMS.some(key => params.has(key));
    const referrerHost = hostOf(document.referrer);
    let source = clean(params.get("utm_source"));
    let medium = clean(params.get("utm_medium"));
    if (!source && params.get("fbclid")) source = "facebook";
    if (!medium && params.get("fbclid")) medium = "paid_social";
    if (!source && params.get("gclid")) source = "google";
    if (!medium && params.get("gclid")) medium = "cpc";
    if (!hasCampaign && referrerHost && !isInternal(referrerHost) && !PAYMENT_HOSTS.test(referrerHost)) {
      source = referrerHost;
      medium = SEARCH_HOSTS.test(referrerHost) ? "organic" : SOCIAL_HOSTS.test(referrerHost) ? "organic_social" : "referral";
    }
    if (!source && !medium) source = "direct";
    const touch = {
      source, medium,
      campaign: clean(params.get("utm_campaign")),
      content: clean(params.get("utm_content")),
      term: clean(params.get("utm_term")),
      id: clean(params.get("utm_id")),
      fbclid: cleanClickId(params.get("fbclid")),
      gclid: cleanClickId(params.get("gclid")),
      channel: "",
      landingPage: safeLanding(),
      referrer: referrerHost && !isInternal(referrerHost) && !PAYMENT_HOSTS.test(referrerHost) ? referrerHost.slice(0, 253) : "",
      capturedAt: nowIso(),
    };
    touch.channel = classify(touch);
    return { touch, nonDirect: touch.channel !== "direct", explicitlyTagged: hasCampaign };
  }
  function validTouch(value) {
    return value && Date.now() - Date.parse(value.capturedAt || 0) < ATTRIBUTION_MS ? value : null;
  }
  function initialize() {
    const denied = storage.get("valour_analytics_consent") === "denied" || navigator.doNotTrack === "1";
    const current = touchFromPage();
    let first = validTouch(read(FIRST_KEY));
    let latest = validTouch(read(LATEST_KEY));
    if (!first) { first = current.touch; if (!denied) write(FIRST_KEY, first); }
    if (current.nonDirect) { latest = current.touch; if (!denied) write(LATEST_KEY, latest); }

    const oldSession = read(SESSION_KEY, true);
    const oldTouch = oldSession?.touch || {};
    const campaignChanged = current.nonDirect && ["source", "medium", "campaign", "content", "id"].some(key => (current.touch[key] || "") !== (oldTouch[key] || ""));
    const expired = !oldSession || Date.now() - Date.parse(oldSession.lastActivityAt || 0) >= SESSION_MS || campaignChanged;
    const session = expired ? { id: id("ses"), startedAt: nowIso(), touch: current.touch } : { ...oldSession, lastActivityAt: nowIso() };
    session.lastActivityAt = nowIso();
    if (!denied) write(SESSION_KEY, session, true);
    const visitorId = denied ? id("ephemeral") : storage.get(VISITOR_KEY) || id("vis");
    if (!denied) storage.set(VISITOR_KEY, visitorId);

    const state = { version: VERSION, visitorId, sessionId: session.id, firstTouch: first, latestNonDirect: latest, currentSession: session.touch, attributionExpiresDays: 90, sessionTimeoutMinutes: 30, measurementAllowed: !denied };
    window.valourAttribution = {
      get: () => JSON.parse(JSON.stringify(state)),
      identify: customer => track("lead", { customer }),
      track,
    };
    // Backward compatibility for checkout while all callers migrate to the full object.
    const legacy = { ...state.latestNonDirect || state.currentSession, visitorId, sessionId: session.id, firstTouch: state.firstTouch, latestNonDirect: state.latestNonDirect, currentSession: state.currentSession };
    storage.sessionSet(LEGACY_KEY, JSON.stringify(legacy));
    if (!denied) track("page_view", { title: document.title.slice(0, 200) });
    return state;

    function track(event, details = {}, options = {}) {
      if (denied) return null;
      const eventId = options.eventId || id("evt");
      const payload = { eventId, event, occurredAt: nowIso(), attribution: state, details };
      try {
        fetch("/api/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", keepalive: true, body: JSON.stringify(payload) }).catch(() => {});
      } catch { /* measurement must not interrupt the page */ }
      return eventId;
    }
  }
  initialize();
})();

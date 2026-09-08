# VALOUR acquisition measurement

## Attribution rules

- A measured visitor is a pseudonymous browser ID. It is not a known person until the visitor supplies identifying information.
- A session lasts until 30 minutes of inactivity. Opening a different tagged campaign also starts a new session.
- First touch and latest non-direct touch remain in browser local storage for 90 days. Current-session attribution remains in session storage. Server analytics events are retained for approximately 25 months; Meta delivery diagnostics are retained for 90 days.
- A tagged URL creates a complete touch. Empty fields are kept empty and are never copied from an older campaign.
- Direct returns and internal links do not overwrite latest non-direct attribution. Payment-provider referrals are ignored.
- Stored landing URLs contain only `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`, `fbclid`, and `gclid`. Other query parameters are removed.
- `www.liquidspice.in` and `liquidspice.in` are treated as the same site.
- The application honors the stored `valour_analytics_consent=denied` choice and browser Do Not Track for its analytics, GA consent mode, and Meta JavaScript tracking.

The admin report uses Asia/Kolkata dates. “Latest non-direct” is the default model; “First touch” is available as a selector. Purchases mean a captured/paid online order or a placed COD order. Conversion rate is purchases divided by measured visitors for the selected attribution and date filters.

Counts are limited by consent, browser blocking, cleared storage, and cross-device use. “Meta accepted” means the Graph API accepted the server request. Meta processing, deduplication, and ad attribution must be checked in Events Manager.

## Event inventory

| Action | GA4 event | Meta browser | Meta server | Duplicate control |
|---|---|---|---|---|
| Public page load | automatic `page_view` | `PageView` | `PageView` | Shared generated event ID for Pixel/CAPI |
| Product becomes visible | `view_item` | `ViewContent` | `ViewContent` | Shared generated event ID |
| Add to cart | `add_to_cart` | `AddToCart` | `AddToCart` | Shared generated event ID |
| Checkout begins | `begin_checkout` | `InitiateCheckout` | `InitiateCheckout` | One browser trigger per checkout load; shared event ID |
| Payment method selected | `add_payment_info` | `AddPaymentInfo` | `AddPaymentInfo` | One logical event per deliberate selection; shared event ID |
| Checkout details submitted | `generate_lead` | `Lead` | `Lead` | Stable checkout event ID; refresh/double-submit guard |
| WhatsApp support click | — | `Contact` | `Contact` | Shared generated event ID |
| Successful purchase | `purchase` | `Purchase` | `Purchase` | `purchase_<database order id>` on both sides; durable CAPI retries reuse it |
| Checkout UI signals | existing `valour_*` events | selected custom events | selected custom events | Shared event ID per call |
| Product/recipe section visibility | — | `ProductSliderView`, `LooksTastesSectionView` | Browser only | Intersection observer disconnects after the first qualifying view |

Online Purchase becomes eligible only after payment signature/amount validation and capture evidence. COD Purchase becomes eligible once the idempotently-created COD order is stored. Failed, pending, cancelled, duplicate, and WhatsApp-channel orders do not create website Purchase events.

## Campaign links

Use a different `utm_content` value for every creative. Change `butter_chicken_launch` when the promotion changes.

| Case | URL |
|---|---|
| Instagram paid reel | `https://liquidspice.in/?utm_source=instagram&utm_medium=paid_social&utm_campaign=butter_chicken_launch&utm_content=reel_ad_01` |
| Instagram paid story | `https://liquidspice.in/?utm_source=instagram&utm_medium=paid_social&utm_campaign=butter_chicken_launch&utm_content=story_ad_01` |
| Instagram paid feed | `https://liquidspice.in/?utm_source=instagram&utm_medium=paid_social&utm_campaign=butter_chicken_launch&utm_content=feed_ad_01` |
| Facebook paid reel | `https://liquidspice.in/?utm_source=facebook&utm_medium=paid_social&utm_campaign=butter_chicken_launch&utm_content=reel_ad_01` |
| Facebook paid story | `https://liquidspice.in/?utm_source=facebook&utm_medium=paid_social&utm_campaign=butter_chicken_launch&utm_content=story_ad_01` |
| Facebook paid feed | `https://liquidspice.in/?utm_source=facebook&utm_medium=paid_social&utm_campaign=butter_chicken_launch&utm_content=feed_ad_01` |
| Instagram organic reel | `https://liquidspice.in/?utm_source=instagram&utm_medium=organic_social&utm_campaign=butter_chicken_launch&utm_content=reel_01` |
| Instagram organic post | `https://liquidspice.in/?utm_source=instagram&utm_medium=organic_social&utm_campaign=butter_chicken_launch&utm_content=post_01` |
| Instagram organic story | `https://liquidspice.in/?utm_source=instagram&utm_medium=organic_social&utm_campaign=butter_chicken_launch&utm_content=story_01` |
| Instagram bio | `https://liquidspice.in/?utm_source=instagram&utm_medium=organic_social&utm_campaign=profile&utm_content=bio` |
| Facebook organic reel | `https://liquidspice.in/?utm_source=facebook&utm_medium=organic_social&utm_campaign=butter_chicken_launch&utm_content=reel_01` |
| Facebook organic post | `https://liquidspice.in/?utm_source=facebook&utm_medium=organic_social&utm_campaign=butter_chicken_launch&utm_content=post_01` |
| Google Search ad | `https://liquidspice.in/?utm_source=google&utm_medium=cpc&utm_campaign=butter_chicken_launch&utm_content=search_ad_01&utm_term=butter_chicken_base` |
| YouTube paid | `https://liquidspice.in/?utm_source=youtube&utm_medium=paid_video&utm_campaign=butter_chicken_launch&utm_content=video_ad_01` |
| YouTube organic | `https://liquidspice.in/?utm_source=youtube&utm_medium=organic_video&utm_campaign=butter_chicken_launch&utm_content=video_01` |
| WhatsApp broadcast | `https://liquidspice.in/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=butter_chicken_launch&utm_content=broadcast_01` |
| WhatsApp individual outreach | `https://liquidspice.in/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=butter_chicken_launch&utm_content=personal_outreach_01` |
| Email | `https://liquidspice.in/?utm_source=newsletter&utm_medium=email&utm_campaign=butter_chicken_launch&utm_content=email_01` |
| Influencer/partner | `https://liquidspice.in/?utm_source=partner_name&utm_medium=influencer&utm_campaign=butter_chicken_launch&utm_content=creator_reel_01` |
| Packaging QR | `https://liquidspice.in/?utm_source=packaging&utm_medium=qr&utm_campaign=butter_chicken_launch&utm_content=jar_label_01` |

A shared bio link reports `utm_content=bio`; it cannot determine which unlinked post or reel caused the visit.

For Meta Ads Manager, the URL builder can append `utm_id={{campaign.id}}` and add `{{ad.id}}` plus `{{placement}}` to `utm_content`. Confirm the preview produced by Ads Manager before publishing because macro availability is controlled by the ad platform.

For Google Ads, a supported tracking template is:

`{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign=butter_chicken_launch&utm_id={campaignid}&utm_content=search_{creative}&utm_term={keyword}`

Google requires `{lpurl}` in a tracking template and replaces supported ValueTrack parameters at click time. Test the template in Google Ads before saving it.

## Deployment and account checks

Deploy the frontend and backend together so the new browser payload and API schema remain aligned. On startup, MongoDB creates the `analytics_events` and `meta_events` collections and their indexes. Then:

1. Confirm `PUBLIC_SITE_URL`, `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, and trusted proxy ranges are correct.
2. Use a non-production deployment and temporary Meta test-event code for an end-to-end browser/CAPI check.
3. Confirm browser/server event IDs pair in Meta Events Manager and Purchase is counted once.
4. Confirm GA4 DebugView receives the standard ecommerce events and that `transaction_id` prevents duplicate Purchase reporting.
5. Check the admin Acquisition & Funnel tab after measured staging traffic is available.

No production order, charge, customer message, or synthetic production analytics event is required for these checks.

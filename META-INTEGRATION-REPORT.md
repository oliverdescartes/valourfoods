# VALOUR Meta Pixel + CAPI audit and implementation

5 September 2026 · Dataset **2927690960901306**

**Implemented and locally tested; live Meta acceptance remains unverified.** The initial implementation audit below records the original state. The current checkout configuration treats a final order-button click as the advertising conversion point, including when stock or a later order/payment step fails. The subsequent [Test Events audit](META-TEST-EVENTS-AUDIT.md) documents earlier delivery checks. Automated tests are not proof of receipt in Events Manager.

## 1. Existing implementation audit

The pre-edit audit covered root HTML/JavaScript, checkout, pricing, order/payment routes, webhooks, MongoDB indexes, OTP, coupons, delivery validation, attribution, static serving and environment loading.

- Frontend: static HTML/CSS and vanilla JavaScript; existing Google tags/dataLayer, Pixel, local/session storage. No React/Next/Vite or build pipeline.
- Backend: persistent CommonJS Node/Express 5, MongoDB `valour_mvp`, Razorpay, Fast2SMS and existing WhatsApp services/background jobs. Express serves an explicit public-file allowlist, not the repository root.
- Hosting: same-origin server/static architecture; no deployment manifest identifies the hosting provider.
- Correct Pixel ID on nine pages. SDK loaders and noscript PageView fallback existed. Standard and all 15 requested custom events existed. No CAPI, Dataset Quality API, Meta event IDs, matching hashes or delivery state existed. Graph v25 calls were WhatsApp-related.
- ViewContent followed 50% product visibility; AddToCart followed cart storage mutation. Both fetched authoritative prices. InitiateCheckout followed the first nonempty successful checkout quote, once per document.
- COD required a verified phone, authoritative quote, valid delivery details and idempotency key. Unique checkout/Razorpay indexes already protected orders. A saved COD order is confirmed with paymentStatus=pending_cod.
- Online verification checked HMAC, fetched Razorpay payment/order, compared INR/amounts to the saved pricing snapshot, and accepted **authorized or captured**. Duplicate insertion is rejected by unique indexes; duplicate verification returns 409.
- Capture webhooks update attempts but do not create a missing completed order when the browser never verifies payment. This pre-existing order-system limitation remains.
- Purchase fired after successful order responses. Online values/items could come from browser cart state. No explicit Purchase ID/guard existed. The confirmation page itself did **not** fire Purchase on refresh.
- Coupon events followed quote/application outcomes. Quantity/removal followed actual mutations. OTP send followed a successful send response, excluding the existing-user shortcut; user_verified followed verification. Delivery-unavailable followed actual validation. Existing payment_failed semantics include cancellation and other checkout errors.
- UTM/landing-page attribution and a checkout customer-event ID existed. That ID belongs to customer-events/WhatsApp flow, not Meta deduplication, and is preserved.
- No application forwarding of _fbp/_fbc or construction from fbclid existed; the Pixel SDK could create its cookies.
- Name/email/phone/city/state/pincode become available in checkout and saved orders. Early anonymous events lack these fields. No new information is collected.
- No application consent gate was found. Existing unconditional Pixel behavior/privacy copy are preserved; this is not a consent-platform rollout.
- The server loads **backend/.env**, not root .env. Presence-only inspection confirmed META_CAPI_TOKEN and PUBLIC_SITE_URL, but no canonical token variable, Pixel override, test code, quality token or NODE_ENV. No secret was printed or changed. Git already ignores .env.

Every event below had **Browser: yes; Server: no; event_id: no; same browser/server ID: not applicable** before edits.

| Event | Parameters / duplicate risk before | Action taken |
|---|---|---|
| PageView | Correct document trigger, no ID | Shared initialization/UUID; CAPI |
| ViewContent | Visibility guard, real pricing; item_price missing | Preserve trigger; item_price, shared UUID, CAPI |
| AddToCart | Actual cart mutation, real pricing; item_price missing | Preserve trigger; item_price, shared UUID, CAPI |
| InitiateCheckout | Once/document, valid quote/commerce fields | Final order-button click; shared attempt ID, Pixel/CAPI |
| Purchase | Response-confirmed; authorization accepted; potentially stale cart; no guard | Final order-button click before stock/order outcome; shared attempt ID, Pixel/CAPI |
| valour_coupon_applied | Accepted coupon, no ID | Preserve; shared UUID/CAPI |
| valour_payment_failed | Includes existing cancellation/error meaning | Preserve; shared UUID/CAPI; omit raw error text from Meta |
| valour_coupon_invalid | Failed validation, no ID | Preserve; shared UUID/CAPI |
| valour_otp_send | Successful send; raw phone in Pixel payload | Shared UUID/CAPI; move phone to hashed matching |
| valour_cart_quantity_update | Actual mutation, item_id/quantity | Shared UUID/CAPI; content_ids |
| valour_user_verified | Verified response; raw phone in Pixel payload | Shared UUID/CAPI; move phone to hashed matching |
| valour_checkout_step_cart | Cart step entry | Preserve; shared UUID/CAPI |
| valour_purchase | Custom successful-order metric | Final order-button click; shared stable attempt ID, Pixel/CAPI |
| valour_delivery_area_unavailable | Actual validation, city | Preserve; shared UUID/CAPI |
| valour_checkout_view | Checkout initialization | Preserve; shared UUID/CAPI |
| valour_begin_checkout | Validated Place Order attempt | Final order-button click; shared attempt ID/CAPI |
| valour_payment_select | Selection change | Selected method submitted by final order-button click; shared attempt ID/CAPI |
| valour_remove_from_cart | Actual removal, item_id | Shared UUID/CAPI; content_ids |
| valour_checkout_progress_click | Progress click | Preserve; shared UUID/CAPI |
| valour_checkout_step_review | Review entry, current total | Final order-button click from review; shared attempt ID/CAPI |

## 2. Files changed

| File | Change |
|---|---|
| backend/meta.js | Central transport, validation, hashing, endpoints and order worker |
| meta-pixel.js | Public config, shared IDs, Pixel helper, parameter filtering/guards |
| backend/server.js | Register module/public file; persist delivery state and capture evidence; return capture eligibility |
| checkout-script.js | Helper calls, matching provider, authoritative Purchase data/capture gate |
| index.html | Shared initialization, ViewContent/AddToCart routing and item prices |
| cart.html | Shared initialization |
| checkout.html | Shared initialization |
| order-success.html | Shared initialization; no Purchase added |
| pay-order.html | Shared initialization |
| payment-failed.html | Shared initialization; no Purchase added |
| privacy-policy.html | Shared initialization only; policy text unchanged |
| review.html | Shared initialization |
| track-order.html | Shared initialization |
| backend/package.json | Direct proxy-addr 2.0.7 declaration for trusted-proxy IP extraction |
| backend/package-lock.json | Corresponding declaration; no resolved versions changed |
| backend/.env.example | Non-secret environment instructions |
| backend/meta.test.js | Transport, HTTP, worker and browser tests |
| META-INTEGRATION-REPORT.md | This report |

No layout, pricing, coupon, delivery, order-creation, payment-decision, OTP or WhatsApp rules were redesigned. Other Google/dataLayer, Contact, homepage section and additional custom events remain.

## 3. Architecture

Original SDK loaders remain. The shared helper retrieves only pixelId from GET /api/meta/config, initializes once, emits PageView, and flushes earlier queued events. It leaves the original fbq object intact so the SDK can install callMethod normally.

Browser observations get one event ID, passed to Pixel and POST /api/meta/events. The endpoint permits the allowlisted standard and custom events, including complete click-based `Purchase` and `valour_purchase` payloads. It requires the configured site origin, rejects cross-site requests, validates timestamps/IDs/size/commerce fields and limits each IP to 120 requests/minute/process. It constructs its own payload, never accepting tokens, Graph URLs or arbitrary user_data. Origin checks and rate limits are abuse mitigation, not human authentication.

The final order-button click sends both Purchase names before stock validation. If an order is later saved, its durable standard-Purchase worker reuses the click event ID so Meta can deduplicate the second server observation.

## 4. Standard-event mapping

All CAPI events carry event_name, event_id, Unix-seconds event_time, action_source=website, sanitized event_source_url and user_data. Commerce fields are under custom_data.

| Event | Browser trigger | Server trigger/source of truth | ID/deduplication | Parameters |
|---|---|---|---|---|
| PageView | Document initialization | First-party page observation | Shared UUID | Base fields |
| ViewContent | Product 50% visible, successful authoritative price lookup | Browser product-view observation | Shared UUID, once/document | INR/value, content_type, content_ids, contents/quantity/item_price |
| AddToCart | Cart written, successful price lookup | Browser cart-mutation observation | Shared UUID | INR/added value, content_type, content_ids, contents/quantity/item_price |
| InitiateCheckout | Final order button clicked from review | Browser click observation | Shared attempt ID | INR/current total, payment method, content_type, content_ids, contents, summed num_items |
| Purchase | Final order button clicked from review | Browser click observation; a saved order may later repeat the same CAPI event ID | purchase_checkout_<attempt ID> | INR/current total, content_type, attempt order_id, content_ids, contents, summed num_items |

Every deliberate final-button click creates a new attempt ID and may create a new Purchase observation, including retries after an out-of-stock or payment error result.

## 5. Custom events

The audit table lists all 15 exact names/triggers. The 14 non-purchase custom events are mirrored with one UUID per real invocation. Their source of truth is the browser observation of the existing result/action, not a second backend business transaction. Repeated deliberate stage changes may legitimately generate new observations.

`valour_purchase` is sent by Pixel and CAPI with `valour_purchase_checkout_<attempt ID>` at the same final-button click as standard Purchase. Meta contact/error filtering does not strip existing Google/dataLayer payloads.

## 6. Event IDs

The final order-button click creates one checkout attempt ID. Each of the seven funnel events derives a distinct stable event ID from that attempt; its Pixel `eventID` equals its CAPI `event_id`. A saved order carries the standard Purchase ID into the durable worker. The existing checkout customer-event ID is untouched.

Memory and localStorage markers suppress repeats of the same event ID. A later deliberate click creates a new attempt and new events. The success page has no Purchase trigger. Meta merges corresponding name/ID pairs; exactly-once networking is not claimed.

## 7. Purchase correctness and reliability

- Advertising Purchase measures the final order-button click, even if COD creation, stock validation, payment, or order persistence later fails.
- Order creation and payment correctness rules remain unchanged; this event change does not bypass stock or payment validation.
- The saved-order worker reuses the click event ID when it later sends an eligible server Purchase, preventing that later observation from becoming a second Meta conversion when deduplication succeeds.
- Pending analytics state is part of the initial order insert, surviving a crash afterward. Historical orders without that marker are not backfilled.
- A ten-second worker and immediate best-effort response drain process up to 20 records/cycle. MongoDB atomically leases records for 60 seconds. Its delivery-state index is created in the background, not required by checkout.
- Network errors, 429, 5xx and Meta transient errors retry exponentially, capped at one hour, up to 12 sends. Permanent errors stop. Crashes after remote acceptance may retry the same logical ID.
- Waiting for capture does not consume send attempts. Pending Purchase records expire after 47 hours, deliberately tighter than Meta's seven-day event-age limit to remain inside the browser/server deduplication window. Advertising request context is removed on send/permanent failure/expiry; existing fulfilment customer fields are reused.
- Worker/Meta/index/database failures cannot roll back orders. Failed or abandoned attempts cannot call the public endpoint to create Purchase.

## 8. Customer matching availability

A = genuine available checkout form value, validated/hashed server-side. O = saved-order value, validated/hashed. R = request-derived, unhashed. C = existing valid cookie, unhashed. — = not explicitly supplied through CAPI. The site's Tripura selection is normalized to tr; existing two-letter codes are accepted and Other/unknown full names are omitted. Unavailable surnames are omitted.

| Event | Email | Phone | First | Last | City | State | Zip | IP | UA | fbp | fbc |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PageView | A* | A* | A* | A* | A* | A* | A* | R | R | C | C |
| ViewContent | — | — | — | — | — | — | — | R | R | C | C |
| AddToCart | — | — | — | — | — | — | — | R | R | C | C |
| InitiateCheckout | A | A | A | A | A | A | A | R | R | C | C |
| Purchase | O | O | O | O | O | O | O | R | R | C | C |
| valour_coupon_applied | A | A | A | A | A | A | A | R | R | C | C |
| valour_payment_failed | A | A | A | A | A | A | A | R | R | C | C |
| valour_coupon_invalid | A | A | A | A | A | A | A | R | R | C | C |
| valour_otp_send | A | A | A | A | A | A | A | R | R | C | C |
| valour_cart_quantity_update | A | A | A | A | A | A | A | R | R | C | C |
| valour_user_verified | A | A | A | A | A | A | A | R | R | C | C |
| valour_checkout_step_cart | A | A | A | A | A | A | A | R | R | C | C |
| valour_purchase | — | — | — | — | — | — | — | — | — | — | — |
| valour_delivery_area_unavailable | A | A | A | A | A | A | A | R | R | C | C |
| valour_checkout_view | A | A | A | A | A | A | A | R | R | C | C |
| valour_begin_checkout | A | A | A | A | A | A | A | R | R | C | C |
| valour_payment_select | A | A | A | A | A | A | A | R | R | C | C |
| valour_remove_from_cart | A | A | A | A | A | A | A | R | R | C | C |
| valour_checkout_progress_click | A | A | A | A | A | A | A | R | R | C | C |
| valour_checkout_step_review | A | A | A | A | A | A | A | R | R | C | C |

*PageView can use form values only if checkout's provider is initialized and values exist at emission. Other pages do not read stored customer profiles. Browser-only custom Purchase still has native Pixel browser context.

## 9. Hashing and privacy

Email: trim/lowercase/syntax-check. Phone: digits with country code; Indian ten-digit mobiles receive 91. Names/city: lowercase without punctuation/spacing. Tripura becomes tr; valid two-letter states and six-digit Indian postcodes are normalized. Server hashes these once using SHA-256 into em/ph/fn/ln/ct/st/zp arrays. A single name token does not get a fabricated surname; unrecognized full state names/Other are omitted.

IP/UA/fbp/fbc are not hashed. Request headers/cookies are read server-side; browser-submitted IP/UA/user_data are ignored. Forwarded IP requires explicitly trusted proxy ranges. Without correct configuration, a reverse proxy's peer address can be reported; verify before launch.

No DOB, gender, street address, arbitrary form fields or raw contact/error Pixel parameters are added. First-party matching requests only include permitted contact fields and are not persisted for non-Purchase. Purchase request context is temporarily retained for retry, then removed. Logs contain IDs/status/codes, not secrets/customer payloads.

CAPI source URLs use the configured origin/public path, stripping query/fragment and token-bearing paths. Native Pixel automatic URL behavior is not reimplemented. Existing valid _fbp/_fbc are forwarded, never fabricated. fbc construction is left to the existing SDK; no independent synthesis from fbclid. Initial PageView may precede cookie creation, and blocked-cookie browsers may lack these signals.

## 10. Ecommerce data

Currency is INR. Purchase value is pricingSnapshot.totalPaise/100 with existing discount/shipping rules. Item price is unitPricePaise/100. Contents uses real SKU/quantity; content_ids corresponds to contents; num_items sums quantities; order_id is the persisted internal ID. Discount/shipping can make line-price sum differ from final value. Browser values never determine server Purchase facts.

## 11. Environment variables

| Variable | Setting |
|---|---|
| META_PIXEL_ID | Default 2927690960901306; browser retrieves server value |
| META_CAPI_ACCESS_TOKEN | Preferred server-only secret |
| META_CAPI_TOKEN | Existing server-only fallback; canonical name takes precedence |
| META_GRAPH_API_VERSION | New CAPI defaults to v26.0; WhatsApp v25 unchanged |
| PUBLIC_SITE_URL | Exact canonical shopper origin |
| NODE_ENV | production for live service; development/test for isolated tests |
| META_CAPI_TEST_EVENT_CODE | Optional; development/test or explicitly enabled temporary staging override |
| META_DEPLOYMENT_ENV | production on live service; staging/test/development for an isolated deployment |
| META_CAPI_TEST_MODE | Explicit staging override flag, false by default |
| META_CAPI_TEST_MODE_UNTIL | Required UTC expiry for override, within 24 hours of process start |
| META_TRUST_PROXY | Optional exact trusted proxy IPs/CIDRs, comma separated |
| META_DATASET_QUALITY_TOKEN | Not used; no quality integration added |

The JavaScript-disabled noscript image still uses the requested fixed Pixel ID; update these fallback IDs if moving to another dataset. Tokens never appear in public config/source/API responses/Graph query strings.

## 12. Deployment

The existing service runs `npm --prefix backend start` and serves its frontend. Install with `npm --prefix backend ci`. Keep all existing database/payment/OTP/WhatsApp configuration.

Managed hosting: set these variables in **the existing Node backend service's Environment/Secrets settings**, then redeploy/restart that service. Self-managed hosting: use its service environment or deployed **backend/.env**, readable only by the service account, and restart the existing process manager. Do not replace the whole environment with the example. No provider-specific dashboard can be identified from this checkout.

The existing META_CAPI_TOKEN is supported now. To adopt the canonical name, copy its value privately within the host's secret settings to META_CAPI_ACCESS_TOKEN; no source edit or token disclosure is needed. Configure PUBLIC_SITE_URL to the actual origin. The follow-up fix accepts both verified HTTPS VALOUR aliases; unrelated origins remain excluded. Trust only actual proxy subnets, never blanket forwarded headers.

Deploy backend and all changed frontend files together. The public allowlist includes meta-pixel.js and excludes backend secrets/source. Keep a persistent Node process for retries. A local test instance must not use production MongoDB or live messaging integrations.

## 13. Dataset Quality API and sources

**Not implemented; did not exist.** Official documentation returned HTTP 429 and no quality-token/permission context was available. An unverified endpoint/permission model was not introduced. No polling or checkout dependency was added. Use Events Manager quality panels; any future manual API integration must first verify endpoint/version, permissions and schema.

New CAPI uses the current version identified in Meta's [official SDK API source](https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/api.js): v26.0. Parameters were cross-checked against [UserData](https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/objects/serverside/user-data.js), [normalization utilities](https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/objects/serverside/utils.js), and [ServerEvent](https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/objects/serverside/server-event.js).

Deployment references: [customer parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters/), [deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events/), [Dataset Quality](https://developers.facebook.com/docs/marketing-api/conversions-api/dataset-quality-api/). These documentation pages were rate-limited during audit. Selected customer parameters in generated guides are conditional on real availability; they do not justify invented data.

## 14. Test results

| Check | Result |
|---|---|
| node --test backend/meta.test.js | PASS: 11 tests including follow-up normal-funnel HTTP, expiry and rejection diagnostics |
| JavaScript parsing | PASS: 36 changed source/root HTML inline scripts |
| git diff --check | PASS; repository LF/CRLF policy warnings only |
| Secret-value scan | PASS: configured Meta secret values absent from every changed/new file |
| Build | No build script/compiler exists; static serving. Cannot claim build success |
| Lint/typecheck | No configured scripts/TypeScript pipeline; syntax checked |
| Existing npm --prefix backend test | FAIL: missing backend/test-pricing.js before execution; other referenced tests absent too |
| Dependency verification | Existing proxy-addr declared directly; no resolved versions changed. npm reports 4 existing advisories: 1 low, 1 moderate, 2 high; no unrelated upgrades applied |
| Real MongoDB concurrency | Not run; worker database behavior tested with a double |
| Browser behavior | Actual helper exercised in VM through local Express HTTP/mocked Graph, plus privacy/refresh tests; no real-browser full funnel |
| Meta Test Events / real order | NOT RUN: no test code, browser session or isolated business sandbox |

Tests cover hashing, unhashed cookies/IP/UA, URLs, totals/quantities, production test-code exclusion, transient/permanent/network failures, time validation, fake Purchase rejection, arbitrary payload/foreign-origin rejection, failed orders, authorization waiting/capture release, retry IDs and sent-state suppression. They do not load backend/.env and use dummy secrets/mocked Meta transport.

## 15. Events Manager validation procedure

1. Deploy isolated staging with test database, Razorpay test credentials and sandboxed/disabled outbound business messaging. Keep live NODE_ENV=production and test code empty.
2. Open **Events Manager → Data Sources → dataset 2927690960901306 → Test Events**. Confirm the ID. Privately set its server test code as staging META_CAPI_TEST_EVENT_CODE with NODE_ENV=test and restart. If staging uses NODE_ENV=production, use the explicit expiring override in the [follow-up audit](META-TEST-EVENTS-AUDIT.md). Set PUBLIC_SITE_URL to staging's origin. The live deployment remains excluded from the override.
3. Use the browser-testing action to open staging with tracking permitted. GET /api/meta/config must return only pixelId. Inspect /api/meta/events in Network; no token may appear.
4. Load homepage: PageView. Scroll product at least 50% into view: ViewContent. Add product: AddToCart. Open nonempty checkout and wait for valid quote: InitiateCheckout. Compare each Pixel eventID with server event_id. Inspect website action source, real timestamp, sanitized URL, INR/commerce fields and genuine available matching fields.
5. Complete one sandbox COD order or captured Razorpay test payment. Verify persisted order/snapshot and one standard logical Purchase. Both channels must use purchase_<same internal ID>, final payable rupees and summed quantities. Another order needs another ID.
6. Reload confirmation and navigate back/forward: no new Purchase. Inspect deduplication, not just raw Test Events receipt rows; browser/server receipts can display separately. Worker state should become sent/HTTP 200.
7. Test failed and abandoned payments: no standard Purchase. Authorization-only order must wait for signed capture plus persisted completed order. No capture means no Purchase.
8. Simulate temporary Meta failure only in staging/mocked transport. Order still succeeds, delivery stays pending, then retries with the same ID/time. Do not break production credentials for this test.
9. Exercise all custom events through actual sandbox actions: valid/invalid coupon, OTP send/verify, quantity/removal, cart/review/progress clicks, payment selection/submission/failure, unavailable delivery area. Confirm the final order-button click sends both `Purchase` and `valour_purchase` through Pixel and CAPI, including an out-of-stock attempt. Preserve intentional repeated actions.
10. Remove test code afterward. Normal production requests must omit it.

After sufficient legitimate traffic, inspect **Overview → relevant event → details/quality panels**, plus **Diagnostics** (labels can vary):

- **Event Match Quality:** genuine hashed available contact data/browser signals; guest omissions are normal. Do not invent fields for a score.
- **Deduplication:** matching names/IDs, no missing-ID warnings, one logical Purchase per eligible order.
- **Data Freshness:** normally seconds including short worker delay; investigate rising retry age.
- **CAPI Event Coverage:** server coverage of mirrored events; late capture can be server-only and blocked browsers can reduce browser counts. Separate custom Purchase from standard Purchase.
- **Diagnostics:** no invalid parameter/hash/currency/time errors; fix persistent authentication/schema failures before relying on optimization.

Operational diagnostics: `[META]` logs and orders.metaPurchase status/attempts/eventTime/nextAt/httpStatus/errorCode/updatedAt. Inspect only these fields/order IDs using an authenticated database tool, not whole customer records. Permanent failures need deliberate review before resetting delivery state; never indiscriminately replay sent/old orders.

## 16. Remaining risks/assumptions

Live receipt/deduplication, account permissions, hosting/proxy topology, real MongoDB concurrency and full funnel behavior remain unverified. Legacy test files are missing. No production deployment occurred.

The pre-existing captured-payment/browser-verification gap can leave no completed order to advertise. COD cancellations/refunds are not reversed automatically. Custom payment_failed retains cancellation semantics. Unrecognized states are omitted; initial cookie availability can reduce matching. Existing noscript ID is fixed. No new consent gate was added.

Browser tracking depends on the helper/config endpoint and SDK. Correct canonical-origin/proxy configuration is required. A long disabled-token period causes pending events to expire at 47 hours instead of risking delayed duplicate purchases. Configure/validate before live traffic; expired records need investigation, not blind replay.

Local changes are ready for review. **Final production acceptance requires the live validation above.**

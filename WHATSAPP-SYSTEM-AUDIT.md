# VALOUR WhatsApp audit and deployment guide

Audit date: 12 September 2026. Workspace: `valourfoods-clean` only.

The local implementation is repaired and covered by isolated tests. This is **not a production delivery certification**. No real WhatsApp messages were sent, production webhooks replayed, orders changed, or production jobs reset. Existing staged changes in `backend/server.js` were retained.

## Findings and repairs

| Finding | Repair |
|---|---|
| Nested native replies could become `[object Object]`; only menu labels had recursive handling. | Added one bounded parser for text, buttons, lists, postbacks, titles, descriptions and nested payloads. Exact normalized actions tolerate case, spaces, punctuation and emojis. |
| State handlers consumed old buttons or sent irrelevant replies; VIDEO and demo labels followed different paths. | Explicit actions interrupt active flows. All cooking-video labels reach the single-product tutorial and optional Done prompt. Exact typed navigation remains available. Ordinary support issue text stays in the support case. |
| Webhooks handled only the first entry/change/message/status, acknowledged before persistence and logged entire bodies. | Both routes handle batches, persist inbound events before acknowledgment, separate statuses from messages, and log masked action/state metadata. Persistence failure returns 503. |
| Anyone could POST a forged webhook claiming an authorized admin's phone. | Both WhatsApp POST routes require a private shared token. Missing/wrong token returns 401 before persistence or routing. Deployment requires callback configuration described below. |
| Only an in-process queue protected session updates. | Added canonical phone queues plus MongoDB phone leases and heartbeats. Pending inbox messages survive restart. Interrupted handlers become `needs_review`, preventing unsafe replay of partially completed work. Existing message-ID deduplication remains. |
| Tracking returned an order before checking its owner; recovery accepted someone else's phone and pincode. | Reference lookup checks the sender's phone/WhatsApp phone. Recovery requires the current sender's registered phone; otherwise it offers a support handoff. |
| Configured customer-care numbers could expand authorization and alert recipients. | Both admin numbers are fixed in code. Forged admin button payloads are denied. Removed the arbitrary default recipient from customer order notifications. |
| Fulfilment changes were allowed when the dashboard admin token was absent. | Shipping-status writes now fail closed. |
| Numeric Meta template IDs could be sent as internal Gupshup IDs. | The known external ID maps to `680c3021-6889-4c60-86b4-6ebb0c7d7b1b`; other numeric IDs are rejected. Added the six-variable admin contract. Preserved the pre-existing delivered-only status branch. |
| Free-form/media senders treated HTTP-200 application errors as success. | Every sender validates provider acceptance and message ID. Definite media rejection invokes existing customer fallbacks; ambiguous responses/timeouts are not treated as safe retries. |
| Tutorial fallback jobs could outlive the journey or block a later journey forever. | Cooking occurrences have run IDs; new cooking cancels older feedback and exploratory reminders. Leaving cooking cancels feedback; repeated Done is idempotent; feedback without Done creates an outcome. |
| Expired claims could resend a request already received by the provider. | Persist submission intent, fence job claims with tokens, and quarantine uncertain sends as `delivery_unknown`. Only expired claims that never began submission are automatically recovered. Cancellation before submission prevents sending. |
| Failed jobs/admin claims could block later valid attempts, or changing a template could duplicate an already accepted admin alert. | Fresh triggers may rearm definitely failed jobs. Admin claims are per recipient, retry definitely failed recipients only, and retain uncertain claims. Accepted IDs are retained for callback reconciliation. |
| Early callbacks were lost; direct-send statuses could regress. | Persist callback events for 30 days, reconcile after outbound/job persistence, and enforce forward status progression for queued messages, direct messages and per-admin alert records. |
| Marketing deferral could repeatedly reschedule into the past. | Recent-reply deferral applies only while the 24-hour interval is still in the future. Cancellation checks precede sending-hour deferral. |
| Dashboard counted enqueued messages as Sent. | Enqueued stays with Submitted; Sent requires a sent callback. Uncertain jobs visibly require reconciliation. Repeated identical status saves use a stable job occurrence. |
| Live tutorial/product fallbacks returned 404; the lid URL was QuickTime. | Bundled supported tutorial MP4, converted lid MP4, and copied product PNG under `/whatsapp/`. Updated local non-secret media settings. These files still need deployment. |

## System map

`POST /webhook` and `POST /webhook/gupshup` → token check → `whatsapp-inbound.js` → durable `whatsapp_inbox` → phone queue/lease → message-ID deduplication → `processIncomingMessage` → state/action handler → Gupshup sender → `messages` and/or `message_jobs`.

Delivery callbacks take a separate route into `whatsapp_status_events`, `message_jobs`, outbound `messages`, `orders.adminOrderAlerts`, and `support_cases.adminAlerts`. They never enter customer conversation routing. A provider submission is not delivery; Gupshup documents asynchronous delivery and out-of-order callbacks. [Template submission](https://docs.gupshup.io/docs/template-messages), [delivery events](https://docs.gupshup.io/docs/message-events).

Related paths: `backend/whatsapp-order.js` handles legacy chat checkout parsing; `pricing.js` supplies website quotes; Razorpay callbacks/browser verification trigger paid confirmations; COD checkout and admin fulfilment trigger their own templates; `/api/customer-events` creates website follow-ups; `fast2sms.js` and checkout OTP recovery can create support alerts. `admin-dashboard.html` displays jobs, conversations and fulfilment controls. Existing AI brand-question handling remains an external dependency.

### Funnel matrix

“Any” means explicit navigation works even on a stale session. All times below are production timings, not compressed test values. Marketing jobs also obey existing caps and 09:00–20:00 IST sending hours. Delivered invitations obey those hours too.

| Customer/admin action | Current state | Expected response / media or template | State change | Jobs | Cancellation / deduplication |
|---|---|---|---|---|---|
| Hi, Hello, Main menu, Back | Any | Five-option main list | `idle` | New lead on first conversation | Message ID; exiting cooking cancels feedback |
| Explore product | Any | Product PNG + description + Start cooking / Order online / Back | `product_details` | Demo +18h; high intent +24h | Cooking/payment cancels obsolete follow-ups |
| Order online / Buy now | Any | `https://liquidspice.in/#velvety-butter-chicken` | `idle` | None directly | Clears active cooking feedback |
| Start cooking / Cooking Video / Watch Video / Watch cooking demo / VIDEO | Any | Tutorial MP4, then optional Done quick reply | `guided_cooking` | Feedback fallback +30m | Old fallback and exploration reminders cancelled |
| Tutorial accepted, no Done | `guided_cooking` | `valour_post_cook_feedback` | `post_cook_feedback` | Existing +30m fallback | Journey exit / feedback / Done |
| Done | Any/old cooking button | Completion acknowledgment | `post_cook_feedback` | Feedback +30m; reorder +7d when an order exists | Fallback cancelled; repeated Done does not create another outcome |
| Loved it | Any/old feedback button | Positive response + signed review link for owned order | `idle` | None | Feedback/review jobs cancelled |
| Could be better | Any/old feedback button | Improvement response + signed review link | `idle` | None | Feedback/review jobs cancelled |
| How to open the lid? | Any | Video from `WHATSAPP_LID_OPENING_VIDEO_URL` | Preserved | None | No blind resend after uncertain submission |
| Need Help | Any | Ask for issue; Main menu button | `support_awaiting_details` | None | Explicit navigation exits; ordinary issue text does not restart support |
| Describe issue | `support_awaiting_details` | Case reference + acknowledgment | `idle` | Two direct support templates, tracked per admin | Stable case/admin claims; failed recipient can be retried independently |
| Customer Care menu/category | Any explicit list selection | Category list or relevant order/issue prompt | `support_select_category` → order/details | None | Exact category IDs; no issue-text prefix matching |
| Track order | Any | Ask order number + Help/Main menu | `support_awaiting_order_id` | None | Ownership checked on lookup |
| Owned order number | Tracking | Shipping/payment/items/ETA | `idle` | None | Foreign order details never returned |
| Unknown number → Help | Tracking | Ask registered phone + pincode | `tracking_awaiting_lookup_details` | None | Current sender must own lookup phone |
| Recovery success | Recovery | Matching order status / choices | `idle` or tracking | None | Own orders only |
| Recovery Help | Recovery | Collect customer-care issue | `support_awaiting_details` | Case after details | Navigation overrides recovery |
| Tomorrow / This weekend / Remind me later | Any explicit button | Reminder acknowledgment | Preserved | Tomorrow/Saturday 10:00 IST, or +3h adjusted to hours | Cooking starts |
| Website product view/explore | Website | No immediate WhatsApp session reply | Unchanged | Demo +18h | Payment/cooking; quality gates |
| Website recipe-video click | Website | No immediate session reply | Unchanged | High intent +24h | Payment/cooking; quality gates |
| Price/delivery question | Brand Q&A | Brand answer via existing AI | Preserved | Price/delivery +30m | Payment/cooking; quality gates |
| Checkout details submitted / payment attempt | Website | Existing checkout flow | Payment attempt | Checkout reminder +1h | Payment, superseding attempt, cancelled/refunded order |
| Prepaid confirmation | Captured/finalized order | `valour_order_confirmation`, image, 4 variables | Order/payment records | Immediate stable order job; two admin alerts | Queue key deduplicates browser/provider triggers |
| COD checkout / confirmation | COD order | `valour_cod_confirmation`, image, 5 variables | COD/order records | Immediate confirmation; two admin alerts | Stable COD job key |
| Customer pays COD order through Pay Online link | Existing COD order with conversion payment link | Dedicated template `515b2202-ab03-4fb3-a2de-32f896d04953`: successful payment, amount and tracking button | Payment becomes Paid; method becomes Prepaid | Immediate stable conversion-confirmation job | Signed Razorpay callback and order job key prevent duplicates; generic prepaid confirmation is not sent |
| Admin fulfilment update | Existing order | `valour_order_status`, image, 6 variables | Shipping fields | Immediate status job | Same payload occurrence deduplicated |
| Admin selects Delivered | Existing order | Dedicated `valour_delivered`, image, 1 variable | Delivered timestamp | +15m adjusted to sending hours; reorder +7d | No generic status template; not-delivered/cancelled order gate |
| Admin review request | Existing owned order record | `valour_review_request`, no variables/media | Unchanged | Direct send, callback tracked | No automatic standalone review schedule was present |
| Rate VALOUR / Not now | Any explicit review button | Signed review link / polite acknowledgment | Preserved | Not now cancels queued review jobs | No order → clear support fallback |
| Reorder reminder | Existing order | `valour_reorder_reminder`, image, 1 variable | Unchanged | +7d; sending hours/caps | New order, cooking, unresolved high-priority support |
| Admin new-order notification | Fixed two admins | Six-variable admin template | Per-admin claim/status | Direct send | Accepted/uncertain recipients never automatically repeated |
| Orders → select → Recent orders | Authorized admin | Ten recent orders, full selected details, return button | Customer state preserved | None | Phone authorization on each action and list helper |
| DONE/PENDING/REOPEN/STATUS + case ID | Authorized admin | Confirmation or case details | Case status/history | None | Unauthorized sender cannot operate case |
| Legacy product/quantity/scenario cooking state | Stale session | Single Butter Chicken tutorial | `guided_cooking` | Same tutorial fallback | No product selection or cooking steps restored |
| Legacy chat checkout item/order text | Legacy order states | Existing delivery/phone verification/payment-link flow | `order_delivery` → phone/OTP → confirmation/payment | Existing payment triggers | Global buttons can interrupt; full SMS/payment-provider journey not executed |
| Abandoned checkout OTP | Pending OTP challenge | Support case + admin support alert | Challenge/case states | Existing four-minute OTP alert worker | Verified OTP/matching user; provider SMS path not executed |

## Templates and media evidence

Read-only registry GET returned **401**, both before and after the changes. The local environment did not contain `GUPSHUP_APP_ID`; the audit used its app-name fallback. A valid app UUID/account API key is needed to establish approval, language, component configuration and actual parameter placement. No template approval is inferred from local names or IDs. [Registry API](https://docs.gupshup.io/reference/get-all-templates-for-an-app).

Known IDs enforced/preserved:

| Purpose | Internal Gupshup ID | Local contract |
|---|---|---|
| Admin new order | `680c3021-6889-4c60-86b4-6ebb0c7d7b1b` | 6: order number, customer name, phone, items, total/payment mode, address; text |
| Support alert | `e0d25b52-b236-4551-b5d9-06fd3fd76f40` | 5: case reference, customer name, phone, issue/admin commands, destination suffix; text |
| Delivered invitation | `ed4e4f64-b494-4c44-94ae-effb751cf40c` | 1: order number; image |
| COD converted to prepaid | `515b2202-ab03-4fb3-a2de-32f896d04953` | 3: order number, amount paid, signed tracking-button value; text |

Other checked local contracts: new lead/demo 1 image; high intent 0 image; price/delivery 3 image; checkout 2 image; prepaid 4 image; COD 5 image; status 6 image; cooking reminder 1 text; post-cook 0 text; review 0 text; reorder 1 image. Default configured language is `en_US`; registry confirmation remains outstanding. New lead and product demo currently map to the same UUID; their intended approved content must be checked once registry access works.

Prepaid parameter order: reference, total, items + ETA, tracking-token suffix. COD: reference, items + ETA, total, payment-token suffix, tracking-token suffix. Status: reference, shipping status, payment mode, payment status, ETA, tracking-token suffix. Parameters are cleaned without truncating signed token strings. URL-button variables must be included in approved occurrence order, not assumed to be body-only. [Gupshup template parameters](https://docs.gupshup.io/docs/template-messages).

Public GET/range checks confirmed all ten configured template-header entries returned PNG bytes, HTTP 206, roughly 1.5–2.34 MB. Original cooking/lid URLs returned QuickTime bytes (`video/quicktime`); the original fallback tutorial MP4 and product PNG URLs returned 404.

Prepared local assets:

| File | Verified local content | Public status at audit |
|---|---|---|
| `whatsapp/cooking-tutorial.mp4` | H.264, yuv420p, AAC; 42.496s; 7,254,320 bytes | New path 404 until deployment |
| `whatsapp/open-the-lid.mp4` | H.264, yuv420p, AAC; 7.637s; approximately 1.76 MB | New path 404 until deployment |
| `whatsapp/velvety-butter.png` | PNG; 1,059,300 bytes | New path 404 until deployment |

`npm run audit:whatsapp` performs GET-only registry/media checks and exits nonzero for inaccessible registry or unsupported/unavailable media. It does not initialize the server or touch MongoDB.

## Verification and remaining evidence

Final result: **63 passed, 0 failed**, comprising 32 WhatsApp tests and 31 existing tests.

Run from `backend`: `npm test` (all existing tests plus the WhatsApp suite), or `npm run test:whatsapp`.

The WhatsApp suite uses an in-memory MongoDB semantic double, mocked Gupshup HTTP submission, local HTTP requests to the actual Express app, and synthetic orders/users only. Its network adapter rejects unexpected external requests. It covers the matrix's core customer/admin branches, both webhook shapes, database changes, outbound payloads, schedules, callbacks, early/out-of-order statuses, template/media rejection, duplicates, old buttons, support issue preservation, ownership, authorization, payment capture, website abandonment, uncertain sends and restart recovery. Test-only database injection requires `NODE_ENV=test`.

**Still unverified:** actual template approval/language/buttons (registry 401); delivery/read receipts on real devices (no send authorized); publicly deployed new media (404); provider acceptance of the new authenticated callback URL; actual browser interaction with the deployed dashboard; live MongoDB multi-replica/failover behavior; the full Razorpay create/verify/COD checkout with real pricing/OTP/SMS providers; and external AI brand answers. The payment-capture webhook, paid scheduling, website event scheduling, COD/status payloads and dashboard Delivered endpoint are mocked-tested, but those are not a substitute for the complete real payment checkout. Existing OTP-abandonment and legacy SMS checkout paths were source-reviewed, not exercised against live providers.

## Exact configuration changes

The ignored local `backend/.env` was updated only for these settings; its existing credentials were not changed or displayed:

```dotenv
WHATSAPP_VELVETY_BUTTER_VIDEO_URL=https://liquidspice.in/whatsapp/cooking-tutorial.mp4
WHATSAPP_LID_OPENING_VIDEO_URL=https://liquidspice.in/whatsapp/open-the-lid.mp4
WHATSAPP_PRODUCT_IMAGE_URL=https://liquidspice.in/whatsapp/velvety-butter.png
WHATSAPP_ADMIN_NEW_ORDER_TEMPLATE_ID=680c3021-6889-4c60-86b4-6ebb0c7d7b1b
WHATSAPP_COD_PREPAID_TEMPLATE_ID=515b2202-ab03-4fb3-a2de-32f896d04953
WHATSAPP_COD_PREPAID_TEMPLATE_LANGUAGE=en_US
WHATSAPP_WEBHOOK_TOKEN=<private random value generated locally; never paste into logs>
```

`WHATSAPP_WEBHOOK_TOKEN` is required at server startup and on both WhatsApp POST endpoints. Supply it as `x-whatsapp-webhook-token`, or as `?token=<secret>` in the registered callback URL. This is application-level shared-secret protection, not a claimed native Gupshup signature format. If using a proxy header, restrict direct backend access and configure the proxy to inject the private value only on trusted provider ingress.

Set `GUPSHUP_APP_ID` to the actual app UUID for the read-only audit and resolve its 401 with the correct account key. Keep existing template names, mapping JSON, media JSON, language values, marketing caps, poll interval, and other production credentials. `ORDER_ADMIN_TOKEN` must remain nonempty. `WHATSAPP_CUSTOMER_CARE_PHONES` no longer expands access; `DEFAULT_WHATSAPP_ORDER_PHONE` no longer receives customer confirmations.

## Deployment sequence

1. Publish the three `/whatsapp/` assets to the production static origin. Check GET responses and magic bytes with the audit script before activating their environment URLs.
2. Transfer the private local webhook token into the hosting secret configuration. Configure the Gupshup callback URL with the same token (or arrange trusted proxy injection). Apply it to any active Meta-shaped callback endpoint too. The old code accepts an extra query argument, allowing callback configuration to precede rollout. Redact callback query strings in ingress logs. Do not deploy the new backend without completing this step: unauthenticated callbacks will receive 401.
3. Deploy changed backend modules, dashboard and environment settings together. From `backend`, run `npm ci`, then `npm test`. Start using the existing production process manager's `npm start` command. No host-specific deployment manifest was found, so no hosting CLI command is invented here.
4. Startup creates additive indexes for `whatsapp_inbox.eventId`, inbox status/time, unique phone leases, callback event keys and 30-day callback retention. Existing job/message/order data stays in place. Ensure existing database permissions allow these indexes. Do not delete/reset jobs or claims.
5. Verify `/health` shows the database and Gupshup configuration ready. Keep production delay constants unchanged: Delivered +15m; reorder +7d; tutorial prompt approximately 12s; feedback +30m; demo +18h; high intent +24h; checkout +1h.
6. Enable Sent, Delivered and Read event subscriptions in Gupshup as well as its default Enqueued/Failed events. The registry/media audit must be rerun after deployment. [Event subscriptions](https://docs.gupshup.io/docs/subscriptions-and-notifications).
7. Review `delivery_unknown` jobs and `needs_review` inbound events through restricted operational access. Correlate provider IDs/callback events first. Pending inbound events and pre-submission expired jobs recover automatically; uncertain work does not. A new valid trigger can retry a definitely failed job/admin recipient. Do not mass-reset uncertain records to scheduled.

## Practical website / WhatsApp walkthrough

Perform this on isolated staging with test recipients/orders first. Real messages, production order changes and replay of production events require separate authorization.

1. Send Hi. Open Explore product; confirm the image and single-product description. Use Order online and verify the exact product-section anchor. Return with Back.
2. Start cooking. Confirm the video plays and the optional Done button follows. Repeat with Cooking Video, Watch Video, Watch cooking demo and VIDEO, including punctuation/emoji variants.
3. Complete one cooking journey with Done and leave another without Done. Inspect the +30m feedback jobs. For controlled tests, move only isolated-test jobs to due; never shorten production constants. Test both feedback buttons and review links.
4. Start support, then tap an old cooking/order/lid button. Confirm it changes flow. Start support again and send an issue containing “customer care” or “need help”; confirm exactly one case is created and both admin outcomes are recorded.
5. Track your test order by reference. Try a different customer's test reference and recovery phone; confirm no private details appear. Use Help, recover with the correct registered number/pincode, then use Need Help.
6. Abandon a staging checkout after entering details; inspect the +1h reminder. Finish a separate prepaid checkout and COD checkout; inspect confirmation payloads, cancellation of abandoned follow-ups, and two admin alerts.
7. In the staging dashboard, change fulfilment status and then mark Delivered. Confirm the dedicated invitation is +15m, within permitted hours, and no generic status job is added for Delivered. Verify reorder is +7d. Repeat the same save to check deduplication.
8. From each allowed admin number, send Orders, open an order and return to Recent orders. Exercise STATUS, PENDING, DONE and REOPEN with a test case. From a customer number, try the same internal payload; it must not reveal admin data.
9. Request a review, then use Rate VALOUR and Not now. Set Tomorrow/This weekend reminders and start cooking; verify cancellation of obsolete reminders.
10. Follow one approved test submission through Submitted → Sent → Delivered → Read. Inspect failure callbacks too. Enqueued alone must never appear as Sent/Delivered. Test network timeout and restart using mocks: uncertain sends must remain quarantined, not duplicate.

## Changed files

- `backend/server.js`: routing, authorization, ownership, send validation, scheduling, callbacks, state/claim recovery and masked diagnostics.
- `backend/whatsapp-inbound.js`: parser and exact action normalization.
- `backend/whatsapp-inbox.js`: durable inbox and cross-process phone leases.
- `backend/whatsapp-system.test.js`, `backend/whatsapp-test-db.js`: isolated end-to-end/regression suite and database double.
- `backend/whatsapp-audit-readonly.js`: safe registry/media inspection command.
- `backend/package.json`, `backend/.env.example`: test/audit commands and deployment settings.
- `admin-dashboard.html`: accurate status display and reconciliation notice.
- Three assets under `whatsapp/`, this report, and `WHATSAPP-VERIFICATION-LOG.txt`.
- Local ignored `backend/.env`: the five settings listed above. No credentials appear in this report.

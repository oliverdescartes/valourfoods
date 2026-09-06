# Meta delivery verification — 2026-09-06

## Result

The audited implementation supplies shared browser/server event IDs and relevant commerce fields. Actual Meta receipt and deduplication across the complete live funnel are not yet verified. No event semantics, environment settings, orders, or production deployment were changed in this verification.

## Evidence

- Both live hostnames return the expected Pixel ID, 2927690960901306, from `/api/meta/config`.
- The deployed `/meta-pixel.js` on both hostnames matches the local helper after normalizing line endings. Live homepage and checkout code use the shared tracking helper; checkout retains the captured-payment gate for online Purchase.
- An empty observation request from each allowed origin returns `400 event_not_allowed`, confirming the endpoint is reachable and those origins pass validation. This deliberately invalid probe sends no event to Meta and does not prove valid-event delivery.
- PageView, ViewContent, AddToCart and InitiateCheckout share the Pixel `eventID` with CAPI `event_id`. Purchase uses `purchase_<order ID>` in both channels. The separate custom `valour_purchase` event is intentionally distinct; it is not a second standard Purchase.
- Commerce payloads include INR value, product IDs, quantities and contents. Server Purchase uses the persisted pricing snapshot. Matching data is normalized and hashed where required; IP, user agent and existing valid browser/click cookies are included when available. This is code evidence, not a measurement of live match quality.
- All 11 automated integration tests pass. Their Meta responses are mocked; they verify payload construction and matching IDs, not receipt by Meta.
- The user's earlier deployed PageView log reports `accepted: true`, HTTP 200 and test events enabled. The current implementation requires `events_received === 1` to report acceptance. This supports receipt of that individual server event only.
- A read-only dataset lookup with this workspace's configured token currently returns HTTP 401 / Meta code 190. This does not establish the status of the separately configured Lightsail token, which previously accepted a PageView.
- This workspace currently reports NODE_ENV=production, META_DEPLOYMENT_ENV=production and no test code. These are local settings, not independently verified Lightsail process settings.
- Read-only aggregation of the configured `valour_mvp` database found eight website orders, dated August 30–31, 2026. All lack `metaPurchase.status`; there are no instrumented website order delivery records in this database. The database's identity relative to the live AWS process was not independently verified. These older records cannot establish current Purchase delivery and were not replayed.

## Remaining evidence needed

### Subsequent Events Manager screenshots supplied by the user

PageView is active with Multiple integrations. Its Event deduplication panel explicitly reports "Improve event ID coverage by fixing deduplication key issues" and "Deduplication has not been set up for this event." Thus Meta's evaluated data does not establish working PageView deduplication, despite the shared-ID implementation. The screenshot does not identify affected event timestamps or reveal the browser/server IDs, so historical events versus an ongoing delivery issue remain unresolved. A renewed source search found one JavaScript PageView dispatch in the shared helper; the HTML noscript fallback has no event ID but only runs without JavaScript. It is not evidence of a duplicate JavaScript dispatch.

From Events Manager for the expected dataset, inspect a fresh real action's browser and server event details: event name, event ID, source, deduplication status and commerce parameters. Matching browser/server IDs should represent one action. Purchase needs a genuine newly confirmed order and its worker delivery result. No fake purchase is needed.

An authenticated Events Manager session or working read-only dataset access was unavailable in this workspace. Consequently, there is no basis to claim all five events are currently received, deduplicated or have a particular event match quality score.

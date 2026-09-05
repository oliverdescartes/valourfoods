# Why normal VALOUR events were missing from Meta Test Events

## Root cause reported before edits

The normal central transport is `send()` in `backend/meta.js` (the project's equivalent of sendMetaConversionEvent). Before this fix, it selected the test code using:

```js
["development", "test"].includes(env.NODE_ENV)
  ? env.META_CAPI_TEST_EVENT_CODE
  : undefined
```

Consequently, configuring the test code alone had no effect when NODE_ENV was **production or unset**. A mocked call through the actual normal transport reproduced this: PageView retained its name but omitted test_event_code in both cases; development/test included it.

The current local backend/.env contains the test code and token, but NODE_ENV is unset. Values were not printed. This confirms the suppression locally. The owner confirmed **Amazon Lightsail, with no separate test URL**. **The Lightsail process's NODE_ENV is not verified:** no AWS CLI/configuration, SSH target/configuration or AWS connector is available here. AWS may be production, but this report does not assert that without runtime evidence.

There is also a confirmed live-domain rejection: both VALOUR hostnames serve the website without redirecting, but the deployed analytics origin policy accepts www and rejects the bare hostname. This stops bare-domain browser events before transport, independently of the test-code gate.

## Evidence for each requested check

| Check | Finding before changes |
|---|---|
| 1. Is the code attached to normal requests? | Only in NODE_ENV=development/test. Missing in production/unset despite configured code. |
| 2. Intentional production suppression? | Yes; explicitly implemented in config(). |
| 3. Is AWS running production? | Unknown without the running service environment/logs. Local NODE_ENV is unset. New startup diagnostics will show the actual process value safely. |
| 4. Do browser requests reach the backend? | Both live hosts return the correct public Pixel configuration and serve meta-pixel.js referencing /api/meta/events. Controlled HTTP probes reach the endpoint. No real user's browser Network trace or AWS request logs were available; real-browser delivery is not claimed. |
| 5. Are requests rejected? | Bare-domain origin was verified rejected with 403; www passed origin checks. Timestamp, rate and payload rejection paths exist, but their occurrence in real AWS traffic cannot be established without logs. |
| 6. Do normal events call central transport? | Yes. Browser PageView/ViewContent/AddToCart/InitiateCheckout use helper → endpoint → send(). Purchase uses trusted order worker → the same send(). New integration test exercises these paths with actual local HTTP and mocked Graph. |
| 7. Are errors logged? | Previously Graph/transport failure status/code were logged by callers; successful non-Purchase delivery, missing-token skips and endpoint rejection reasons were silent. Browser fetch failures/non-2xx were also silent. |
| 8. Did manual TestEvent bypass the normal path? | Yes, relative to this implementation: TestEvent is not allowed and ID 12345 fails the minimum eight-character ID validation. That event could not have passed this transport unchanged. The manual command itself is not in the repository. |

### Public deployment probes

Only GET requests and intentionally empty POST payloads were used. Empty payloads are rejected before any Meta call; no fake production event/order was created.

| Request | Observed result |
|---|---|
| GET https://www.liquidspice.in/api/meta/config | 200; pixelId 2927690960901306 |
| GET https://liquidspice.in/api/meta/config | 200; same ID, no redirect |
| GET homepage on each hostname | 200 on requested hostname; loads /meta-pixel.js |
| GET https://www.liquidspice.in/meta-pixel.js | 200; includes normal first-party event endpoint/config initialization |
| POST www endpoint, Origin=https://www.liquidspice.in, body={} | 400: got past origin gate to invalid-payload validation |
| POST bare endpoint, Origin=https://liquidspice.in, body={} | 403: origin gate rejected |

The successful manual Meta call proves connectivity for that call, not that website observations passed the application endpoint or received a test code. A normal event accepted without test_event_code is not routed to that Test Events session.

## Changes made

- Preserved all normal event names, trigger semantics, Pixel/server IDs, Purchase confirmation/capture requirements, retries and business rules.
- Added a temporary staging override that works with NODE_ENV=production, requires an explicit nonproduction deployment identity and expiry, and refuses the two live VALOUR hostnames.
- META_DEPLOYMENT_ENV=production always suppresses test codes, including if NODE_ENV is accidentally development/test.
- Preserved ordinary development/test behavior when the deployment is not explicitly production.
- Allowed **only the two verified VALOUR aliases** when PUBLIC_SITE_URL is one of their normal HTTPS origins. Unrelated subdomains, foreign domains, different ports and insecure aliases remain excluded. Staging remains restricted to its configured origin. No global CORS or trust-proxy rules were loosened.
- Added safe endpoint rejection reason codes and browser warnings, centralized transport outcome logging when a test code is configured, and startup effective-configuration diagnostics. Tokens, test-code values, customer fields, IPs and full request bodies are not logged.
- Rejected missing/blank source/origin strings instead of resolving undefined against PUBLIC_SITE_URL.
- Added a read-only local diagnostics script. It loads backend/.env without connecting to Meta, MongoDB or business services.

Files changed: backend/meta.js, meta-pixel.js, backend/.env.example, backend/meta.test.js, META-INTEGRATION-REPORT.md. Files added: backend/meta-diagnostics.js, META-TEST-EVENTS-AUDIT.md. The real backend/.env was **not changed**, and no AWS deployment/restart was performed.

## Temporarily enable on staging

There is currently no staging URL. This is configuration for a future isolated test deployment, **not instructions to relabel the live Lightsail site as staging**. No live Test Events override was enabled. NODE_ENV is the Node backend's runtime-mode variable, not a URL or an AWS service name; the application/process startup configuration determines its value.

Set these in the **staging backend service's actual environment**, using its real staging URL:

```dotenv
NODE_ENV=production
META_DEPLOYMENT_ENV=staging
META_CAPI_TEST_MODE=true
META_CAPI_TEST_MODE_UNTIL=<UTC ISO timestamp about one hour from now>
META_CAPI_TEST_EVENT_CODE=<existing Meta Test Events code>
PUBLIC_SITE_URL=https://<your-staging-host>
```

Keep the access token in the existing backend secret variable. Do not send it to the browser or paste it into source. Generate an expiry without printing secrets:

```sh
node -p "new Date(Date.now() + 60 * 60 * 1000).toISOString()"
```

The expiry must be in the future and no later than 24 hours after the process starts. Restart/redeploy the staging service with these settings; the test code automatically stops attaching when the expiry passes. It also stops if the flag is disabled or deployment identity changes to production. This override **cannot be used on https://liquidspice.in or https://www.liquidspice.in**.

For ordinary isolated local development, NODE_ENV=development or test still supports the existing test code without an override, unless META_DEPLOYMENT_ENV=production. Do not change live NODE_ENV merely to get around the gate.

Keep the real production service set to META_DEPLOYMENT_ENV=production, with META_CAPI_TEST_MODE=false and no test code. Remove the staging flag/code/expiry after testing as well.

The backend loads backend/.env once at startup. Editing the file does not update a running process, and dotenv does not override variables already injected by its process manager/container. Ensure the AWS service/task/process is restarted with the intended values; changing only an SSH shell's environment is not evidence that the running service changed.

## Verify the actual AWS process and event path

After deploying, read the running Node service's startup log `[META][CONFIG]` through its existing log destination (process logs or CloudWatch, as configured). For the staging override, expect:

```text
nodeEnv: production
deploymentEnv: staging
tokenConfigured: true
testCodeConfigured: true
testEventsEnabled: true
testModeReason: temporary_staging_override
publicOrigin: <staging origin>
```

This log is emitted from the actual application process, so it can answer the AWS NODE_ENV question. No diagnostics/secret endpoint was made public. `node backend/meta-diagnostics.js` is also safe to run, but it describes **that command's** inherited environment plus backend/.env; a separate shell may differ from the live process.

For a Linux Lightsail instance, open the instance's **Connect** tab and choose **Connect using SSH**, then change to the deployed project directory. This is Lightsail's [official browser SSH workflow](https://docs.aws.amazon.com/lightsail/latest/userguide/lightsail-how-to-connect-to-your-instance-virtual-private-server.html). After the new files are deployed, the safe preliminary command is:

```sh
node backend/meta-diagnostics.js
```

Use the application's `[META][CONFIG]` startup log for the authoritative running-process result. There is no need to dump the environment or display backend/.env; those could expose credentials. The SSH connection/process manager was not available to this audit, so the instance was not modified.

Then open dataset 2927690960901306 → Test Events, use the configured code, and perform normal staging actions. Browser Network should show /api/meta/config=200 and /api/meta/events=204 for valid observations. Standard Purchase intentionally has no browser submission to this endpoint: it comes from the order worker.

An endpoint 204 means it handled the observation, **not** that Meta accepted it. Check the matching central `[META]` transport log for event name/ID, accepted=true, httpStatus=200 and testEventsEnabled=true. Outbound payloads retain the real event_name and place test_event_code at the request top level alongside data.

| Diagnostic | Meaning |
|---|---|
| testModeReason explicit_test_mode_required | NODE_ENV is production/unset and temporary staging flag is not enabled |
| production_deployment | Deployment identity deliberately blocks testing |
| nonproduction_deployment_required | Temporary override lacks staging/test/development identity |
| production_or_invalid_site | Invalid staging URL or a live VALOUR hostname |
| test_window_invalid_or_expired | Missing/invalid/expired expiry or outside the 24-hour startup window |
| ingress 403 origin_not_allowed / cross_site_request | Origin policy or fetch-site rejection |
| ingress 400 invalid_event_time | Timestamp not integer seconds or over five minutes from server clock |
| ingress 429 rate_limited | More than 120 requests/minute for the resolved client IP in this process; inspect trusted-proxy configuration if all users share one peer |
| ingress 400 invalid_payload_shape / event_not_allowed / invalid_event_id / payload_too_large | Schema/name/ID/size validation failed |
| ingress 400 source_url_not_allowed / invalid_currency / invalid_commerce_data | Source/INR/ecommerce validation failed |
| transport reason token_missing | Normal process has no configured CAPI token |
| transport accepted=false, HTTP/error code | Central transport failed or Meta rejected the request |
| transport accepted=true, testEventsEnabled=false | Meta accepted the normal event without routing it to Test Events |
| browser Pixel configuration unavailable | The config fetch/response failed before initialization and event flushing |

Check browser and server event IDs match. Purchase remains tied to a genuine staging order and, online, capture evidence. Never rename normal events to TestEvent, submit Purchase through the public endpoint, or replay previously sent purchases just to populate the test view.

## Verification completed

- 11 automated tests pass, including the existing eight tests and new configuration/expiry, local HTTP funnel and rejection-diagnostics coverage.
- The actual browser helper sends PageView/ViewContent/AddToCart/InitiateCheckout through real local Express HTTP; the trusted worker sends Purchase. Mocked Graph requests show all five original names, the staging test code and matching Pixel/CAPI IDs.
- Production/unset default suppression, explicit production block, both live-host refusals, missing/expired/too-distant expiry and expiry without restart are tested.
- Origin alias/foreign-origin handling, timestamp, payload, currency, commerce and rate rejection reasons are tested. Fake Purchase/TestEvent remain rejected.
- Syntax checks and git diff --check pass. No new build system or event architecture was introduced.

Live AWS runtime values, actual user browser requests, Graph responses from the deployed normal transport and Events Manager receipt after deployment remain to be verified using the above diagnostics. No production setting was changed by this audit.

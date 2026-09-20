# Brevo sample messaging

This is a standalone sample. It does not change checkout, WhatsApp, or the current SES `emailService.js` path. Preview mode makes no network request. A live action requires `--send`.

## Configuration

The existing `.env` has `BREVO_EMAIL_SMPT_KEY` and `BREVO_MARKETING_LIST_ID`. Add:

- `BREVO_SMTP_LOGIN`: the SMTP login shown in Brevo's SMTP settings. This may differ from the current `SMTP_USER` used with the other SMTP host.
- `BREVO_EMAIL_FROM`: a verified Brevo sender address. If omitted, the sample uses `EMAIL_FROM`.
- `BREVO_API_KEY`: required only for the marketing contact list. An SMTP key cannot call the contacts API.

The sample accepts the existing `BREVO_EMAIL_SMPT_KEY` spelling and the corrected `BREVO_EMAIL_SMTP_KEY` spelling. It does not print either key.

## Utility email example

From `backend`, preview an order confirmation:

```powershell
npm run brevo:sample -- --action utility --to customer@example.com --template order_confirmation --data-file ./brevo-sample-order.json
```

Use `--template order_status_update` with `order_number`, `shipping_status`, `payment_method`, `payment_status`, `delivery_estimate`, and `tracking_url` for the status example. Add `--send` at the end to submit one real email via Brevo SMTP. Use a recipient you control for the first send.

## Marketing list example

From `backend`, preview adding a contact with separately recorded **email** marketing consent:

```powershell
npm run brevo:sample -- --action marketing-enroll --to customer@example.com --consent-at 2026-09-19T10:00:00Z --consent-source website_email_opt_in
```

Add `--send` to call Brevo's Contacts API. The sample checks whether the contact is blocked or unsubscribed from this list and does not re-enroll it. If the contact is already in the list, it returns `already_enrolled`. Creating or adding a contact does not itself send a marketing email; configure a campaign or automation in Brevo for that list. Do not use WhatsApp opt-in as email marketing consent.

This sample renders two utility emails in code. The [full catalog](../EMAIL-FALLBACK-TEMPLATES.md) contains the remaining email copy. Template IDs created in the Brevo editor require Brevo's transactional email API and an API key; this SMTP sample sends its own plain text body.

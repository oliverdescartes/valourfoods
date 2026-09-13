# VALOUR WhatsApp compliance and appeal pack

Prepared: 13 September 2026

## Business identity

- Legal operator: **Cosmos Foods**
- Consumer brand: **VALOUR**
- Relationship: **VALOUR is a brand owned and operated by Cosmos Foods.**
- Gupshup app: `valour`
- Gupshup App ID: `b929bb0e-f4e1-46ca-8a9a-fe32b7034eb2`
- WhatsApp Business Account ID: `2200824987432825`
- WhatsApp source number: `+91 70059 33924`

The website, checkout, privacy notice, Gupshup app, Meta Business Portfolio, and appeal should use this relationship consistently. Do not describe VALOUR as a separate legal company.

## Controls implemented before appeal

1. **Marketing automation is paused.** `WHATSAPP_MARKETING_ENABLED=false` blocks new promotional jobs, cancels queued marketing jobs at startup, and blocks them again immediately before sending.
2. **Service messaging stays available.** Genuine order confirmations, COD-to-prepaid payment confirmations, order-status and delivery updates, cooking help requested by the customer, and customer-support replies remain available.
3. **Checkout opt-in is optional.** The checkbox is unticked by default and says: “Send me order updates and offers from VALOUR on WhatsApp. I can opt out at any time.”
4. **Consent evidence is immutable.** Each checkout records the phone, exact wording, wording version, source, source page, accepted categories, status, and timestamp in `whatsapp_consent_events`. A consent snapshot is also stored with the order.
5. **STOP works.** `STOP`, `UNSUBSCRIBE`, `OPT OUT`, and equivalent exact commands revoke promotional consent, cancel pending marketing jobs, and return a confirmation. Essential updates for a later customer order and customer-requested support are unaffected.
6. **Manual marketing is blocked too.** The admin template sender cannot send a marketing template while the compliance switch is off. If it is later enabled, a phone still needs active consent for the `offers` category.
7. **Evidence is reviewable.** In Admin Dashboard → Send WhatsApp → Consent and transaction proof, an administrator can retrieve consent events and matching real orders for a phone. The same data is available from `GET /api/admin/whatsapp/compliance?phone=...` with the admin token.
8. **Operator identity is disclosed.** The homepage, checkout, privacy notice, structured data, and evidence endpoint identify Cosmos Foods as the operator of VALOUR.

## Message classification and template review

### Paused marketing messages

- New lead follow-up
- Product demonstration follow-up
- High-intent follow-up
- Price and delivery follow-up
- Abandoned-checkout reminder
- Review request
- Reorder reminder

These are blocked even if an old database job exists. They should stay disabled throughout the review. When Meta restores the account, enable them only after confirming each approved template includes clear sender identity and an opt-out instruction, and only for customers with recorded `offers` consent.

### Allowed service messages

- Order confirmation
- Cash-on-delivery order confirmation
- Successful COD-to-prepaid payment update
- Customer-visible order status or delivery update tied to a real order
- Customer-requested cooking reminder/help
- Customer-requested support reply

The configured message text was searched for medical claims, treatment claims, disease claims, guaranteed health outcomes, weight-loss claims, and immunity claims. No such claims were found in the configured WhatsApp template previews. Promotional claims should be reviewed again against the exact text approved in Gupshup before marketing is re-enabled.

## Evidence to attach

Export or screenshot the following without exposing unrelated customer data:

1. The unticked checkbox on the live checkout page.
2. The privacy-policy passages identifying Cosmos Foods and explaining WhatsApp use and STOP.
3. One consent proof record for a consenting test customer, showing the exact wording and timestamp.
4. One STOP record showing `revoked` plus the cancelled marketing job.
5. A real order matched to each example service message used in the appeal.
6. The environment/configuration screen showing `WHATSAPP_MARKETING_ENABLED=false` with secrets hidden.
7. The relevant approved template names and categories from Gupshup/WhatsApp Manager.
8. The account screen showing WABA ID `2200824987432825` and the disabled status.

Do not attach API keys, webhook tokens, payment secrets, OTPs, or full customer addresses.

## Meta Account Quality review text

> Cosmos Foods owns and operates the consumer brand VALOUR. We identified and corrected consent and opt-out weaknesses in our WhatsApp implementation. All promotional WhatsApp automation and manual promotional template sending are now disabled. Existing queued promotional jobs are cancelled at startup and blocked again at send time. We currently retain only messages tied to a genuine order or payment, delivery updates for real orders, and support or cooking help requested by the customer.
>
> Our checkout now uses an optional checkbox that is unticked by default. We store the phone number, exact consent wording and version, source page, accepted categories, and timestamp. STOP and equivalent unsubscribe commands immediately revoke promotional consent, cancel pending promotional jobs, and confirm the opt-out. VALOUR is now consistently identified across our website, checkout, privacy notice, and records as a brand owned and operated by Cosmos Foods.
>
> We reviewed the configured message templates and found no medical, disease-treatment, or guaranteed health-result claims. We can provide consent records and matching transaction records for service messages. Please review WABA `2200824987432825` and restore it if these corrections satisfy the policy requirements.

## Gupshup support case text

**Subject:** Request Meta WABA review/escalation – VALOUR / Cosmos Foods – WABA 2200824987432825

> Our Gupshup app `valour` (App ID `b929bb0e-f4e1-46ca-8a9a-fe32b7034eb2`, source `917005933924`) is connected to Cosmos Foods WABA `2200824987432825`, which Meta has disabled for a policy violation. We have paused every promotional automation and manual promotional send, cancelled queued promotional jobs, added explicit unticked checkout opt-in with immutable evidence, implemented STOP/unsubscribe, limited active messaging to genuine order/payment/delivery updates and customer-requested support, and made the Cosmos Foods–VALOUR relationship consistent.
>
> Please confirm the exact enforcement reason available to Gupshup, check whether any templates or historical campaigns caused the restriction, and escalate the corrected account to Meta for review. We can provide screenshots and redacted consent/transaction records. Please do not reactivate or submit promotional campaigns while the review is pending.

## After restoration

Keep `WHATSAPP_MARKETING_ENABLED=false` until the WABA is restored, the exact approved templates are checked in Gupshup, and a small consented test cohort has confirmed delivery and STOP behavior. Start with service messages. Review quality rating, blocks, reports, and failed-message reasons before considering promotional messaging.

# WhatsApp ordering setup

The webhook conversation now supports a complete WhatsApp checkout:

1. Customer replies `3`, `BUY`, or `ORDER`.
2. Customer orders the single Velvety Butter Chicken Liquid Spice SKU and is taken directly to delivery details. The WhatsApp order defaults to one unit; no product or bottle-quantity question is shown.
3. The server creates a Razorpay Payment Link and sends it in WhatsApp.
4. Razorpay calls the signed payment webhook after payment.
5. The MongoDB order is marked paid and WhatsApp sends the order confirmation.

## Required dashboard setup

- Keep the Meta WhatsApp webhook pointed to `https://YOUR_DOMAIN/webhook`.
- In Razorpay, create a webhook pointing to `https://YOUR_DOMAIN/api/payment/webhook`.
- Subscribe the Razorpay webhook to `payment_link.paid`, `payment.captured`, and `payment.failed`.
- Put the webhook signing secret in `RAZORPAY_WEBHOOK_SECRET`.
- Set `PUBLIC_SITE_URL` and the existing WhatsApp/Razorpay/MongoDB variables shown in `.env.example`.

Payments use a Razorpay-hosted secure page supporting the payment methods enabled on the merchant account (such as UPI, cards, net banking, and wallets). Card or UPI credentials are never handled by this server.

Successful and failed Razorpay attempts send WhatsApp status messages for both website checkout orders and WhatsApp payment-link orders. Notification claims are stored to prevent duplicate messages when the browser callback and Razorpay webhook arrive for the same payment.

The single delivery message requires six values in order: name, locality/area, city, state, six-digit pincode, and house/street. Customers may use labels but do not have to copy exact syntax. House/street must be present, but its contents are not validated; location-format validation focuses on locality, city, state, and pincode. Invalid or missing fields are listed back to the customer, who is asked to resend all six values.

After the address passes validation, the customer chooses the courier phone number. `USE THIS NUMBER` uses the current WhatsApp number immediately. A separately entered Indian mobile number is validated, then a six-digit OTP is sent in the current WhatsApp chat. The code expires after five minutes, and the supplied number is added to billing and shipping details only after the customer returns that code in the same chat.

Run `npm test` from `backend` for the catalog, quantity, shipping, and cart-total checks.

## Automated template jobs

Approved template messages are stored in MongoDB's `message_jobs` collection and
sent by a worker that polls once per minute. Jobs survive server restarts and use
a unique `jobKey` to prevent duplicate sends. The worker validates template
parameters, current payment/delivery state, open serious support cases, quiet
hours (09:00-20:00 IST), and marketing frequency limits before sending through
the existing Gupshup transport. It does not use a custom consent field or check.

Configure the template names in `.env` using the variables listed in
`.env.example`, and map those names to approved Gupshup template IDs through
`GUPSHUP_TEMPLATE_IDS`.

Media-header templates are configured centrally with `WHATSAPP_TEMPLATE_MEDIA`.
Each key is an approved template name and each value contains `type` (`image`,
`video`, or `document`) plus a public HTTPS `url`. The legacy
`WHATSAPP_ORDER_IMAGE_URL` remains an order-template fallback.

Website checkout abandonment is inferred reliably: `/api/payment/create-order`
creates a reminder job for 60 minutes later, and successful payment cancels it.
No tab-close tracker, Meta Pixel, Google Analytics, or WebSocket is required.
The checkout review step also posts an idempotent first-party event to
`POST /api/customer-events`; this covers customers who leave before Razorpay is
opened. The same endpoint accepts `product_viewed`, `product_explored`, and
`recipe_video_clicked` when the storefront later wires those interactions.

For self-delivery, call the existing endpoint with an admin token:

```http
POST /api/orders/VALOUR-123ABC/shipping-status
x-admin-token: YOUR_ORDER_ADMIN_TOKEN
Content-Type: application/json

{
  "shippingStatus": "Delivered",
  "deliveredBy": "staff-name"
}
```

This stores `deliveredAt`, `deliveredBy`, and `deliverySource: "internal"`, then
schedules the ready-to-cook message for two hours later and the reorder reminder
for seven days later. Replies such as `Tomorrow`, `This weekend`, and
`Remind me later` create cooking-reminder jobs; starting cooking cancels them.

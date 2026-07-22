# WhatsApp ordering setup

The webhook conversation now supports a complete WhatsApp checkout:

1. Customer replies `3`, `BUY`, or `ORDER`.
2. Customer selects products and quantities, then sends one structured delivery-details message. They may also order multiple items in one natural message, such as `Order 2 Velvety Butter Chicken and 3 Mithila Fish Curry`; recognized catalog names and quantities from 1–10 are extracted and shown as a cart before checkout continues.
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

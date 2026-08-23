# Fast2SMS SMS verification setup

Checkout phone verification and the WhatsApp shipping-phone verification flow
send their six-digit OTP through Fast2SMS Quick SMS. WhatsApp remains the
conversational channel for order messages.

1. Complete Fast2SMS account verification/KYC.
2. Add the minimum wallet transaction required for API access.
3. Copy the authorization key from **Dev API**.
4. Add this server-only value to `backend/.env`:

   ```env
   FAST2SMS_API_KEY=replace_with_your_api_authorization_key
   ```

   Checkout verification tokens are signed with `TRACKING_TOKEN_SECRET`. You
   can optionally keep this responsibility separate by adding another long,
   random server-only value:

   ```env
   CHECKOUT_OTP_SECRET=replace_with_a_long_random_private_value
   ```

5. Restart the backend.

The integration posts to `https://www.fast2sms.com/dev/bulkV2` with `route=q`.
Fast2SMS assigns the sender ID. Never expose the API key in frontend code or
commit it to Git. Confirm the live Quick SMS price in the dashboard before
enabling customer traffic.

The checkout calls `POST /api/auth/otp/send`, then
`POST /api/auth/otp/verify`. Challenges expire after five minutes, can be
requested at most once per minute and three times per ten minutes, and allow a
maximum of five incorrect attempts. Only an HMAC of the OTP is stored in
MongoDB; the plain OTP is sent to Fast2SMS and is never written to logs.

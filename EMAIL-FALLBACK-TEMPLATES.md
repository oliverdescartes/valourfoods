# VALOUR email fallback template catalog

This is a copy and paste catalog for setting up Brevo templates. It adapts the outbound WhatsApp messages in `backend/server.js` for email. **Marketing** means an offer, product promotion, checkout prompt, review request, or reorder prompt. **Utility** means an order, payment, delivery, cooking instruction requested by the customer, or support update. The labels mirror the current WhatsApp automation classification where an automation exists. They describe template purpose; they do not indicate that an email recipient has consented.

Use these placeholders only when their data is available. Do not send a message with an unresolved placeholder. `{{first_name}}` may be replaced with “there”. `{{site_url}}` is the configured public site URL; `{{product_url}}` points to its Velvety Butter Chicken section. `{{tracking_url}}`, `{{payment_url}}`, `{{review_url}}`, and `{{cooking_video_url}}` must be generated or selected for the specific recipient and event. Replace WhatsApp buttons and “reply 1/2” instructions with links or a monitored reply address. Marketing messages need the email system's unsubscribe link and suppression rules.

## Scheduled customer automations

### 1. `new_lead` — Marketing

**Subject:** Welcome to VALOUR, {{first_name}}

**Preheader:** An easier way to make {{dish_name}} at home.

**Body:**

Hi {{first_name}},

Welcome to VALOUR. Making {{dish_name}} at home can now be simple. Explore our ready-to-cook liquid spice and see how it works.

**CTA:** Explore VALOUR — {{product_url}}

### 2. `product_demo` — Marketing

**Subject:** See how to make {{dish_name}} with VALOUR

**Preheader:** Watch the cooking demo and explore the product.

**Body:**

Hi {{first_name}},

Make {{dish_name}} with VALOUR Velvety Butter Chicken Liquid Spice. The cooking base handles the slow work. Add chicken and finish the dish at home.

**CTAs:** Watch the cooking demo — {{cooking_video_url}}; Explore the product — {{product_url}}

### 3. `high_intent_followup` — Marketing

**Subject:** Still thinking about butter chicken?

**Preheader:** Explore the VALOUR cooking base.

**Body:**

Hi {{first_name}},

VALOUR gives you the complete cooking base, so you can get rich, balanced flavour without building the sauce from scratch.

**CTA:** Explore VALOUR — {{product_url}}

### 4. `price_delivery_followup` — Marketing

**Subject:** Your VALOUR price and delivery details

**Preheader:** The details you asked for, all in one place.

**Body:**

Hi {{first_name}},

Here are the details you asked for:

- Product: {{product_name}}
- Price: {{price}}
- Delivery: {{delivery_estimate}}

You can order online when you're ready. Confirm the final delivery estimate at checkout.

**CTA:** Order online — {{product_url}}

### 5. `checkout_reminder` — Marketing

**Subject:** Complete your VALOUR order

**Preheader:** {{product_name}} is waiting in checkout.

**Body:**

Hi {{first_name}},

You left {{product_name}} in checkout. Your total was {{amount}}. Complete your order when you're ready; the final total and delivery details will appear at checkout.

**CTA:** Complete order — {{checkout_url}}

### 6. `order_confirmation` — Utility

**Subject:** VALOUR order {{order_number}} confirmed

**Preheader:** Your payment and order details.

**Body:**

Hi {{first_name}},

Your VALOUR order {{order_number}} is confirmed.

- Amount paid: {{amount_paid}}
- Items: {{items}}
- Expected delivery: {{delivery_estimate}}

We will email you when the order status changes.

**CTA:** Track your order — {{tracking_url}}

### 7. `cod_confirmation` — Utility

**Subject:** VALOUR order {{order_number}} confirmed for Cash on Delivery

**Preheader:** Review the amount due and delivery details.

**Body:**

Hi {{first_name}},

Your VALOUR order {{order_number}} is confirmed for Cash on Delivery.

- Items: {{items}}
- Expected delivery: {{delivery_estimate}}
- Amount due at delivery: {{amount_due}}

You can pay online now if you prefer. If online payment succeeds, no payment will be collected at delivery.

**CTAs:** Pay online — {{payment_url}}; Track your order — {{tracking_url}}

### 8. `cod_prepaid_confirmation` — Utility

**Subject:** Payment received for VALOUR order {{order_number}}

**Preheader:** Your Cash on Delivery order is now prepaid.

**Body:**

Hi {{first_name}},

Your online payment of {{amount_paid}} for order {{order_number}} was successful. Your order is now prepaid. No payment will be collected at delivery.

**CTA:** Track your order — {{tracking_url}}

### 9. `order_status_update` — Utility

**Subject:** Update on VALOUR order {{order_number}}

**Preheader:** Current shipping and payment status.

**Body:**

Hi {{first_name}},

Here is the latest update for order {{order_number}}:

- Shipping status: {{shipping_status}}
- Payment method: {{payment_method}}
- Payment status: {{payment_status}}
- Expected delivery: {{delivery_estimate}}

**CTA:** Track your order — {{tracking_url}}

### 10. `delivered_ready_to_cook` — Utility

**Subject:** VALOUR order {{order_number}} has been delivered

**Preheader:** Your cooking guide is ready.

**Body:**

Hi {{first_name}},

Your VALOUR order {{order_number}} has been delivered. Your Velvety Butter Chicken Liquid Spice is ready when you are. Follow the cooking guide whenever you're ready.

**CTA:** Start cooking — {{cooking_video_url}}

### 11. `cooking_reminder` — Utility

Send only when the customer requested a cooking reminder or guide.

**Subject:** Ready to cook {{dish_name}}?

**Preheader:** Your VALOUR cooking guide is here.

**Body:**

Hi {{first_name}},

Your VALOUR cooking guide for {{dish_name}} is ready. Watch it whenever you're ready to cook.

**CTA:** Watch the cooking video — {{cooking_video_url}}

### 12. `post_cook_feedback` — Marketing

**Subject:** How was your VALOUR experience?

**Preheader:** Tell us what you enjoyed and what we can improve.

**Body:**

Hi {{first_name}},

How was your overall experience with VALOUR? From ordering and delivery to packaging, cooking and taste, we'd love to hear what you enjoyed and what we can improve.

**CTA:** Share feedback — {{feedback_url}}

### 13. `review_request` — Marketing

**Subject:** Enjoyed your VALOUR meal?

**Preheader:** Rate your experience when you have a moment.

**Body:**

Hi {{first_name}},

We'd love to hear from you. Share a review of your VALOUR experience whenever you're ready.

**CTA:** Rate VALOUR — {{review_url}}

### 14. `reorder_reminder` — Marketing

**Subject:** Ready for another {{product_name}} night?

**Preheader:** Reorder your VALOUR liquid spice.

**Body:**

Hi {{first_name}},

Ready for another {{product_name}} night? Reorder VALOUR Velvety Butter Chicken Liquid Spice and make dinner easy again.

**CTA:** Reorder — {{product_url}}

## Other outbound messages

These are sent through WhatsApp conversation, payment, or admin flows. Use the email equivalents below when the recipient's email address is known. The admin messages go to internal recipients only.

### 15. Payment failed — Utility

**Subject:** Payment was not completed for VALOUR order {{order_number}}

**Body:** Your payment of {{amount}} was not successful. {{failure_reason}} No order has been confirmed. You can retry securely on the payment page: {{payment_url}}. If you need help, reply to this email.

### 16. Detailed order tracking reply — Utility

**Subject:** Tracking details for VALOUR order {{order_number}}

**Body:** Payment: {{payment_status}}. Shipping: {{shipping_status}}. Courier: {{courier_name}}. Tracking number: {{tracking_number}}. Expected delivery: {{delivery_estimate}}. Items: {{items}}. Total: {{total}}. Track here: {{tracking_url}}. Reply to this email if you need customer care.

### 17. Payment link for a customer initiated order — Utility

**Subject:** Secure payment link for VALOUR order {{order_number}}

**Body:** Your order contains {{items}}. Total: {{total}}. Pay securely here: {{payment_url}}. You can use UPI, card, net banking, or wallet. We will confirm the order after successful payment.

### 18. Customer care request received — Utility

**Subject:** We received your VALOUR request {{case_id}}

**Body:** Thank you. Your request is with VALOUR Customer Care. Reference: {{case_id}}. Issue: {{issue_category}}. Our team will review it and follow up by email. Please keep the product and packaging until the request is resolved, if relevant.

### 19. Requested product or cooking help — Utility

**Subject:** Your VALOUR cooking guide

**Body:** Velvety Butter Chicken Liquid Spice is made for Butter Chicken Curry. You still cook the chicken and finish the dish; VALOUR simplifies the curry base preparation. Watch the cooking guide: {{cooking_video_url}}. For help opening the sealed lid, watch: {{lid_video_url}}. Reply to this email if you need help.

### 20. Customer submitted cooking feedback — Utility

**Subject:** Thanks for your VALOUR feedback

**Body:** Thank you for telling us how your Butter Chicken turned out. We have recorded your feedback about {{feedback_topic}}. If you need cooking help, reply to this email with a description of the issue.

### 21. Admin new order alert — Utility, internal only

**Subject:** New VALOUR order {{order_number}} — {{customer_name}}

**Body:** Order: {{order_number}}. Customer: {{customer_name}} ({{customer_phone}}). Items: {{items}}. Total and payment method: {{amount_and_payment_method}}. Delivery address: {{delivery_address}}. {{stock_status}} Review the order in the admin dashboard: {{admin_order_url}}.

### 22. Admin customer care alert — Utility, internal only

**Subject:** VALOUR customer care case {{case_id}}

**Body:** Case: {{case_id}}. Customer: {{customer_name}} ({{customer_phone}}). Issue: {{issue_details}}. Review and update the case in the admin dashboard: {{admin_case_url}}.

## Interactive WhatsApp conversations

The WhatsApp handler also sends menus, number prompts, validation errors, and answers to incoming questions. Email should use a monitored reply address or a web page for the next step. These templates cover each conversation branch without copying chat commands into email.

| Flow | Label | Email subject | Email body or next action |
| --- | --- | --- | --- |
| Order number requested | Utility | Help us find your VALOUR order | Reply with your order number, or use {{tracking_url}} if you have it. |
| Order lookup needs details | Utility | Details needed to find your order | Reply from your registered email with your registered phone number and delivery pincode. |
| Order lookup found no match | Utility | We could not find that order | Check the details and reply again, or contact customer care at {{support_email}}. |
| Several orders matched | Utility | Which VALOUR order do you mean? | Reply with one order number from this list: {{matched_orders}}. |
| Customer care topic selection | Utility | How can VALOUR help? | Reply with your topic: order status, return or refund, damaged or missing item, product or cooking help, or another issue. |
| Customer care needs order number | Utility | Your order number will help us | Reply with your VALOUR order number. If you cannot find it, send your registered phone number and delivery pincode. |
| Customer care needs issue details | Utility | Tell us more about your request | Reply with a description of the issue. For damaged or leaking products, include what arrived and the package condition. |
| Product details requested | Utility | About Velvety Butter Chicken Liquid Spice | VALOUR is made for Butter Chicken Curry. You cook the chicken and finish the dish; the liquid spice simplifies the curry base. View the product: {{product_url}}. |
| Cooking video requested | Utility | Your VALOUR cooking video | Watch the guide here: {{cooking_video_url}}. Reply when you need help with a step. |
| Lid opening help requested | Utility | How to open your VALOUR jar | Vacuum sealing may make the lid tight. Gently tap around its edge with a wooden spatula, then twist it open. Watch: {{lid_video_url}}. |
| Cooking complete acknowledgement | Utility | Thanks for cooking with VALOUR | We have recorded that you finished cooking. If you need help, reply to this email. |
| Customer initiated order needs delivery details | Utility | Delivery details needed for your VALOUR order | Reply with your name, locality, city, state, pincode, house number and street, and mobile number. The order will be reviewed before a payment link is created. |
| Customer initiated order review | Utility | Review your VALOUR order details | Items: {{items}}. Total: {{total}}. Delivery to: {{delivery_address}}. Mobile: {{shipping_phone}}. Reply to confirm or request a correction. |
| Shipping phone verification | Utility | Verify your delivery phone number | Enter the code using the secure verification flow: {{verification_url}}. The code expires after 5 minutes. Do not send a code by email. |
| Payment link creation failed | Utility | We could not create your payment link | Please try again from {{checkout_url}}, or reply to this email for help. |
| Payment pending | Utility | Payment pending for order {{order_number}} | Your order is awaiting payment. Use {{payment_url}} to complete it. |
| Opt-out confirmation | Utility | Your VALOUR email preference is updated | You have been unsubscribed from promotional VALOUR emails. We may still email essential updates for orders you place and reply when you contact support. |

Free-form answers from the brand question handler and replies written by customer care are generated from the customer's question or case. Keep them in the **Utility** lane when they answer a specific request without promotion; classify any separate offer as **Marketing** before sending.

## Brevo setup notes

1. Create each named template under the label shown. The 14 scheduled templates are the main set; the other messages cover service conversations and internal alerts.
2. Map `{{placeholder}}` text to the fields you have available in Brevo. Replace WhatsApp button actions with working links or a monitored reply address.
3. Add an unsubscribe link to marketing templates and send them only to addresses with email marketing opt-in. WhatsApp consent does not establish email marketing consent.
4. Check live links, order details, and the exact provider text before using the templates. `WHATSAPP_TEMPLATE_TEXTS` can override the local WhatsApp preview copy.

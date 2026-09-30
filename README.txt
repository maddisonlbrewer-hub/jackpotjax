Jackpot JAX Netlify site

LOCAL PREVIEW
1. Install Node.js 18.14 or newer and the Netlify CLI.
2. From this project folder, run: pnpm install
3. Run: netlify dev
4. Open the local URL shown by Netlify.

PUBLISH TO NETLIFY
Recommended: connect this repository to the existing Jackpot JAX Netlify project.
Netlify will build and deploy the static site and its functions on each push.

For a manual deploy, use the Netlify CLI from this project folder:
1. Run: netlify status
2. If needed, run: netlify link
3. Preview with: netlify deploy --dir=. --functions=netlify/functions
4. After testing the preview URL, publish with:
   netlify deploy --prod --dir=. --functions=netlify/functions

Do not upload only the HTML/CSS/JavaScript output. Checkout, Stripe webhooks,
subscriber storage, and welcome emails depend on the Netlify Functions.

PAID SUBSCRIPTION SETUP
Jackpot JAX is designed as a 7-day free trial followed by a $7.99 monthly subscription.
The signup form sends members to a server-side Stripe Checkout session.

Before publishing this version, add these secret production environment variables in Netlify:
- STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_PRICE_ID
- STRIPE_WEBHOOK_SECRET

STRIPE_PRICE_ID must reference the recurring $7.99/month Jackpot JAX Price in Stripe.
Do not publish the paid checkout until all four values are configured and tested in Stripe test mode.

Stripe sends subscription changes to /api/stripe-webhook. The signed webhook
stores each subscriber privately in the site-scoped jackpot-jax-subscribers
Netlify Blobs store. Trialing and active subscriptions have access; canceled,
unpaid, paused, and incomplete subscriptions do not.
Configure the Stripe webhook endpoint with API version 2026-08-26.dahlia so its
event payloads match the server SDK and Stripe.js integration.

WELCOME EMAIL SETUP
New trialing or active members are queued for a one-time welcome email. The
email is sent through Resend, and failed sends are retried every 15 minutes.
Stripe test-mode signups are suppressed unless explicitly enabled.

Add these environment variables in Netlify before enabling email delivery:
- RESEND_API_KEY
- WELCOME_EMAIL_FROM (example: Jackpot JAX <hello@updates.jackpotjax.co>)
- WELCOME_EMAIL_REPLY_TO (optional)
- WELCOME_EMAIL_ALLOW_TEST_MODE (optional; set to true only while testing)

The sending domain must be verified in Resend. Preview the finished design at
/welcome-email-template without sending an email.

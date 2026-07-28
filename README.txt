Jackpot JAX final Netlify version

PREVIEW BEFORE PUBLISHING
1. Unzip the downloaded folder.
2. Double-click index.html.
3. It will open in Safari or Chrome without changing your live site.

PUBLISH TO NETLIFY
1. Log in to Netlify.
2. Open your Jackpot JAX project.
3. Go to Deploys.
4. Drag the entire unzipped folder into the manual deploy area.
5. Netlify will publish this as the newest version and keep your previous deploy in history.

PAID SUBSCRIPTION SETUP
Jackpot JAX is designed as a 7-day free trial followed by a $7.99 monthly subscription.
The signup form sends members to a server-side Stripe Checkout session.

Before publishing this version, add these secret production environment variables in Netlify:
- STRIPE_SECRET_KEY
- STRIPE_PRICE_ID

STRIPE_PRICE_ID must reference the recurring $7.99/month Jackpot JAX Price in Stripe.
Do not publish the paid checkout until both values are configured and tested in Stripe test mode.

import type { Config } from "@netlify/functions";
import Stripe from "stripe";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

const jsonResponse = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store" },
});

const readEmail = async (req: Request) => {
  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const submitted = await req.json() as { email?: unknown };
      return typeof submitted.email === "string" ? submitted.email.trim() : "";
    }

    const submitted = new URLSearchParams(await req.text());
    return submitted.get("email")?.trim() || "";
  } catch {
    return null;
  }
};

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  const stripeSecretKey = Netlify.env.get("STRIPE_SECRET_KEY");
  const stripePriceId = Netlify.env.get("STRIPE_PRICE_ID");

  if (!stripeSecretKey || !stripePriceId) {
    return jsonResponse(
      { error: "Paid checkout is not active yet. Please try again later." },
      503,
    );
  }

  const email = await readEmail(req);
  if (email === null) {
    return jsonResponse({ error: "The checkout request was not valid." }, 400);
  }

  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(email)
  ) {
    return jsonResponse({ error: "Please enter a valid email address." }, 400);
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-08-26.dahlia",
    maxNetworkRetries: 2,
  });

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      branding_settings: {
        background_color: "#08111D",
        border_style: "rounded",
        button_color: "#C58F2D",
        display_name: "Jackpot JAX",
        font_family: "inter",
      },
      customer_email: email.toLowerCase(),
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: "subscription",
      payment_method_collection: "always",
      payment_method_types: ["card"],
      redirect_on_completion: "never",
      subscription_data: { trial_period_days: 7 },
      ui_mode: "embedded_page",
      wallet_options: { link: { display: "never" } },
    });

    if (!checkoutSession.client_secret) {
      throw new Error("Stripe did not return a Checkout client secret.");
    }

    return jsonResponse({ clientSecret: checkoutSession.client_secret });
  } catch (error) {
    const stripeError = error as {
      code?: string;
      statusCode?: number;
      type?: string;
    };
    console.error("Stripe Checkout Session creation failed", {
      code: stripeError.code,
      status: stripeError.statusCode,
      type: stripeError.type,
    });

    return jsonResponse(
      { error: "We couldn’t start secure checkout. Please try again in a moment." },
      502,
    );
  }
};

export const config: Config = {
  path: "/api/create-checkout-session",
};

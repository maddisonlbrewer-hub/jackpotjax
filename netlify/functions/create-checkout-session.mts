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
    return Response.json(
      { error: "Paid checkout is not active yet. Please try again later." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentType = req.headers.get("content-type") || "";
  let email: string | undefined;

  if (contentType.includes("application/json")) {
    const submitted = await req.json() as { email?: string };
    email = submitted.email?.trim();
  } else {
    const submitted = new URLSearchParams(await req.text());
    email = submitted.get("email")?.trim();
  }

  if (!email) {
    return Response.json(
      { error: "Please enter an email address." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const checkoutParams = new URLSearchParams({
    "allow_promotion_codes": "true",
    "branding_settings[background_color]": "#08111D",
    "branding_settings[border_style]": "rounded",
    "branding_settings[button_color]": "#C58F2D",
    "branding_settings[display_name]": "Jackpot JAX",
    "branding_settings[font_family]": "inter",
    "customer_email": email,
    "line_items[0][price]": stripePriceId,
    "line_items[0][quantity]": "1",
    "mode": "subscription",
    "payment_method_collection": "always",
    "payment_method_types[0]": "card",
    "redirect_on_completion": "never",
    "subscription_data[trial_period_days]": "7",
    "ui_mode": "embedded_page",
    "wallet_options[link][display]": "never",
  });

  const stripeResponse = await fetch(
    "https://api.stripe.com/v1/checkout/sessions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: checkoutParams,
    },
  );

  const checkoutSession = await stripeResponse.json() as {
    client_secret?: string;
    error?: { code?: string; type?: string };
  };

  if (!stripeResponse.ok || !checkoutSession.client_secret) {
    console.error("Stripe Checkout Session creation failed", {
      code: checkoutSession.error?.code,
      status: stripeResponse.status,
      type: checkoutSession.error?.type,
    });

    return Response.json(
      { error: "We couldn’t start secure checkout. Please try again in a moment." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json({ clientSecret: checkoutSession.client_secret }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
};

export const config = {
  path: "/api/create-checkout-session",
};

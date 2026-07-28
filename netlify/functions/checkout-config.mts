export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET" },
    });
  }

  const publishableKey = Netlify.env.get("STRIPE_PUBLISHABLE_KEY");

  if (!publishableKey?.startsWith("pk_")) {
    return Response.json(
      { error: "Secure checkout is not active yet." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json({ publishableKey }, {
    headers: { "Cache-Control": "no-store" },
  });
};

export const config = {
  path: "/api/checkout-config",
};

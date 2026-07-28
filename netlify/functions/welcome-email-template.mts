import type { Config, Context } from "@netlify/functions";
import { buildWelcomeEmail } from "./_shared/welcome-email.mts";

export default async (req: Request, context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET" },
    });
  }

  const previewTrialEnd = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
  const message = buildWelcomeEmail(previewTrialEnd.toISOString());

  return new Response(message.html, {
    headers: {
      "Cache-Control": context.deploy.context === "production"
        ? "public, max-age=0, must-revalidate"
        : "no-store",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
};

export const config: Config = {
  path: "/welcome-email-template",
};

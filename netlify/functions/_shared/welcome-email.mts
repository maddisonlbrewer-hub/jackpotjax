import { getStore } from "@netlify/blobs";

export const SUBSCRIBER_STORE_NAME = "jackpot-jax-subscribers";

export type WelcomeEmailSubscriber = {
  stripeSubscriptionId: string;
  email: string | null;
  accessActive: boolean;
  stripeLivemode: boolean;
  trialEndsAt: string | null;
};

type WelcomeEmailStatus =
  | "failed"
  | "not_configured"
  | "sent"
  | "suppressed_test_mode";

type WelcomeEmailState = {
  status: WelcomeEmailStatus;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt?: string;
  lastError?: string;
  providerMessageId?: string;
  sentAt?: string;
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const formatTrialEnd = (trialEndsAt: string | null) => {
  if (!trialEndsAt) {
    return null;
  }

  const date = new Date(trialEndsAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(date);
};

export const buildWelcomeEmail = (trialEndsAt: string | null) => {
  const formattedTrialEnd = formatTrialEnd(trialEndsAt);
  const billingSentence = formattedTrialEnd
    ? `Your first 7 days are free. After that, your membership renews for $7.99 a month unless you cancel before ${formattedTrialEnd}.`
    : "Your first 7 days are free. After that, your membership renews for $7.99 a month unless you cancel.";
  const safeBillingSentence = escapeHtml(billingSentence);

  return {
    subject: "Welcome to Jackpot JAX — your 7-day trial is live",
    text: [
      "WELCOME TO JACKPOT JAX",
      "",
      "You hit the Jackpot.",
      "",
      "Jacksonville’s best sales, new openings, estate finds, and hidden local deals are now headed straight to your inbox.",
      "",
      billingSentence,
      "",
      "WHAT HAPPENS NEXT",
      "1. We search Jacksonville — We uncover worthwhile deals and local finds across Northeast Florida.",
      "2. We check the details — We verify the important information so you know what to expect.",
      "3. You get the inside scoop — The best finds are delivered straight to your inbox.",
      "",
      "Preview your member deal drop: https://jackpotjax.co/newsletter-template",
      "",
      "Your next Jackpot could be right around the corner.",
      "",
      "Jackpot JAX · Jacksonville, Florida",
      "You received this email because you started a Jackpot JAX membership.",
    ].join("\n"),
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Welcome to Jackpot JAX</title>
</head>
<body style="margin:0;padding:0;background:#08111d;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your Jackpot JAX membership is active. Your next Jackpot could be right around the corner.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#08111d;">
    <tr>
      <td align="center" style="padding:24px 12px 44px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#111b29;border:1px solid #243347;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 24px;background:#c58f2d;color:#171513;font-size:11px;font-weight:700;letter-spacing:1.5px;text-align:center;text-transform:uppercase;">
              Welcome to Jackpot JAX
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 26px;background:#0b1420;color:#ffffff;text-align:center;">
              <div style="margin:0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;letter-spacing:1px;white-space:nowrap;">
                Jackpot <span style="color:#c58f2d;">JAX</span>
              </div>
              <div style="margin-top:8px;color:#9ba8b8;font-size:10px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;">
                Jacksonville, Florida
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:48px 40px 36px;background:#111b29;color:#ffffff;text-align:center;">
              <div style="color:#c58f2d;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;">
                Your 7-day free trial starts now
              </div>
              <h1 style="margin:16px 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.12;font-weight:700;">
                You hit the Jackpot.
              </h1>
              <p style="max-width:520px;margin:0 auto;color:#c9d1db;font-size:16px;line-height:1.7;">
                Jacksonville’s best sales, new openings, estate finds, and hidden local deals are now headed straight to your inbox.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 34px;background:#111b29;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#162334;border:1px solid #2a3b50;border-collapse:collapse;">
                <tr>
                  <td style="padding:24px 26px;color:#ffffff;text-align:center;">
                    <div style="color:#c58f2d;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Membership details</div>
                    <p style="margin:10px 0 0;color:#d9e0e8;font-size:14px;line-height:1.7;">${safeBillingSentence}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 34px 14px;background:#f7f2e8;color:#171513;">
              <div style="color:#9f6d1f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                What happens next
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:12px;border-collapse:collapse;">
                <tr>
                  <td width="40" valign="top" style="padding:14px 0;color:#c58f2d;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;">01</td>
                  <td style="padding:14px 0;border-bottom:1px solid #e2d8c8;">
                    <strong style="font-size:15px;">We search Jacksonville</strong>
                    <p style="margin:5px 0 0;color:#6b645c;font-size:13px;line-height:1.6;">We uncover worthwhile deals and local finds across Northeast Florida.</p>
                  </td>
                </tr>
                <tr>
                  <td width="40" valign="top" style="padding:14px 0;color:#c58f2d;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;">02</td>
                  <td style="padding:14px 0;border-bottom:1px solid #e2d8c8;">
                    <strong style="font-size:15px;">We check the details</strong>
                    <p style="margin:5px 0 0;color:#6b645c;font-size:13px;line-height:1.6;">We verify the important information so you know what to expect.</p>
                  </td>
                </tr>
                <tr>
                  <td width="40" valign="top" style="padding:14px 0;color:#c58f2d;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;">03</td>
                  <td style="padding:14px 0;">
                    <strong style="font-size:15px;">You get the inside scoop</strong>
                    <p style="margin:5px 0 0;color:#6b645c;font-size:13px;line-height:1.6;">The best finds are delivered straight to your inbox.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 34px 40px;background:#f7f2e8;text-align:center;">
              <a href="https://jackpotjax.co/newsletter-template" style="display:inline-block;padding:15px 24px;background:#c58f2d;color:#171513;font-size:13px;font-weight:700;text-decoration:none;">
                Preview Your Member Deal Drop
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 34px 34px;background:#0b1420;color:#8f9bab;font-size:11px;line-height:1.65;text-align:center;">
              <p style="margin:0 0 8px;color:#c58f2d;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;">Your next Jackpot could be right around the corner.</p>
              <p style="margin:0 0 8px;">Jackpot JAX · Jacksonville, Florida</p>
              <p style="margin:0;">You received this email because you started a Jackpot JAX membership.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
};

const getWelcomeEmailState = async (subscriptionId: string) => {
  const store = getStore(SUBSCRIBER_STORE_NAME, { consistency: "strong" });
  return await store.get(`welcome-emails/${subscriptionId}`, {
    type: "json",
  }) as WelcomeEmailState | null;
};

const saveWelcomeEmailState = async (
  subscriptionId: string,
  state: WelcomeEmailState,
) => {
  const store = getStore(SUBSCRIBER_STORE_NAME, { consistency: "strong" });
  await store.setJSON(`welcome-emails/${subscriptionId}`, state);
};

const deleteWelcomeEmailQueueItem = async (subscriptionId: string) => {
  const store = getStore(SUBSCRIBER_STORE_NAME, { consistency: "strong" });
  await store.delete(`welcome-email-queue/${subscriptionId}`);
};

export const queueWelcomeEmail = async (
  subscriber: WelcomeEmailSubscriber,
) => {
  if (!subscriber.email || !subscriber.accessActive) {
    await deleteWelcomeEmailQueueItem(subscriber.stripeSubscriptionId);
    return;
  }

  const existing = await getWelcomeEmailState(subscriber.stripeSubscriptionId);
  if (existing?.status === "sent") {
    return;
  }

  const store = getStore(SUBSCRIBER_STORE_NAME, { consistency: "strong" });
  await store.setJSON(
    `welcome-email-queue/${subscriber.stripeSubscriptionId}`,
    subscriber,
  );
};

export const isWelcomeEmailConfigured = () => Boolean(
  Netlify.env.get("RESEND_API_KEY") && Netlify.env.get("WELCOME_EMAIL_FROM"),
);

export const deliverWelcomeEmail = async (
  subscriber: WelcomeEmailSubscriber,
) => {
  if (!subscriber.email || !subscriber.accessActive) {
    await deleteWelcomeEmailQueueItem(subscriber.stripeSubscriptionId);
    return { status: "ineligible" as const };
  }

  const existing = await getWelcomeEmailState(subscriber.stripeSubscriptionId);
  if (existing?.status === "sent") {
    await deleteWelcomeEmailQueueItem(subscriber.stripeSubscriptionId);
    return { status: "already_sent" as const };
  }

  const now = new Date().toISOString();
  const createdAt = existing?.createdAt || now;
  const allowTestMode = Netlify.env.get("WELCOME_EMAIL_ALLOW_TEST_MODE") === "true";

  if (!subscriber.stripeLivemode && !allowTestMode) {
    await saveWelcomeEmailState(subscriber.stripeSubscriptionId, {
      status: "suppressed_test_mode",
      attemptCount: existing?.attemptCount || 0,
      createdAt,
      updatedAt: now,
    });
    await deleteWelcomeEmailQueueItem(subscriber.stripeSubscriptionId);
    return { status: "suppressed_test_mode" as const };
  }

  const apiKey = Netlify.env.get("RESEND_API_KEY");
  const from = Netlify.env.get("WELCOME_EMAIL_FROM");
  const replyTo = Netlify.env.get("WELCOME_EMAIL_REPLY_TO");

  if (!apiKey || !from) {
    await saveWelcomeEmailState(subscriber.stripeSubscriptionId, {
      status: "not_configured",
      attemptCount: existing?.attemptCount || 0,
      createdAt,
      updatedAt: now,
    });
    return { status: "not_configured" as const };
  }

  const attemptCount = (existing?.attemptCount || 0) + 1;
  const message = buildWelcomeEmail(subscriber.trialEndsAt);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `welcome-email/${subscriber.stripeSubscriptionId}`,
      },
      body: JSON.stringify({
        from,
        to: [subscriber.email],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    const result = await response.json() as { id?: string; message?: string };

    if (!response.ok || !result.id) {
      throw new Error(result.message || `Email provider returned ${response.status}`);
    }

    const sentAt = new Date().toISOString();
    await saveWelcomeEmailState(subscriber.stripeSubscriptionId, {
      status: "sent",
      attemptCount,
      createdAt,
      updatedAt: sentAt,
      lastAttemptAt: sentAt,
      providerMessageId: result.id,
      sentAt,
    });
    await deleteWelcomeEmailQueueItem(subscriber.stripeSubscriptionId);

    return { status: "sent" as const, providerMessageId: result.id };
  } catch (error) {
    const failedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : "Unknown email error";
    await saveWelcomeEmailState(subscriber.stripeSubscriptionId, {
      status: "failed",
      attemptCount,
      createdAt,
      updatedAt: failedAt,
      lastAttemptAt: failedAt,
      lastError: message.slice(0, 500),
    });

    console.error("Welcome email delivery failed", {
      stripeSubscriptionId: subscriber.stripeSubscriptionId,
      message,
    });
    return { status: "failed" as const };
  }
};

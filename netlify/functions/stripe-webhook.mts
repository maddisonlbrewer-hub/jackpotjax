import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";
import Stripe from "stripe";
import {
  deliverWelcomeEmail,
  queueWelcomeEmail,
  SUBSCRIBER_STORE_NAME,
} from "./_shared/welcome-email.mts";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

type SubscriberRecord = {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeLivemode: boolean;
  email: string | null;
  status: Stripe.Subscription.Status;
  accessActive: boolean;
  priceId: string | null;
  productId: string | null;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastStripeEventId: string;
  lastStripeEventType: string;
};

const unixTimeToIso = (timestamp?: number | null) =>
  timestamp ? new Date(timestamp * 1000).toISOString() : null;

const getCustomerId = (customer: string | Stripe.Customer | Stripe.DeletedCustomer) =>
  typeof customer === "string" ? customer : customer.id;

const getCustomerEmail = async (
  stripe: Stripe,
  customerId: string,
  preferredEmail?: string | null,
) => {
  if (preferredEmail) {
    return preferredEmail.trim().toLowerCase();
  }

  const customer = await stripe.customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) {
    return null;
  }

  return (customer as Stripe.Customer).email?.trim().toLowerCase() || null;
};

const saveSubscription = async ({
  stripe,
  subscription,
  event,
  preferredEmail,
}: {
  stripe: Stripe;
  subscription: Stripe.Subscription;
  event: Stripe.Event;
  preferredEmail?: string | null;
}) => {
  const store = getStore(SUBSCRIBER_STORE_NAME, { consistency: "strong" });
  const key = `subscriptions/${subscription.id}`;
  const existing = await store.get(key, { type: "json" }) as SubscriberRecord | null;
  const customerId = getCustomerId(subscription.customer);
  const email = await getCustomerEmail(
    stripe,
    customerId,
    preferredEmail || existing?.email,
  );
  const firstItem = subscription.items.data[0];
  const periodEnd = (
    subscription as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end || (
    firstItem as typeof firstItem & { current_period_end?: number }
  )?.current_period_end;
  const now = new Date().toISOString();

  const record: SubscriberRecord = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripeLivemode: event.livemode,
    email,
    status: subscription.status,
    accessActive: ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status),
    priceId: firstItem?.price.id || null,
    productId: typeof firstItem?.price.product === "string"
      ? firstItem.price.product
      : firstItem?.price.product?.id || null,
    trialEndsAt: unixTimeToIso(subscription.trial_end),
    currentPeriodEndsAt: unixTimeToIso(periodEnd),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: unixTimeToIso(subscription.canceled_at),
    createdAt: existing?.createdAt || unixTimeToIso(subscription.created) || now,
    updatedAt: now,
    lastStripeEventId: event.id,
    lastStripeEventType: event.type,
  };

  await store.setJSON(key, record);
  return record;
};

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  if (context.deploy.context !== "production") {
    return new Response("Not found", { status: 404 });
  }

  const stripeSecretKey = Netlify.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Netlify.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");

  if (!stripeSecretKey || !webhookSecret || !signature) {
    return new Response("Webhook is not configured", { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return new Response("Invalid signature", { status: 400 });
  }

  const store = getStore(SUBSCRIBER_STORE_NAME, { consistency: "strong" });
  const eventKey = `events/${event.id}`;

  if (await store.get(eventKey)) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const subscriber = await saveSubscription({
            stripe,
            subscription,
            event,
            preferredEmail: session.customer_details?.email || session.customer_email,
          });
          await queueWelcomeEmail(subscriber);
          context.waitUntil(deliverWelcomeEmail(subscriber));
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        {
          const subscriber = await saveSubscription({
            stripe,
            subscription: event.data.object as Stripe.Subscription,
            event,
          });
          await queueWelcomeEmail(subscriber);
          context.waitUntil(deliverWelcomeEmail(subscriber));
        }
        break;

      default:
        break;
    }

    await store.setJSON(eventKey, {
      type: event.type,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stripe webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return new Response("Webhook processing failed", { status: 500 });
  }

  return Response.json({ received: true });
};

export const config: Config = {
  path: "/api/stripe-webhook",
};

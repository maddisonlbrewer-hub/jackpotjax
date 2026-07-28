import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";
import {
  deliverWelcomeEmail,
  isWelcomeEmailConfigured,
  SUBSCRIBER_STORE_NAME,
  type WelcomeEmailSubscriber,
} from "./_shared/welcome-email.mts";

const BATCH_SIZE = 100;
const CONCURRENCY = 4;

export default async (_req: Request, context: Context) => {
  if (context.deploy.context !== "production" || !isWelcomeEmailConfigured()) {
    return;
  }

  const store = getStore(SUBSCRIBER_STORE_NAME, { consistency: "strong" });
  const { blobs } = await store.list({ prefix: "welcome-email-queue/" });
  const subscriptions: WelcomeEmailSubscriber[] = [];

  for (const blob of blobs.slice(0, BATCH_SIZE)) {
    const subscriber = await store.get(blob.key, { type: "json" }) as
      | WelcomeEmailSubscriber
      | null;
    if (subscriber) {
      subscriptions.push(subscriber);
    }
  }

  for (let index = 0; index < subscriptions.length; index += CONCURRENCY) {
    const batch = subscriptions.slice(index, index + CONCURRENCY);
    await Promise.all(batch.map((subscriber) => deliverWelcomeEmail(subscriber)));
  }
};

export const config: Config = {
  schedule: "*/15 * * * *",
};

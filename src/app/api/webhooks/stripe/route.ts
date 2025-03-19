import { headers } from "next/headers";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;

      await convex.mutation(api.stripe.updateSubscription, {
        subscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end,
        isActive: subscription.cancel_at_period_end ? true : false,
      });
    }

    // Handling subscription cancellations or deletions
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      await convex.mutation(api.stripe.updateSubscription, {
        subscriptionId: subscription.id,
        isActive: false,
        currentPeriodEnd: subscription.current_period_end,
      });
    }

    // Handling successful payments (for recurring payments)
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      await convex.mutation(api.stripe.updateSubscription, {
        subscriptionId: invoice.subscription as string,
        currentPeriodEnd: invoice.period_end,
        isActive: true,
      });
    }

    // Handling failed payments
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;

      await convex.mutation(api.stripe.updateSubscription, {
        subscriptionId: invoice.subscription as string,
        isActive: false, // or you may want to mark it as "past due"
        currentPeriodEnd: invoice.period_end,
      });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }
}

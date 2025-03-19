import { v } from "convex/values";
import {
  mutation,
  query,
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import Stripe from "stripe";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const getStripeInstance = () => {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error("NO stripe secret key found");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
};

export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
    baseUrl: v.string(),
  },
  handler: async (ctx, { priceId, baseUrl }) => {
    const stripe = getStripeInstance();
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not found");
    }

    if (!baseUrl) {
      throw new Error(`NEXT_PUBLIC_URL is not set in the environment.`);
    }

    const existingSubscription = await ctx.runQuery(
      internal.stripe.getByUserIdInternal,
      { userId }
    );

    if (
      existingSubscription?.isActive &&
      existingSubscription.stripeCurrentPeriodEnd > Date.now() / 1000
    ) {
      throw new Error("User already has an active subscription");
    }

    let customerId: string;
    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: identity.email,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription`,
      metadata: {
        userId: userId,
      },
    });

    return session.url;
  },
});

export const getByUserIdInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Only get the most recent subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .first();

    return subscription;
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Only get the most recent subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .first();

    return subscription;
  },
});

export const verifySubscription = action({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, { sessionId }) => {
    const stripe = getStripeInstance();
    const identity = await ctx.auth.getUserIdentity();
    const userId = await auth.getUserId(ctx);

    if (!identity || !userId) {
      throw new Error("Not authenticated");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      throw new Error("No session found");
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await ctx.runMutation(internal.stripe.removeExistingSubscription, {
      userId: session.metadata?.userId as Id<"users">,
    });
    await ctx.runMutation(internal.stripe.addSubscriptions, {
      session,
      subscription,
    });
  },
});

export const removeExistingSubscription = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existingSubscriptions = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    for (const subscription of existingSubscriptions) {
      await ctx.db.delete(subscription._id);
    }
  },
});

export const addSubscriptions = internalMutation({
  args: { subscription: v.any(), session: v.any() },
  handler: async (ctx, args) => {
    const { session, subscription } = args;

    await ctx.db.insert("subscriptions", {
      userId: session.metadata?.userId as Id<"users">,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: subscription.current_period_end,
      isActive: true,
    });
  },
});

export const isSubscribed = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    let userId = await auth.getUserId(ctx);
    if (!userId) return false;
    if (args.userId) {
      userId = args.userId;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .first();

    if (!subscription) return false;

    return (
      subscription.stripeCurrentPeriodEnd > Date.now() / 1000 &&
      subscription.isActive
    );
  },
});

export const updateSubscription = mutation({
  args: {
    subscriptionId: v.string(),
    currentPeriodEnd: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, { subscriptionId, currentPeriodEnd, isActive }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("stripeSubscriptionId"), subscriptionId))
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (isActive) {
      await ctx.db
        .query("subscriptions")
        .filter((q) => q.eq(q.field("userId"), subscription.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .filter((q) => q.neq(q.field("_id"), subscription._id))
        .collect()
        .then((subscriptions) =>
          Promise.all(
            subscriptions.map((sub) =>
              ctx.db.patch(sub._id, {
                isActive: false,
                stripeCurrentPeriodEnd: Math.floor(Date.now() / 1000),
              })
            )
          )
        );
    }

    await ctx.db.patch(subscription._id, {
      stripeCurrentPeriodEnd: currentPeriodEnd,
      isActive,
    });
  },
});

export const getRemainingTime = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .first();

    if (!subscription) return null;

    const currentPeriodEnd = subscription.stripeCurrentPeriodEnd;
    const remainingTimeInSeconds =
      currentPeriodEnd - Math.floor(Date.now() / 1000);
    const daysRemaining = Math.floor(remainingTimeInSeconds / (60 * 60 * 24));

    return { daysRemaining };
  },
});

export const createPortalLink = action({
  args: { customerId: v.string(), returnUrl: v.string() },
  handler: async (ctx, args) => {
    const stripe = getStripeInstance();

    const session = await stripe.billingPortal.sessions.create({
      customer: args.customerId,
      return_url: args.returnUrl,
    });

    return session.url;
  },
});

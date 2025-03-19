import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { auth } from "./auth";

const cleanExpiredStatus = (status: Doc<"usersStatus">) => {
  if (
    status.customStatusExpiresAt &&
    status.customStatusExpiresAt < Date.now()
  ) {
    return {
      ...status,
      customStatusEmoji: "",
      userNote: "",
      customStatusExpiresAt: undefined,
    };
  }
  return status;
};

export const getUserStatus = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (args.userId == undefined || !args.userId) {
      return undefined;
    }
    const status = await ctx.db
      .query("usersStatus")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId!))
      .first();

    if (!status) {
      return null;
    }

    status.currentStatus = status.hasForcedOffline
      ? "offline"
      : status.currentStatus;
    return cleanExpiredStatus(status);
  },
});

export const createUserStatus = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (args.userId == undefined || !args.userId) {
      return undefined;
    }
    const status = await ctx.db
      .query("usersStatus")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId!))
      .first();

    if (!status) {
      return ctx.db.insert("usersStatus", {
        userId: args.userId,
        currentStatus: "offline",
      });
    }
  },
});

export const updateUserStatus = mutation({
  args: {
    customStatusEmoji: v.optional(v.string()),
    userNote: v.optional(v.string()),
    expiresAt: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const status = await ctx.db
      .query("usersStatus")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!status) {
      return ctx.db.insert("usersStatus", {
        userId,
        customStatusEmoji: args.customStatusEmoji,
        userNote: args.userNote,
        customStatusExpiresAt: args.expiresAt,
        currentStatus: "online",
      });
    }

    return ctx.db.patch(status._id, {
      customStatusEmoji: args.customStatusEmoji,
      userNote: args.userNote,
      customStatusExpiresAt: args.expiresAt,
    });
  },
});

export const updateCurrentStatus = mutation({
  args: {
    userId: v.id("users"),
    currentStatus: v.union(v.literal("online"), v.literal("offline")),
  },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("usersStatus")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!status) {
      return ctx.db.insert("usersStatus", {
        userId: args.userId,
        currentStatus: args.currentStatus,
      });
    }

    return ctx.db.patch(status._id, {
      currentStatus: args.currentStatus,
      lastSeen: args.currentStatus == "offline" ? Date.now() : undefined,
    });
  },
});

export const updateForcedOffline = mutation({
  args: {
    hasForcedOffline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const status = await ctx.db
      .query("usersStatus")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!status) {
      return ctx.db.insert("usersStatus", {
        userId: userId,
        hasForcedOffline: args.hasForcedOffline,
        currentStatus: "offline",
      });
    }

    const updates: Partial<Doc<"usersStatus">> = {
      hasForcedOffline: args.hasForcedOffline,
    };

    if (!args.hasForcedOffline) {
      updates.currentStatus = "online";
    } else {
      updates.currentStatus = "offline";
    }

    return ctx.db.patch(status._id, updates);
  },
});

export const getOnlineUsers = query({
  handler: async (ctx) => {
    const statuses = await ctx.db
      .query("usersStatus")
      .withIndex("by_status_forcedOffline", (q) =>
        q.eq("currentStatus", "online").eq("hasForcedOffline", false)
      )
      .collect();

    return statuses.map(cleanExpiredStatus);
  },
});

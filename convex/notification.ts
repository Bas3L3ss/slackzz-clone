import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("system")
    ),
    source: v.union(
      v.literal("mention"),
      v.literal("subscription"),
      v.literal("system"),
      v.literal("workspace"),
      v.literal("channel"),
      v.literal("direct_message")
    ),
    title: v.string(),
    message: v.string(),
    metadata: v.optional(
      v.object({
        workspaceId: v.optional(v.id("workspaces")),
        channelId: v.optional(v.id("channels")),
        messageId: v.optional(v.id("messages")),
        mentionedBy: v.optional(v.id("members")),
        subscriptionId: v.optional(v.string()),
        url: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const createMentionNotification = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    messageId: v.id("messages"),
    memberId: v.id("members"),
  },
  handler: async (ctx, args): Promise<Id<"notifications"> | null> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized user is creating notification");
    const user = await ctx.db.get(userId);
    if (!user)
      throw new Error(
        "Authorized user record when creating notification is not found"
      );
    const currentMember: Doc<"members"> | null | undefined = await ctx.runQuery(
      api.members.current,
      {
        workspaceId: args.workspaceId,
      }
    );
    if (!currentMember) throw new Error("Mentioning member not found");

    const userBeingMentioned = await ctx.db.get(args.memberId);
    if (!userBeingMentioned) throw new Error("Mentioned member not found");

    return await ctx.db.insert("notifications", {
      userId: userBeingMentioned.userId,
      type: "info",
      source: "mention",
      title: "A mention!",
      message: `You were mentioned by ${user.name}`,
      metadata: {
        workspaceId: args.workspaceId,
        channelId: args.channelId,
        messageId: args.messageId,
        mentionedBy: currentMember._id,
        url: `/workspace/${args.workspaceId}${
          args.channelId ? `/channel/${args.channelId}` : ""
        }?messageId=${args.messageId}`,
      },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const createSubscriptionNotification = mutation({
  args: {
    userId: v.id("users"),
    success: v.boolean(),
    subscriptionId: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.success ? "success" : "error",
      source: "subscription",
      title: args.success ? "Subscription Activated" : "Subscription Failed",
      message:
        args.message ||
        (args.success
          ? "Your subscription has been successfully activated"
          : "There was an issue with your subscription"),
      metadata: {
        subscriptionId: args.subscriptionId,
        url: "/settings/billing",
      },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id_read", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    await Promise.all(
      notifications.map((notification) =>
        ctx.db.patch(notification._id, {
          isRead: true,
        })
      )
    );
  },
});

export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.notificationId);
  },
});

export const deleteAllNotification = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    await Promise.all(
      notifications.map((notification) => ctx.db.delete(notification._id))
    );
  },
});

// Get unread count
export const getUnreadCount = query({
  args: {
    workspaceId: v.id("workspaces"),
  },

  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .filter((q) => q.eq(q.field("metadata.workspaceId"), args.workspaceId))
      .collect();

    return unreadNotifications.length;
  },
});
export const getWorkspaceNotifications = query({
  args: {
    workspaceId: v.id("workspaces"),
    type: v.optional(
      v.union(
        v.literal("info"),
        v.literal("success"),
        v.literal("warning"),
        v.literal("error"),
        v.literal("system")
      )
    ),
    source: v.optional(
      v.union(
        v.literal("mention"),
        v.literal("subscription"),
        v.literal("system"),
        v.literal("workspace"),
        v.literal("channel"),
        v.literal("direct_message")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    let query = ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("metadata.workspaceId"), args.workspaceId),
          q.eq(q.field("metadata.workspaceId"), undefined)
        )
      );
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.source) {
      query = query.filter((q) => q.eq(q.field("source"), args.source));
    }

    if (args.startDate) {
      query = query.filter((q) => q.gte(q.field("createdAt"), args.startDate!));
    }

    if (args.endDate) {
      query = query.filter((q) => q.lte(q.field("createdAt"), args.endDate!));
    }

    if (args.unreadOnly) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }

    return await query.order("desc").take(args.limit ?? 50);
  },
});

export const markNotificationAsReadOnView = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found or unauthorized");
    }

    if (!notification.isRead) {
      await ctx.db.patch(args.notificationId, {
        isRead: true,
      });
    }
  },
});

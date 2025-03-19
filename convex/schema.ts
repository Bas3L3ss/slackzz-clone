import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  usersStatus: defineTable({
    userId: v.id("users"),
    userNote: v.optional(v.string()),
    currentStatus: v.union(v.literal("online"), v.literal("offline")),
    customStatusEmoji: v.optional(v.string()),
    customStatusExpiresAt: v.optional(v.union(v.number(), v.null())),
    hasForcedOffline: v.optional(v.boolean()),
    lastSeen: v.optional(v.number()),
  })
    .index("by_user_id", ["userId"])
    .index("by_status_forcedOffline", ["currentStatus", "hasForcedOffline"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),
    stripeSubscriptionId: v.string(),
    stripeCurrentPeriodEnd: v.number(),
    isActive: v.boolean(),
  }),

  workspaces: defineTable({
    name: v.string(),
    userId: v.id("users"),
    joinCode: v.string(),
    imageUrl: v.optional(v.string()),
  }),
  members: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    role: v.union(v.literal("admin"), v.literal("member")),
  })
    .index("by_user_id", ["userId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_workspace_id_user_id", ["userId", "workspaceId"]),

  channels: defineTable({
    name: v.string(),
    workspaceId: v.id("workspaces"),
  }).index("by_workspace_id", ["workspaceId"]),

  conversations: defineTable({
    workspaceId: v.id("workspaces"),
    memberOneId: v.id("members"),
    memberTwoId: v.id("members"),
  }).index("by_workspace_id", ["workspaceId"]),

  messages: defineTable({
    body: v.string(),
    image: v.optional(v.array(v.string())),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    parentMessageId: v.optional(v.id("messages")),
    conversationId: v.optional(v.id("conversations")),
    updatedAt: v.optional(v.number()),
    hasReplies: v.optional(v.boolean()),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"])
    .index("by_channel_id", ["channelId"])
    .index("by_conversation_id", ["conversationId"])
    .index("by_parent_message_id", ["parentMessageId"])
    .index("by_channel_id_parent_message_id_conversation_id", [
      "channelId",
      "parentMessageId",
      "conversationId",
    ]),

  reactions: defineTable({
    workspaceId: v.id("workspaces"),
    messageId: v.id("messages"),
    memberId: v.id("members"),
    value: v.string(),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"])
    .index("by_message_id", ["messageId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    source: v.union(
      v.literal("mention"),
      v.literal("subscription"),
      v.literal("system"),
      v.literal("workspace"),
      v.literal("channel"),
      v.literal("direct_message")
    ),
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
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_type", ["userId", "type"])
    .index("by_user_id_source", ["userId", "source"])
    .index("by_user_id_read", ["userId", "isRead"])
    .index("by_creation_date", ["createdAt"]),
});

export default schema;

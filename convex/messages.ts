import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { auth } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { api } from "./_generated/api";

const validateWorkspaceAccess = async (
  ctx: QueryCtx,
  workspaceId: Id<"workspaces">
) => {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const currentMember = await ctx.runQuery(api.members.current, {
    workspaceId,
  });

  if (!currentMember) {
    throw new Error("User not in workspace");
  }

  return userId;
};

export const getMember = async (
  ctx: QueryCtx,
  workspaceId: Id<"workspaces">,
  user: Id<"users">
) => {
  return await ctx.db
    .query("members")
    .withIndex("by_workspace_id_user_id", (q) =>
      q.eq("userId", user).eq("workspaceId", workspaceId)
    )
    .unique();
};

const populateUser = (ctx: QueryCtx, userId: Id<"users">) => {
  return ctx.db.get(userId);
};

const populateMember = (ctx: QueryCtx, memberId: Id<"members">) => {
  return ctx.db.get(memberId);
};

const populateReactions = (ctx: QueryCtx, messageId: Id<"messages">) => {
  return ctx.db
    .query("reactions")
    .withIndex("by_message_id", (q) => q.eq("messageId", messageId))
    .collect();
};

const populateThreads = async (ctx: QueryCtx, messageId: Id<"messages">) => {
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_parent_message_id", (q) =>
      q.eq("parentMessageId", messageId)
    )
    .collect();

  if (messages.length === 0) {
    return {
      count: 0,
      image: undefined,
      timestamp: 0,
      name: "",
    };
  }

  const lastMessage = messages[messages.length - 1];
  const lastMessageMember = await populateMember(ctx, lastMessage.memberId);

  if (!lastMessageMember)
    return {
      count: messages.length,
      image: undefined,
      timestamp: 0,
      name: "",
    };

  const lastMessageUser = await populateUser(ctx, lastMessageMember.userId);

  return {
    count: messages.length,
    image: lastMessageUser?.image,
    timestamp: lastMessage._creationTime,
    name: lastMessageUser?.name,
  };
};

export const create = mutation({
  args: {
    body: v.string(),
    image: v.optional(v.array(v.string())),
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("conversations")),
    parentMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    if (!userId) throw new Error("UnAuthorized");
    const member = await getMember(ctx, args.workspaceId, userId);
    if (!member) throw new Error("UnAuthorized");

    let conversationId = args.conversationId;

    if (args.parentMessageId && !args.conversationId && !args.channelId) {
      const parentMessage = await ctx.db.get(args.parentMessageId);
      if (!parentMessage) throw new Error("Not found");

      conversationId = parentMessage.conversationId;
    }
    if (args.parentMessageId) {
      const parentMessage = await ctx.db.get(args.parentMessageId);
      if (!parentMessage) throw new Error("Not found");
      await ctx.db.patch(parentMessage._id, { hasReplies: true });
    }

    const messageId = await ctx.db.insert("messages", {
      body: args.body,
      memberId: member._id,
      channelId: args.channelId,
      workspaceId: args.workspaceId,
      image: args.image,
      conversationId,
      parentMessageId: args.parentMessageId,
    });
    return messageId;
  },
});

export const get = query({
  args: {
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("conversations")),
    parentMessageId: v.optional(v.id("messages")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("UnAuthorized");

    let conversationId = args.conversationId;

    if (args.parentMessageId && !args.conversationId && !args.channelId) {
      const parentMessage = await ctx.db.get(args.parentMessageId);
      if (!parentMessage) throw new Error("Not found");
      conversationId = parentMessage.conversationId;
    }

    const result = await ctx.db
      .query("messages")
      .withIndex("by_channel_id_parent_message_id_conversation_id", (q) =>
        q
          .eq("channelId", args.channelId)
          .eq("parentMessageId", args.parentMessageId)
          .eq("conversationId", conversationId)
      )
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...result,
      page: (
        await Promise.all(
          result.page.map(async (message) => {
            const member = await populateMember(ctx, message.memberId);
            const user = member ? await populateUser(ctx, member.userId) : null;

            if (!user || !member) return null;

            const reactions = await populateReactions(ctx, message._id);
            const thread = await populateThreads(ctx, message._id);

            const reactionsWithCounts = reactions.map((rec) => {
              return {
                ...rec,
                count: reactions.filter((r) => r.value === rec.value).length,
              };
            });

            const dedupedReactions = reactionsWithCounts.reduce(
              (acc, rec) => {
                const existingReaction = acc.find((r) => r.value === rec.value);

                if (existingReaction) {
                  existingReaction.memberIds = Array.from(
                    new Set([...existingReaction.memberIds, rec.memberId])
                  );
                } else {
                  acc.push({ ...rec, memberIds: [rec.memberId] });
                }
                return acc;
              },
              [] as (Doc<"reactions"> & {
                count: number;
                memberIds: Id<"members">[];
              })[]
            );

            const reactionsWithoutMemberIdProperty = dedupedReactions.map(
              ({ memberId, ...rest }) => rest
            );

            return {
              ...message,
              member,
              user,
              reactions: reactionsWithoutMemberIdProperty,
              threadCount: thread.count,
              threadImage: thread.image,
              threadTimestamp: thread.timestamp,
              threadName: thread.name,
            };
          })
        )
      ).filter(
        (message): message is NonNullable<typeof message> => message != null
      ),
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("messages"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("UnAuthorized");

    const message = await ctx.db.get(args.id);
    if (!message) throw new Error("Cant find message");

    const member = await getMember(ctx, message.workspaceId, userId);
    if (!member || member._id !== message.memberId)
      throw new Error("UnAuthorized");

    await ctx.db.patch(args.id, {
      body: args.body,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});
export const remove = mutation({
  args: {
    id: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("UnAuthorized");

    const message = await ctx.db.get(args.id);
    if (!message) throw new Error("Cant find message");

    const member = await getMember(ctx, message.workspaceId, userId);
    if (!member || member._id !== message.memberId)
      throw new Error("UnAuthorized");

    await ctx.db.delete(args.id);

    if (message.parentMessageId) {
      const replies = await ctx.db
        .query("messages")
        .withIndex("by_parent_message_id", (q) =>
          q.eq("parentMessageId", message.parentMessageId)
        )
        .collect();
      if (replies.length == 0) {
        await ctx.db.patch(message.parentMessageId, {
          hasReplies: false,
        });
      }
    }

    return message.image;
  },
});

export const getById = query({
  args: {
    id: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const message = await ctx.db.get(args.id);
    if (!message) return null;

    const currentMember = await getMember(ctx, message.workspaceId, userId);
    if (!currentMember) return null;

    const member = await populateMember(ctx, message.memberId);

    if (!member) return null;

    const user = await populateUser(ctx, member.userId);

    if (!user) return null;

    const reactions = await populateReactions(ctx, message._id);

    const reactionsWithCounts = reactions.map((rec) => {
      return {
        ...rec,
        count: reactions.filter((r) => r.value === rec.value).length,
      };
    });

    const dedupedReactions = reactionsWithCounts.reduce(
      (acc, rec) => {
        const existingReaction = acc.find((r) => r.value === rec.value);

        if (existingReaction) {
          existingReaction.memberIds = Array.from(
            new Set([...existingReaction.memberIds, rec.memberId])
          );
        } else {
          acc.push({ ...rec, memberIds: [rec.memberId] });
        }
        return acc;
      },
      [] as (Doc<"reactions"> & {
        count: number;
        memberIds: Id<"members">[];
      })[]
    );

    const reactionsWithoutMemberIdProperty = dedupedReactions.map(
      ({ memberId, ...rest }) => rest
    );

    return {
      ...message,
      user,
      member: member,
      reactions: reactionsWithoutMemberIdProperty,
    };
  },
});

export const getChannelId = query({
  args: {
    messageId: v.id("messages"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    await validateWorkspaceAccess(ctx, args.workspaceId);
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      console.error("no message found");

      return null;
    }
    return message.channelId;
  },
});

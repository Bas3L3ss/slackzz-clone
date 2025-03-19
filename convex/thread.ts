import { v } from "convex/values";
import { query } from "./_generated/server";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { getMember } from "./messages";

export type ThreadSummary = {
  id: Id<"messages">;
  body: string;
  author: string;
  authorImage: string | null;
  createdAt: number;
  replyCount: number;
  participantCount: number;
  context: string;
  lastReplyAt: number;
  lastReplyAuthorName: string;
  lastReplyAuthorImage: string | null;
};

export const getAllThreads = query({
  args: {
    workspaceId: v.id("workspaces"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId || !(await getMember(ctx, args.workspaceId, userId)))
      throw new Error("Unauthorized");

    const result = await ctx.db
      .query("messages")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId)
      )
      .filter((q) => q.eq(q.field("parentMessageId"), undefined))
      .filter((q) => q.eq(q.field("hasReplies"), true))
      .order("desc")
      .paginate(args.paginationOpts);

    const threadsWithDetails = await Promise.all(
      result.page.map(async (message) => {
        const replies = await ctx.db
          .query("messages")
          .withIndex("by_parent_message_id", (q) =>
            q.eq("parentMessageId", message._id)
          )
          .collect();

        if (replies.length === 0) return null;

        const messageMember = await ctx.db.get(message.memberId);
        if (!messageMember) return null;

        const user = await ctx.db.get(messageMember.userId);
        if (!user) return null;

        const participantIds = new Set([user._id]);
        let lastReply = null;
        let lastReplyUser = null;

        for (const reply of replies) {
          const replyMember = await ctx.db.get(reply.memberId);
          if (!replyMember) continue;

          const replyUser = await ctx.db.get(replyMember.userId);
          if (!replyUser) continue;

          participantIds.add(replyUser._id);
          if (!lastReply || reply._creationTime > lastReply._creationTime) {
            lastReply = reply;
            lastReplyUser = replyUser;
          }
        }

        let context = "";
        if (message.channelId) {
          const channel = await ctx.db.get(message.channelId);
          context = channel ? `#${channel.name}` : "";
        } else if (message.conversationId) {
          context = "Direct Message";
        }

        return {
          id: message._id,
          body: message.body,
          author: user.name,
          authorImage: user.image ?? null,
          createdAt: message._creationTime,
          replyCount: replies.length,
          participantCount: participantIds.size,
          context,
          lastReplyAt: lastReply?._creationTime ?? message._creationTime,
          lastReplyAuthorName: lastReplyUser?.name ?? user.name,
          lastReplyAuthorImage: lastReplyUser?.image ?? user.image ?? null,
        };
      })
    );

    return {
      ...result,
      page: threadsWithDetails.filter(Boolean),
    };
  },
});

export const getThreadSummary = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const userId = await auth.getUserId(ctx);
    if (!userId || !(await getMember(ctx, message.workspaceId, userId)))
      throw new Error("Unauthorized");

    const messageMember = await ctx.db.get(message.memberId);
    if (!messageMember) throw new Error("Member not found");

    const originalUser = await ctx.db.get(messageMember.userId);
    if (!originalUser) throw new Error("User not found");

    const replies = await ctx.db
      .query("messages")
      .withIndex("by_parent_message_id", (q) =>
        q.eq("parentMessageId", args.messageId)
      )
      .collect();

    const participantIds = new Set([originalUser._id]);

    await Promise.all(
      replies.map(async (reply) => {
        const replyMember = await ctx.db.get(reply.memberId);
        if (!replyMember) return;

        const replyUser = await ctx.db.get(replyMember.userId);
        if (!replyUser) return;

        participantIds.add(replyUser._id);
      })
    );

    let context = "";
    if (message.channelId) {
      const channel = await ctx.db.get(message.channelId);
      context = channel ? `#${channel.name}` : "";
    } else if (message.conversationId) {
      context = "Direct Message";
    }

    return {
      originalMessage: {
        body: message.body,
        author: originalUser.name,
        createdAt: message._creationTime,
      },
      replyCount: replies.length,
      participantCount: participantIds.size,
      context,
      lastReplyAt: replies.length
        ? Math.max(...replies.map((r) => r._creationTime))
        : message._creationTime,
    };
  },
});

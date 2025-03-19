import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";

export const populateUser = (ctx: QueryCtx, id: Id<"users">) => {
  return ctx.db.get(id);
};

async function populateUserWithStatus(ctx: QueryCtx, userId: Id<"users">) {
  const user = await populateUser(ctx, userId);

  if (!user) return null;

  const userStatus = await ctx.db
    .query("usersStatus")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .unique();

  return {
    ...user,
    userStatus,
  };
}

export const get = query({
  args: {
    workspaceId: v.id("workspaces"),
    isNeedStatus: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    if (!userId) return [];

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("userId", userId).eq("workspaceId", args.workspaceId)
      )
      .unique();
    if (!member) return [];

    const data = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId)
      )
      .collect();

    const members = [];

    if (args.isNeedStatus) {
      for (const memberData of data) {
        const userWithStatus = await populateUserWithStatus(
          ctx,
          memberData.userId
        );

        if (userWithStatus) {
          members.push({
            ...memberData,
            user: userWithStatus,
          });
        }
      }
    } else {
      for (const memberData of data) {
        const user = await populateUser(ctx, memberData.userId);

        if (user) {
          members.push({
            ...memberData,
            user: user,
          });
        }
      }
    }

    return members;
  },
});

export const getById = query({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    if (!userId) return null;

    const member = await ctx.db.get(args.id);

    if (!member) return null;

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("userId", userId).eq("workspaceId", member.workspaceId)
      );
    if (!currentMember) return null;

    const user = await populateUser(ctx, member.userId);

    if (!user) return null;

    return {
      ...member,
      user,
    };
  },
});

export const current = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    if (!userId) return null;

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("userId", userId).eq("workspaceId", args.workspaceId)
      )
      .unique();
    if (!member) return null;

    return member;
  },
});

export const update = mutation({
  args: {
    id: v.id("members"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    if (!userId) throw new Error("Unauthorized");

    const member = await ctx.db.get(args.id);

    if (!member) throw new Error("Unauthorized");

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("userId", userId).eq("workspaceId", member.workspaceId)
      )
      .unique();

    if (!currentMember || currentMember.role !== "admin")
      throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      role: args.role,
    });
    return args.id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("members"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    if (!userId) throw new Error("Unauthorized");

    const member = await ctx.db.get(args.id);

    if (!member) throw new Error("Unauthorized");

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("userId", userId).eq("workspaceId", member.workspaceId)
      )
      .unique();

    if (!currentMember) throw new Error("Unauthorized");

    if (member.role === "admin") throw new Error("Can't remove admin");

    if (currentMember._id === args.id && currentMember.role === "admin") {
      throw new Error("Can't remove admin ( you're an admin )");
    }

    const [messages, reactions, conversations] = await Promise.all([
      ctx.db
        .query("messages")
        .withIndex("by_member_id", (q) => q.eq("memberId", member._id))
        .collect(),
      ctx.db
        .query("reactions")
        .withIndex("by_member_id", (q) => q.eq("memberId", member._id))
        .collect(),
      ctx.db
        .query("conversations")
        .filter((q) =>
          q.or(
            q.eq(q.field("memberOneId"), member._id),
            q.eq(q.field("memberTwoId"), member._id)
          )
        )
        .collect(),
    ]);

    for (const message of messages) await ctx.db.delete(message._id);
    for (const reaction of reactions) await ctx.db.delete(reaction._id);
    for (const conversation of conversations)
      await ctx.db.delete(conversation._id);

    await ctx.db.delete(args.id);
    return args.id;
  },
});

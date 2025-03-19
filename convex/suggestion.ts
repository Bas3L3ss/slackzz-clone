import { query } from "./_generated/server";
import { auth } from "./auth";

import { v } from "convex/values";
import { populateUser } from "./members";

export const get = query({
  args: {
    workspaceId: v.id("workspaces"),
    isNeedUser: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    if (!userId) return [];
    const result = [];
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("userId", userId).eq("workspaceId", args.workspaceId)
      )
      .unique();
    if (!member) return [];

    if (args.isNeedUser) {
      const data = await ctx.db
        .query("members")
        .withIndex("by_workspace_id", (q) =>
          q.eq("workspaceId", args.workspaceId)
        )
        .collect();
      const newMembers = [];
      for (let i = 0; i < data.length; i++) {
        const memberData = data[i];
        const user = await populateUser(ctx, memberData.userId);

        if (user) {
          if (user._id != userId)
            newMembers.push({
              id: memberData._id,
              value: user.name,
            });
        }
      }
      result.push(newMembers);
    }
    const data = await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId)
      )
      .collect();
    const newChannels = [];
    for (let i = 0; i < data.length; i++) {
      const channel = data[i];

      if (channel) {
        newChannels.push({
          id: channel._id,
          value: channel.name,
        });
      }
    }
    result.push(newChannels);
    return result;
  },
});

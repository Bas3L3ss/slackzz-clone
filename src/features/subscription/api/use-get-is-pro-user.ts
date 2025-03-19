import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const UseGetIsProUser = ({ userId }: { userId?: Id<"users"> }) => {
  const data = useQuery(api.stripe.isSubscribed, {
    userId,
  });
  const isLoading = data === undefined;
  return { data, isLoading };
};

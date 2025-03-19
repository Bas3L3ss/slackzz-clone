// hooks/use-subscription.ts
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const useSubscription = () => {
  const isSubscribed = useQuery(api.stripe.isSubscribed);

  return {
    isSubscribed: !!isSubscribed,
    isLoading: isSubscribed === undefined,
  };
};

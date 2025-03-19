import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const UseGetSubscriptionsRemainingTime = () => {
  const data = useQuery(api.stripe.getRemainingTime);
  const isLoading = data === undefined;
  return { data, isLoading };
};

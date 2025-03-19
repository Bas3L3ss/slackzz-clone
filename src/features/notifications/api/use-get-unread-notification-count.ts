import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetUnreadNotificationCountsProps {
  workspaceId: Id<"workspaces">;
}
export const UseGetUnreadNotificationCounts = ({
  workspaceId,
}: UseGetUnreadNotificationCountsProps) => {
  const data = useQuery(api.notification.getUnreadCount, {
    workspaceId,
  });
  const isLoading = data === undefined;
  return { data, isLoading };
};

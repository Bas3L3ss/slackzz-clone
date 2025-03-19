import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface useGetMembersProps {
  workspaceId: Id<"workspaces">;
  isNeedStatus?: boolean;
}

export const useGetMembers = ({
  workspaceId,
  isNeedStatus = false,
}: useGetMembersProps) => {
  const data = useQuery(api.members.get, {
    workspaceId,
    isNeedStatus: isNeedStatus,
  });
  const isLoading = data === undefined;

  return { data, isLoading };
};

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface useGetSuggestionsProps {
  workspaceId: Id<"workspaces">;
  isNeedUser: boolean;
}

export const useGetSuggestions = ({
  workspaceId,
  isNeedUser,
}: useGetSuggestionsProps) => {
  const data = useQuery(api.suggestion.get, { workspaceId, isNeedUser });
  const isLoading = data === undefined;

  return { data, isLoading };
};

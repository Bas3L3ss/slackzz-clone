import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export type GetMessagesReturnType =
  (typeof api.messages.get._returnType)["page"];

export const useGetMessageById = ({ id }: { id: Id<"messages"> }) => {
  const data = useQuery(api.messages.getById, { id });
  const isLoading = data === undefined;

  return { data, isLoading };
};

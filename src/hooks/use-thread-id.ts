import { useParams } from "next/navigation";

import { Id } from "../../convex/_generated/dataModel";

export const useThreadId = () => {
  const params = useParams();
  return params.threadId as Id<"threads">;
};

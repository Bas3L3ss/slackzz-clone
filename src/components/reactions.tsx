import React from "react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { cn } from "@/lib/utils";
import Hint from "./hint";
import EmojiPopover from "./emoji-popover";
import { MdOutlineAddReaction } from "react-icons/md";

interface ReactionsProps {
  data: Array<
    Omit<Doc<"reactions">, "memberId"> & {
      count: number;
      memberIds: Id<"members">[];
    }
  >;

  onChange: (value: string) => void;
}

const Reactions = ({ data, onChange }: ReactionsProps) => {
  const workspaceId = useWorkSpaceId();
  const { data: currentMember } = useCurrentMember({ workspaceId });

  const currentMemberId = currentMember?._id;

  if (data.length === 0 || !currentMemberId) return null;

  /* TODOS: SEE WHO REACTED  */

  return (
    <div className="flex items-center mt-1 mb-1 gap-1">
      {data.map((reaction) => {
        return (
          <Hint
            label={`${reaction.count} ${reaction.count === 1 ? "person" : "people"} reacted with ${reaction.value}`}
            key={reaction._id}
          >
            <button
              onClick={() => onChange(reaction.value)}
              className={cn(
                "h-6 px-2 rounded-full bg-slate-200/70 border border-transparent text-slate-800 flex items-center gap-x-1",
                reaction.memberIds.includes(currentMemberId) &&
                  "bg-blue-100/70 border-blue-500 text-white"
              )}
            >
              {reaction.value}{" "}
              <span
                className={cn(
                  "text-xs text-muted-foreground font-semibold",
                  reaction.memberIds.includes(currentMemberId) &&
                    "  text-blue-500"
                )}
              >
                {reaction.count}
              </span>
            </button>
          </Hint>
        );
      })}
      <EmojiPopover
        hint="Add reaction "
        onEmojiSelect={(emoji) => onChange(emoji)}
      >
        <button className="h-7 px-3 rounded-full bg-slate-200/70 border border-transparent hover:border-slate-500 text-slate-800 flex items-center gap-x-1 ">
          <MdOutlineAddReaction />
        </button>
      </EmojiPopover>
    </div>
  );
};

export default Reactions;

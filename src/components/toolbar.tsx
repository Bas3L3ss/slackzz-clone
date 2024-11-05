import React from "react";
import { Button } from "./ui/button";
import { MessageSquareTextIcon, Pencil, SmileIcon, Trash } from "lucide-react";
import Hint from "./hint";
import EmojiPopover from "./emoji-popover";

interface ToolBarProps {
  isAuthor: boolean;
  isPending: boolean;
  handleEdit: () => void;
  handleThread: () => void;
  handleDelete: () => void;
  handleReaction: (value: string) => void;
  hideThreadButton?: boolean;
}

const ToolBar = ({
  handleDelete,
  handleEdit,
  handleReaction,
  hideThreadButton,
  isPending,
  handleThread,
  isAuthor,
}: ToolBarProps) => {
  return (
    <div className="absolute top-0 right-5">
      <div className="group-hover:opacity-100  opacity-0 transition-opacity border bg-white rounded-md shadow-sm">
        <EmojiPopover
          hint="Add reaction"
          onEmojiSelect={(emoji) => {
            handleReaction(emoji.native);
          }}
        >
          <Button variant={"ghost"} size={"iconSm"} disabled={isPending}>
            <SmileIcon className="size-4" />
          </Button>
        </EmojiPopover>
        {!hideThreadButton && (
          <Hint label="Reply in thread">
            <Button
              onClick={handleThread}
              variant={"ghost"}
              size={"iconSm"}
              disabled={isPending}
            >
              <MessageSquareTextIcon className="size-4" />
            </Button>
          </Hint>
        )}
        {isAuthor && (
          <>
            <Hint label="Edit message">
              <Button
                onClick={handleEdit}
                variant={"ghost"}
                size={"iconSm"}
                disabled={isPending}
              >
                <Pencil className="size-4" />
              </Button>
            </Hint>
            <Hint label="Delete message">
              <Button
                onClick={handleDelete}
                variant={"ghost"}
                size={"iconSm"}
                disabled={isPending}
              >
                <Trash className="size-4 text-red-500" />
              </Button>
            </Hint>
          </>
        )}
      </div>
    </div>
  );
};

export default ToolBar;
import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useChannelId } from "@/hooks/use-channel-id";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import dynamic from "next/dynamic";
import Quill from "quill";
import { useRef, useState, useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useCreateMentionNotification } from "@/features/notifications/api/use-create-mention-notification";

// Dynamically import Editor with loading optimization
const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[100px] bg-gray-100 animate-pulse rounded-md" />
  ),
});

interface ChatInputProps {
  placeholder: string;
}

type CreateMessageValue = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  body: string;
  image?: string[];
};

// Memoize the URL processing function
const processMessageOps = (
  jsonBody: any,
  workspaceId: string
): [Set<string>, any[]] => {
  const userMentionSet = new Set<string>();
  const processedOps = jsonBody.ops.map((op: any) => {
    if (op.insert?.mention) {
      const { denotationChar, id } = op.insert.mention;
      if (denotationChar === "@") {
        userMentionSet.add(id);
        return {
          ...op,
          attributes: {
            color: "#1d1c1d",
            link: `${window.location.origin}${window.location.pathname}?profileMemberId=${id}`,
          },
        };
      }
      if (denotationChar === "#") {
        return {
          ...op,
          attributes: {
            color: "#1d1c1d",
            link: `/workspace/${workspaceId}/channel/${id}`,
          },
        };
      }
    }
    return op;
  });
  return [userMentionSet, processedOps];
};

const ChatInput = ({ placeholder }: ChatInputProps) => {
  const [isPending, startTransition] = useTransition();
  const [localPending, setLocalPending] = useState(false);
  const editorRef = useRef<Quill | null>(null);

  // Use optimistic updates for message creation
  const { mutate: createMessage, data: messageId } = useCreateMessage();
  const workspaceId = useWorkSpaceId();
  const channelId = useChannelId();
  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { mutate: createNotification } = useCreateMentionNotification();

  // Memoize static values
  const baseCreateMessageValue = useMemo(
    () => ({
      channelId,
      workspaceId,
    }),
    [channelId, workspaceId]
  );

  const handleSubmit = useCallback(
    async ({ body, files }: { body: string; files?: string[] }) => {
      if (!editorRef.current) return;

      setLocalPending(true);
      editorRef.current.enable(false);

      try {
        startTransition(async () => {
          const jsonBody = JSON.parse(body);
          const [userMentionSet, processedOps] = processMessageOps(
            jsonBody,
            workspaceId
          );

          const messageValue: CreateMessageValue = {
            ...baseCreateMessageValue,
            body: JSON.stringify({ ...jsonBody, ops: processedOps }),
            image: files,
          };

          const [createdMessageId] = await Promise.all([
            createMessage(messageValue, { throwError: true }),
            userMentionSet.size > 0 && messageId
              ? Promise.all(
                  Array.from(userMentionSet)
                    .filter((mention) => mention !== currentMember?._id)
                    .map((mention) =>
                      createNotification({
                        workspaceId,
                        messageId,
                        memberId: mention as Id<"members">,
                        channelId,
                      })
                    )
                )
              : Promise.resolve(),
          ]);

          if (createdMessageId) {
            editorRef.current?.setText("");
          }
        });
      } catch (error) {
        toast.error("Failed to send message");
        console.error(error);
      } finally {
        setLocalPending(false);
        editorRef.current?.enable(true);
        editorRef.current?.focus();
      }
    },
    [
      workspaceId,
      channelId,
      messageId,
      currentMember?._id,
      baseCreateMessageValue,
      createMessage,
      createNotification,
    ]
  );

  return (
    <div className="px-5 w-full">
      <Editor
        variant="create"
        placeHolder={placeholder}
        onSubmit={handleSubmit}
        disabled={isPending || localPending}
        innerRef={editorRef}
      />
    </div>
  );
};

export default ChatInput;

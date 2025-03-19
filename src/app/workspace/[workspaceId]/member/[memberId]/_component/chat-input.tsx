import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import dynamic from "next/dynamic";
import React, {
  useCallback,
  useTransition,
  useRef,
  useState,
  memo,
} from "react";
import { toast } from "sonner";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import Quill from "quill";

// Dynamic import with optimized loading
const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => <div className="h-20 bg-gray-100 animate-pulse" />,
});

// Type narrowing and performance optimizations
type CreateMessageValue = Readonly<{
  conversationId: Id<"conversations">;
  workspaceId: Id<"workspaces">;
  body: string;
  image?: string[];
}>;

type SubmitPayload = {
  body: string;
  files?: string[];
};

// Memoized component to prevent unnecessary re-renders
const ChatInput = memo(
  ({
    placeholder,
    conversationId,
  }: {
    placeholder: string;
    conversationId: Id<"conversations">;
  }) => {
    const [isPending, startTransition] = useTransition();
    const [editorKey, setEditorKey] = useState(0);

    const editorRef = useRef<Quill | null>(null);
    const { mutate: createMessage } = useCreateMessage();
    const workspaceId = useWorkSpaceId();

    const handleSubmit = useCallback(
      ({ body, files }: SubmitPayload) => {
        startTransition(() => {
          try {
            editorRef.current?.enable(false);

            const jsonBody = JSON.parse(body);
            jsonBody.ops.forEach((op) => {
              if (op.insert?.mention) {
                const { denotationChar, id } = op.insert.mention;
                if (denotationChar === "#") {
                  op.attributes = {
                    color: "#1d1c1d",
                    link: `/workspace/${workspaceId}/channel/${id}`,
                  };
                }
              }
            });

            const values: CreateMessageValue = {
              body: JSON.stringify(jsonBody),
              conversationId,
              workspaceId,
              image: files,
            };

            createMessage(values, {
              onSuccess: () => {
                setEditorKey((prev) => prev + 1);
              },
              onError: (error) => {
                toast.error("Failed to send message");
                console.error(error);
              },
              throwError: true,
            });
          } catch (error) {
            toast.error("Failed to process message");
            console.error(error);
          } finally {
            editorRef.current?.enable(true);
            editorRef.current?.focus();
          }
        });
      },
      [conversationId, workspaceId, createMessage]
    );

    return (
      <div className="px-5 w-full">
        <Editor
          key={editorKey}
          variant="create"
          placeHolder={placeholder}
          onSubmit={handleSubmit}
          disabled={isPending}
          innerRef={editorRef}
        />
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";

export default ChatInput;

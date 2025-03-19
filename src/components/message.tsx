import { Doc, Id } from "../../convex/_generated/dataModel";
import dynamic from "next/dynamic";
import { format, isToday, isYesterday } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Crown, Loader } from "lucide-react";
import { toast } from "sonner";

import Hint from "./hint";
import ThumbNail from "./thumbnail";
import ToolBar from "./toolbar";
import Reactions from "./reactions";
import ThreadBar from "./thread-bar";
import { cn } from "@/lib/utils";
import { usePanel } from "@/hooks/use-panel";
import useConfirm from "@/hooks/use-confirm-tsx";
import { useUpdateMessage } from "@/features/messages/api/use-update-message";
import { useRemoveMessage } from "@/features/messages/api/use-remove-message";
import { useCreateReactions } from "@/features/reactions/api/use-create-reactions";
import { useGetUserStatus } from "@/features/status/api/use-get-user-status";
import { UseGetIsProUser } from "@/features/subscription/api/use-get-is-pro-user";

// Dynamically import heavy components
const Renderer = dynamic(() => import("@/components/renderer"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse bg-gray-100 h-6 rounded w-full" />
  ),
});

const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse bg-gray-100 h-24 rounded w-full" />
  ),
});

// Types
interface MessageProps {
  id: Id<"messages">;
  memberId: Id<"members">;
  authorImage?: string;
  authorName?: string;
  isAuthor: boolean;
  reactions: Array<
    Omit<Doc<"reactions">, "memberId"> & {
      count: number;
      memberIds: Id<"members">[];
    }
  >;
  body: Doc<"messages">["body"];
  image?: string[];
  createdAt: Doc<"messages">["_creationTime"];
  updatedAt: Doc<"messages">["updatedAt"];
  isCompact?: boolean;
  isEditing?: boolean;
  setEditingId: (id: Id<"messages"> | null) => void;
  hideThreadButton: boolean;
  threadCount?: number;
  threadImage?: string;
  threadTimestamp?: number;
  threadName?: string;
  authorId: Id<"users">;
  currentMemberId?: Id<"members">;
}

// Utils - kept outside component for performance
const formatFullTime = (date: Date) => {
  return `${isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d, yyyy")} at ${format(date, "h:mm:ss a")}`;
};

const getAvatarOptimizedImageLink = (authorImage: string | undefined) => {
  return authorImage
    ? `/api/image-proxy?url=${encodeURIComponent(authorImage)}&w=100`
    : authorImage;
};

// Style constants
const STYLE_CONSTANTS = {
  editing:
    "bg-amber-100/40 hover:bg-amber-100/60 transition-colors duration-200",
  mentioned:
    "bg-yellow-100/50 hover:bg-yellow-100/60 transition-colors duration-200",
  removing:
    "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200",
  base: "flex flex-col gap-2 p-1.5 px-5 hover:bg-slate-100/60 group relative transition-colors duration-200",
} as const;

export default function Message({
  id,
  memberId,
  body,
  image,
  currentMemberId,
  authorName = "Member",
  authorImage,
  isAuthor,
  authorId,
  reactions,
  createdAt,
  hideThreadButton,
  setEditingId,
  updatedAt,
  isCompact,
  isEditing,
  threadCount,
  threadImage,
  threadName,
  threadTimestamp,
}: MessageProps) {
  const { onOpenMessage, onCloseMessage, parentMessageId, onOpenProfile } =
    usePanel();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete message",
    "Are you sure you want to delete this message? This cannot be undone."
  );

  // States
  const [isMentioned, setIsMentioned] = useState<boolean>(false);
  const [links, setLinks] = useState<string[]>([]);

  // Queries
  const { data: isPro, isLoading: isLoadingPro } = UseGetIsProUser({
    userId: authorId,
  });

  // Mutations
  const { data: userStatus } = useGetUserStatus({ id: authorId });
  const { mutate: updateMessage, isPending: isUpdatingMessage } =
    useUpdateMessage();
  const { mutate: removeMessage, isPending: isRemovingMessage } =
    useRemoveMessage();
  const { mutate: reactMessage, isPending: isReactingMessage } =
    useCreateReactions();

  // Memoized values
  const isPending = useMemo(
    () => isUpdatingMessage || isReactingMessage,
    [isUpdatingMessage, isReactingMessage]
  );

  const fallback = useMemo(
    () => authorName.charAt(0).toUpperCase(),
    [authorName]
  );

  const avatarOptimizedImageLink = useMemo(
    () => getAvatarOptimizedImageLink(authorImage),
    [authorImage]
  );

  // Process message body
  useEffect(() => {
    try {
      const jsonBody = JSON.parse(body);
      const uniqueLinks = new Set<string>();
      let flagMentioned = false;

      for (const op of jsonBody.ops) {
        if (op.insert && !op.insert.mention && op.attributes?.link) {
          uniqueLinks.add(op.attributes.link);
        } else if (
          currentMemberId &&
          op.insert?.mention?.id === currentMemberId
        ) {
          flagMentioned = true;
          break;
        }
      }

      setIsMentioned(flagMentioned);
      setLinks(Array.from(uniqueLinks));
    } catch (error) {
      console.error("Error parsing message body:", error);
    }
  }, [body, currentMemberId]);

  // Handlers
  const handleReaction = useCallback(
    (value: string) => {
      reactMessage(
        { messageId: id, value },
        {
          onError: () => toast.error("Failed to toggle reaction."),
        }
      );
    },
    [id, reactMessage]
  );

  const handleDeleteMessage = useCallback(async () => {
    const ok = await confirm();
    if (!ok) return;

    removeMessage(
      { id },
      {
        onSuccess: (data) => {
          toast.success("Message deleted.");
          if (parentMessageId === id) onCloseMessage();
          if (data && data?.length > 0) {
            data?.forEach(async (img) => {
              const fileKey = img?.split("/").pop();
              if (!fileKey) {
                throw new Error("Could not determine file key");
              }

              const response = await fetch("/api/uploadthing/file", {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ fileKey }),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete file");
              }
              console.log("file deleted");
            });
          }
        },
        onError: () => toast.error("Message deletion failed."),
      }
    );
  }, [confirm, id, onCloseMessage, parentMessageId, removeMessage]);

  const handleUpdateMessage = useCallback(
    ({ body }: { body: string }) => {
      updateMessage(
        { body, id },
        {
          onSuccess: () => {
            toast.success("Message updated.");
            setEditingId(null);
          },
          onError: () => toast.error("Message update failed."),
        }
      );
    },
    [id, setEditingId, updateMessage]
  );

  const messageClassName = cn(
    STYLE_CONSTANTS.base,
    isEditing && STYLE_CONSTANTS.editing,
    isMentioned && STYLE_CONSTANTS.mentioned,
    isRemovingMessage && STYLE_CONSTANTS.removing
  );

  if (isCompact) {
    return (
      <>
        <ConfirmDialog />
        <div className={messageClassName}>
          <div className="flex items-start gap-2">
            <Hint label={formatFullTime(new Date(createdAt))}>
              <button className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 w-[40px] leading-[22px] text-center hover:underline transition-opacity">
                {format(new Date(createdAt), "hh:mm")}
              </button>
            </Hint>
            {isEditing ? (
              <div className="w-full h-full">
                <Editor
                  onSubmit={handleUpdateMessage}
                  disabled={isPending}
                  defaultValue={JSON.parse(body)}
                  onCancel={() => setEditingId(null)}
                  variant="update"
                />
              </div>
            ) : (
              <div className="flex flex-col w-full">
                <Renderer links={links} value={body} messageId={id} />
                {image && image.length > 0 ? (
                  <>
                    {image.map((file, index) => {
                      return <ThumbNail key={file + index} url={file} />;
                    })}
                  </>
                ) : null}
                {updatedAt && (
                  <span className="text-xs text-muted-foreground">
                    (edited)
                  </span>
                )}
                <Reactions data={reactions} onChange={handleReaction} />
                <ThreadBar
                  count={threadCount}
                  onClick={() => onOpenMessage(id)}
                  image={threadImage}
                  timestamp={threadTimestamp}
                  name={threadName}
                />
              </div>
            )}
          </div>
          {!isEditing && (
            <ToolBar
              isAuthor={isAuthor}
              isPending={isPending}
              handleEdit={() => setEditingId(id)}
              handleReaction={handleReaction}
              handleThread={() => onOpenMessage(id)}
              handleDelete={handleDeleteMessage}
              hideThreadButton={hideThreadButton}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <ConfirmDialog />
      <div className={messageClassName}>
        <div className="flex items-start gap-2">
          <button
            onClick={() => onOpenProfile(memberId)}
            className="relative inline-flex items-center"
          >
            <div className="relative">
              <Avatar>
                <AvatarImage src={avatarOptimizedImageLink} alt={fallback} />
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white transition-colors duration-200",
                  userStatus?.currentStatus === "online"
                    ? "bg-emerald-400"
                    : "bg-gray-400"
                )}
                aria-hidden="true"
              />
            </div>
          </button>

          {isEditing ? (
            <div className="w-full h-full">
              <Editor
                onSubmit={handleUpdateMessage}
                disabled={isPending}
                defaultValue={JSON.parse(body)}
                onCancel={() => setEditingId(null)}
                variant="update"
              />
            </div>
          ) : (
            <div className="flex flex-col w-full overflow-hidden">
              <div className="text-sm flex items-center gap-2">
                <button
                  className="font-bold text-primary hover:underline"
                  onClick={() => onOpenProfile(memberId)}
                >
                  {authorName}
                </button>

                {isLoadingPro ? (
                  <Loader className="size-3 animate-spin text-muted-foreground" />
                ) : isPro ? (
                  <Hint label="Pro user">
                    <Crown className="size-3 text-amber-500" />
                  </Hint>
                ) : null}

                <Hint label={formatFullTime(new Date(createdAt))}>
                  <button className="text-xs text-muted-foreground hover:underline">
                    {format(new Date(createdAt), "h:mm a")}
                  </button>
                </Hint>
              </div>

              <Renderer links={links} value={body} messageId={id} />
              {image && image.length > 0 ? (
                <>
                  {image.map((file, index) => {
                    return <ThumbNail key={file + index} url={file} />;
                  })}
                </>
              ) : null}

              {updatedAt && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}

              <Reactions data={reactions} onChange={handleReaction} />
              <ThreadBar
                count={threadCount}
                image={threadImage}
                name={threadName}
                timestamp={threadTimestamp}
                onClick={() => onOpenMessage(id)}
              />
            </div>
          )}
        </div>

        {!isEditing && (
          <ToolBar
            isAuthor={isAuthor}
            isPending={isPending}
            handleEdit={() => setEditingId(id)}
            handleReaction={handleReaction}
            handleThread={() => onOpenMessage(id)}
            handleDelete={handleDeleteMessage}
            hideThreadButton={hideThreadButton}
          />
        )}
      </div>
    </>
  );
}

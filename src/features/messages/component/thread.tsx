import React, { useRef, useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader, XIcon } from "lucide-react";
import { useGetMessageById } from "../api/use-get-message-by-id";
import Message from "@/components/message";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import dynamic from "next/dynamic";
import Quill from "quill";
import { useCreateMessage } from "../api/use-create-message";
import { useChannelId } from "@/hooks/use-channel-id";
import { toast } from "sonner";
import { useGetMessages } from "../api/use-get-message";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

interface ThreadProps {
  messageId: Id<"messages">;
  onCloseMessage: () => void;
  isThreadPage: boolean;
}

type CreateMessageValue = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  parentMessageId: Id<"messages">;
  body: string;
  image?: string[];
};

const TIME_THRESHOLD = 5;

const Thread = ({ messageId, onCloseMessage, isThreadPage }: ThreadProps) => {
  const workspaceId = useWorkSpaceId();
  const threadChannelIdQuery = useQuery(api.messages.getChannelId, {
    messageId,
    workspaceId,
  })!;
  const defaultChannelId = useChannelId();

  const channelId = isThreadPage
    ? threadChannelIdQuery
      ? threadChannelIdQuery
      : defaultChannelId
    : defaultChannelId;

  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

  const editorRef = useRef<Quill | null>(null);

  const { mutate: createMessage } = useCreateMessage();

  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { data: message, isLoading: loadingMessage } = useGetMessageById({
    id: messageId,
  });
  const { loadMore, results, status } = useGetMessages({
    channelId,
    parentMessageId: messageId,
  });

  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";

  const groupedMessages = results?.reduce(
    (groups, message) => {
      if (!message) return groups;
      const date = new Date(message._creationTime);

      const roundedMinutes = Math.floor(date.getMinutes() / 10) * 10;
      const roundedTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        roundedMinutes
      );

      const timeKey = format(roundedTime, "yyyy-MM-dd HH:mm");

      if (!groups[timeKey]) groups[timeKey] = [];

      groups[timeKey].unshift(message);

      return groups;
    },
    {} as Record<string, typeof results>
  );

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);

    if (isToday(date)) {
      return `Today around ${format(date, "HH:mm")}`;
    } else if (isYesterday(date)) {
      return `Yesterday around  ${format(date, "HH:mm")}`;
    }

    return format(date, "EEEE, MMMM d"); // Fallback for other dates
  };

  const handleSubmit = async ({
    body,
    image,
  }: {
    body: string;
    image?: string[];
  }) => {
    try {
      editorRef.current?.enable(false);
      setIsPending(true);

      const values: CreateMessageValue = {
        body,
        workspaceId,
        channelId,
        parentMessageId: messageId,
        image: image,
      };

      createMessage(values, { throwError: true });
      setEditorKey((prev) => prev + 1);
    } catch (error) {
      toast.error("failed to send text");
      console.log(error);
    } finally {
      setIsPending(false);
      editorRef.current?.enable(true);
    }
  };

  if (loadingMessage || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center px-4 h-[49px] border-b">
          <p className="text-lg font-bold">Thread</p>
          <Button variant={"ghost"} onClick={onCloseMessage} size={"iconSm"}>
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex items-center h-full justify-center">
          <Loader className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center px-4 h-[49px] border-b">
          <p className="text-lg font-bold">Thread</p>
          <Button variant={"ghost"} onClick={onCloseMessage} size={"iconSm"}>
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col gap-y-2 items-center h-full justify-center">
          <AlertTriangle className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Message not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center px-4 h-[49px] border-b">
        <p className="text-lg font-bold">Thread</p>
        <Button variant={"ghost"} onClick={onCloseMessage} size={"iconSm"}>
          <XIcon className="size-5 stroke-[1.5]" />
        </Button>
      </div>
      <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto  message-scrollbar">
        {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => {
          return (
            <div key={dateKey}>
              <div className="text-center my-2 relative">
                <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm ">
                  {formatDateLabel(dateKey)}
                </span>
              </div>

              {messages.map((message, index) => {
                const prevMsg = messages[index - 1];

                const isCompact =
                  prevMsg &&
                  prevMsg.user?._id === message.user?._id &&
                  differenceInMinutes(
                    new Date(message._creationTime),
                    new Date(prevMsg._creationTime)
                  ) < TIME_THRESHOLD;

                return (
                  <Message
                    key={message._id}
                    authorId={message.user._id!}
                    id={message._id}
                    memberId={message.memberId}
                    authorImage={message.user.image}
                    authorName={message.user.name}
                    isAuthor={message.memberId === currentMember?._id}
                    body={message.body}
                    image={message.image}
                    reactions={message.reactions}
                    updatedAt={message.updatedAt}
                    createdAt={message._creationTime}
                    threadCount={message.threadCount}
                    threadTimestamp={message.threadTimestamp}
                    threadImage={message.threadImage}
                    isEditing={editingId === message._id}
                    threadName={message.threadName}
                    setEditingId={setEditingId}
                    isCompact={isCompact}
                    hideThreadButton
                  />
                );
              })}
            </div>
          );
        })}
        <div
          className="h-1"
          ref={(el) => {
            if (el) {
              const observer = new IntersectionObserver(
                ([entry]) => {
                  if (entry.isIntersecting && canLoadMore) {
                    loadMore();
                  }
                },
                { threshold: 1.0 }
              );
              observer.observe(el);
              return () => {
                observer.disconnect();
              };
            }
          }}
        />
        {isLoadingMore && (
          <div className="text-center my-2 relative">
            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
            <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm ">
              <Loader className="size-4 animate-spin" />
            </span>
          </div>
        )}
        <Message
          hideThreadButton
          id={message._id}
          memberId={message.memberId}
          authorImage={message.user.image}
          authorName={message.user.name}
          body={message.body}
          image={message.image}
          authorId={message.user._id!}
          reactions={message.reactions}
          updatedAt={message.updatedAt}
          createdAt={message._creationTime}
          isAuthor={message.memberId === currentMember?._id}
          setEditingId={setEditingId}
          isEditing={editingId === messageId}
        />
      </div>

      <div className="px-4">
        <Editor
          key={editorKey}
          onSubmit={handleSubmit}
          disabled={isPending}
          innerRef={editorRef}
          placeHolder="Reply..."
        />
      </div>
    </div>
  );
};

export default Thread;

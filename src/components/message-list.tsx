import { GetMessagesReturnType } from "@/features/messages/api/use-get-message";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Message from "./message";
import ChannelHero from "./channel-hero";
import { Id } from "../../convex/_generated/dataModel";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { Loader } from "lucide-react";
import ConversationHero from "./conversation-hero";
import { useLocation } from "react-use";
// import { cn } from "@/lib/utils";

interface MessageListProps {
  channelName?: string;
  channelCreationTime?: number;
  data: GetMessagesReturnType | undefined;
  loadMore: () => void;
  isLoadingMore: boolean;
  canLoadMore: boolean;
  memberName?: string;
  memberImage?: string;
  variant?: "channel" | "thread" | "conversation";
}

const TIME_THRESHOLD = 5; // 5 mins

const MessageList: React.FC<MessageListProps> = ({
  canLoadMore,
  data,
  isLoadingMore,
  loadMore,
  channelCreationTime,
  channelName,
  memberImage,
  memberName,
  variant,
}) => {
  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const workspaceId = useWorkSpaceId();
  const location = useLocation();
  const { data: currentMember } = useCurrentMember({ workspaceId });

  // Memoized message grouping
  const groupedMessages = useMemo(() => {
    return data?.reduce(
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
      {} as Record<string, typeof data>
    );
  }, [data]);

  // Memoized date formatter
  const formatDateLabel = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Today around ${format(date, "HH:mm")}`;
    if (isYesterday(date)) return `Yesterday around ${format(date, "HH:mm")}`;
    return format(date, "EEEE, MMMM d");
  }, []);

  useEffect(() => {
    const messageId = location.hash?.slice(1);
    if (!messageId) return;

    setIsScrolling(true);

    let cleanupFunction: (() => void) | undefined;

    // Create an async function to handle the await
    const initializeScroll = async () => {
      cleanupFunction = await scrollToMessage(messageId);
    };

    // Call the async function
    initializeScroll();

    // Return cleanup function
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [location.hash, canLoadMore, loadMore]);

  // The scrollToMessage function remains the same
  const scrollToMessage = async (messageId: string) => {
    let lastScrollHeight = listRef.current?.scrollHeight || 0;
    let attemptCount = 0;
    const maxAttempts = 10;

    const scrollInterval = setInterval(async () => {
      const element = document.getElementById(messageId);
      const currentScrollHeight = listRef.current?.scrollHeight || 0;

      if (element) {
        clearInterval(scrollInterval);
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        element.classList.add(
          "bg-accent/10",
          "transition-colors",
          "duration-500"
        );
        setTimeout(() => {
          element.classList.remove("bg-accent/10");
        }, 2000);

        setIsScrolling(false);
        if (window.location.hash) {
          history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
        }
        return;
      }

      if (
        attemptCount >= maxAttempts &&
        currentScrollHeight === lastScrollHeight
      ) {
        clearInterval(scrollInterval);
        setIsScrolling(false);
        return;
      }

      if (canLoadMore && currentScrollHeight === lastScrollHeight) {
        loadMore();
      }

      lastScrollHeight = currentScrollHeight;
      attemptCount++;
    }, 1000);

    return () => clearInterval(scrollInterval);
  };

  // Intersection Observer setup
  const observerCallback = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && canLoadMore) {
            loadMore();
          }
        },
        { threshold: 1.0 }
      );

      observer.observe(el);
      return () => observer.disconnect();
    },
    [canLoadMore, loadMore]
  );

  return (
    <div
      ref={listRef}
      className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto message-scrollbar relative"
    >
      {/* Scrolling indicator */}
      {isScrolling && (
        <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <Loader className="size-4 animate-spin" />
          <span className="text-sm">Scrolling to message...</span>
        </div>
      )}

      {/* Message groups */}
      {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
        <div key={dateKey}>
          <div className="text-center my-2 relative">
            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
            <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
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
                id={message._id}
                memberId={message.memberId}
                authorImage={message.user.image}
                authorId={message.user._id!}
                authorName={message.user.name}
                currentMemberId={currentMember?._id}
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
                setEditingId={setEditingId}
                isCompact={isCompact}
                hideThreadButton={variant === "thread"}
                threadName={message.threadName}
              />
            );
          })}
        </div>
      ))}

      {/* Infinite scroll trigger */}
      <div className="h-1" ref={observerCallback} />

      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="text-center my-2 relative">
          <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
          <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
            <Loader className="size-4 animate-spin" />
          </span>
        </div>
      )}

      {/* Channel or Conversation hero */}
      {variant === "channel" && channelName && channelCreationTime && (
        <ChannelHero name={channelName} creationTime={channelCreationTime} />
      )}
      {variant === "conversation" && (
        <ConversationHero name={memberName} image={memberImage} />
      )}
    </div>
  );
};

export default React.memo(MessageList);

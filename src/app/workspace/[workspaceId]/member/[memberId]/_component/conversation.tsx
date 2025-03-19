import { useGetMemberById } from "@/features/members/api/use-get-member-by-id";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { useMemberId } from "@/hooks/use-member-id";
import { useGetMessages } from "@/features/messages/api/use-get-message";
import { Loader } from "lucide-react";
import Header from "./header";
import ChatInput from "./chat-input";
import MessageList from "@/components/message-list";
import { usePanel } from "@/hooks/use-panel";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import VideoChat from "@/components/phone-call";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import { useState } from "react";

interface ConversationProps {
  id: Id<"conversations">;
}

const Conversation = ({ id }: ConversationProps) => {
  const { onOpenProfile } = usePanel();

  const memberId = useMemberId();
  const workspaceId = useWorkSpaceId();
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const { data: currentUserAuth } = useCurrentUser();
  const { data: currentUser } = useCurrentMember({ workspaceId });
  const { data: member, isLoading: memberLoading } = useGetMemberById({
    id: memberId,
  });
  const uniqueRoomIdentifier = [memberId, currentUser?._id].sort().join("-");
  const chatId = `${workspaceId}:${uniqueRoomIdentifier}`;

  useEffect(() => {
    const callParam = searchParams?.get("call");
    setIsCalling(callParam === "true");
  }, [searchParams, chatId]);

  const { loadMore, results, status } = useGetMessages({
    conversationId: id,
  });
  if (memberLoading || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        isCalling={isCalling}
        currentUser={currentUser!}
        memberName={member?.user.name}
        memberImage={member?.user.image}
        onClick={() => onOpenProfile(memberId)}
      />
      {isCalling && <VideoChat chatId={chatId} userData={currentUserAuth!} />}
      <MessageList
        memberImage={member?.user.image}
        memberName={member?.user.name}
        canLoadMore={status === "CanLoadMore"}
        isLoadingMore={status === "LoadingMore"}
        loadMore={loadMore}
        data={results}
        variant="conversation"
      />
      <ChatInput
        conversationId={id}
        placeholder={`Message ${member?.user.name}`}
      />
    </div>
  );
};

export default Conversation;

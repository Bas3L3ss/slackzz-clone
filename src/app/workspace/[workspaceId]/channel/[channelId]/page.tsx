"use client";

import { UseGetChannel } from "@/features/channels/api/use-get-channel";
import { useChannelId } from "@/hooks/use-channel-id";
import { Loader, TriangleAlert } from "lucide-react";
import React, { useEffect, useState } from "react";
import Header from "./_components/header";
import { useGetMessages } from "@/features/messages/api/use-get-message";
import MessageList from "@/components/message-list";
import { useSearchParams } from "next/navigation";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";

import { useCurrentUser } from "@/features/auth/api/use-current-user";
import dynamic from "next/dynamic";

const VideoChat = dynamic(() => import("@/components/phone-call"), {
  ssr: false,
});
const ChatInput = dynamic(() => import("./_components/chat-input"), {
  ssr: false,
});

const ChannelIdPage = () => {
  const workspaceId = useWorkSpaceId();
  const channelId = useChannelId();
  const [isVideoCall, setIsVideoCall] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const { data: currentUser } = useCurrentUser();
  const chatId = `${workspaceId}:${channelId}`;

  useEffect(() => {
    const callParam = searchParams?.get("call");
    setIsVideoCall(callParam === "true");
  }, [searchParams, chatId]);

  const { data: channel, isLoading: channelLoading } = UseGetChannel({
    channelId,
  });
  const { results, loadMore, status } = useGetMessages({ channelId });

  if (channelLoading || status == "LoadingFirstPage")
    return (
      <div className="h-full flex-1 flex items-center justify-center">
        <Loader className="animate-spin size-5 text-muted-foreground" />
      </div>
    );
  if (!channel)
    return (
      <div className="h-full flex-1 flex flex-col gap-y-2 items-center justify-center">
        <TriangleAlert className=" size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Channel not found</span>
      </div>
    );

  return (
    <div className="flex flex-col h-full ">
      <Header isVideoCall={isVideoCall} title={channel.name} />
      {isVideoCall && <VideoChat chatId={chatId} userData={currentUser!} />}
      <MessageList
        channelName={channel.name}
        channelCreationTime={channel._creationTime}
        data={results}
        loadMore={loadMore}
        variant="channel"
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
      />
      <ChatInput placeholder={`Message # ${channel.name}`} />
    </div>
  );
};

export default ChannelIdPage;

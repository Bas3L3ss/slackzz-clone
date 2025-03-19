"use client";

import { useQuery } from "convex/react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Users } from "lucide-react";
import ThreadBar from "@/components/thread-bar";
import { api } from "../../../../../../convex/_generated/api";
import { ThreadSummary } from "../../../../../../convex/thread";
import { usePanel } from "@/hooks/use-panel";
import Renderer from "@/components/renderer";

export default function ThreadCard({ thread }: { thread: ThreadSummary }) {
  const { onOpenMessage } = usePanel();

  const threadSummary = useQuery(api.thread.getThreadSummary, {
    messageId: thread.id,
  });

  if (!threadSummary) {
    return null;
  }

  return (
    <Card
      className="hover:bg-muted/80 transition cursor-pointer"
      onClick={() => onOpenMessage(thread.id)}
    >
      <CardContent className="p-4 space-y-4 w-full flex flex-col">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-grow">
            <p className="text-sm font-medium text-muted-foreground">
              {threadSummary.context}
            </p>
            <h3 className="text-lg font-semibold line-clamp-2">
              <Renderer value={threadSummary.originalMessage.body} />
            </h3>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{threadSummary.replyCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="text-sm">{threadSummary.participantCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">
            {threadSummary.originalMessage.author}
          </span>
          <span>·</span>
          <span>
            {formatDistanceToNow(threadSummary.originalMessage.createdAt, {
              addSuffix: true,
            })}
          </span>
        </div>

        <Separator />

        <ThreadBar
          count={threadSummary.replyCount}
          image={thread.lastReplyAuthorImage!}
          name={thread.lastReplyAuthorName}
          timestamp={thread.lastReplyAt}
        />
      </CardContent>
    </Card>
  );
}

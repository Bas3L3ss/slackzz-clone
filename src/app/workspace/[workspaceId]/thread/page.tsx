"use client";

import { usePaginatedQuery } from "convex/react";
import { Hash, Loader, MessageSquare, Search, Users2 } from "lucide-react";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import ThreadCard from "./_component/thread-card";
import { api } from "../../../../../convex/_generated/api";
import { ThreadSummary } from "../../../../../convex/thread";
import { useState, useMemo } from "react";
import { filterThreads, sortThreads } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const BATCH_SIZE = 10;

export default function ThreadsPage() {
  const workspaceId = useWorkSpaceId();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("lastReplyAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const {
    results: threads,
    isLoading,
    loadMore,
    status,
  } = usePaginatedQuery(
    api.thread.getAllThreads,
    {
      workspaceId,
    },
    { initialNumItems: BATCH_SIZE }
  );

  const filteredAndSortedThreads = useMemo(() => {
    const filtered = filterThreads(threads as ThreadSummary[], searchTerm);
    return sortThreads(filtered, sortBy, sortOrder);
  }, [threads, searchTerm, sortBy, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-3 p-4 sm:p-6 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">All Threads</h1>
          </div>

          <div className="hidden md:block">
            <Separator orientation="vertical" className="h-6" />
          </div>

          <div className="flex flex-col justify-between flex-1 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by starting message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9  bg-muted/50 w-full"
              />
            </div>

            <div className="flex   xs:flex-row gap-2 sm:items-center">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full xs:w-[200px] bg-muted/50">
                  <SelectValue placeholder="Sort threads by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastReplyAt">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate">Most Recent Activity</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="participantCount">
                    <div className="flex items-center gap-2">
                      <Users2 className="h-4 w-4" />
                      <span className="truncate">Most Active Participants</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="replyCount">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate">Most Replies</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
              >
                <SelectTrigger className="w-full xs:w-[140px] bg-muted/50">
                  <SelectValue placeholder="Order by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 sm:px-6 sm:py-4 h-full w-full message-scrollbar overflow-auto">
        <div className="grid gap-2 pb-10">
          {filteredAndSortedThreads.length > 0 ? (
            <>
              {filteredAndSortedThreads.map((thread: ThreadSummary) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
              {status === "CanLoadMore" && (
                <button
                  onClick={() => loadMore(BATCH_SIZE)}
                  className="mt-4 mb-2 w-full rounded-md bg-muted/50 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                >
                  Load more threads
                </button>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground mt-8">
              No threads found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

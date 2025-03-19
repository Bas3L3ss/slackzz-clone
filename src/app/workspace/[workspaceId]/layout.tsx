"use client";

import React, { ReactNode } from "react";
import Toolbar from "./toolbar";
import Sidebar from "./sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import WorkspaceSideBar from "./workspace-sidebar";
import { usePanel } from "@/hooks/use-panel";
import { Loader } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import Thread from "@/features/messages/component/thread";
import Profile from "@/features/members/components/profile";
import { PresenceProvider } from "@/components/presence-provider";

interface WorkspaceIdLayoutProps {
  children: ReactNode;
}
function WorkspaceIdLayout({ children }: WorkspaceIdLayoutProps) {
  const { onCloseMessage, parentMessageId, profileMemberId } = usePanel();

  const showPanel = !!parentMessageId || !!profileMemberId;

  return (
    <PresenceProvider>
      <div className="h-full ">
        <Toolbar />

        <div className="flex h-[calc(100vh-40px)] ">
          <Sidebar />

          <ResizablePanelGroup
            autoSave="workspace-layout"
            direction="horizontal"
          >
            <ResizablePanel
              defaultSize={20}
              minSize={0}
              className="bg-[#5E2C5F]"
              maxSize={18}
            >
              <WorkspaceSideBar />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel minSize={20} defaultSize={80}>
              {children}
            </ResizablePanel>
            {showPanel && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel minSize={20} defaultSize={30} maxSize={40}>
                  {parentMessageId ? (
                    <Thread
                      isThreadPage={window.location.pathname.includes(
                        "/thread"
                      )}
                      messageId={parentMessageId as Id<"messages">}
                      onCloseMessage={onCloseMessage}
                    />
                  ) : profileMemberId ? (
                    <Profile
                      memberId={profileMemberId as Id<"members">}
                      onClose={onCloseMessage}
                    />
                  ) : (
                    <div className="flex items-center h-full justify-center">
                      <Loader className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    </PresenceProvider>
  );
}

export default WorkspaceIdLayout;

"use client";

import { UseGetChannels } from "@/features/channels/api/use-get-channels";
import { useCreateChannelModal } from "@/features/channels/store/use-get-channel-modal";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { Loader, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

function WorkspaceIdPage() {
  const workspaceId = useWorkSpaceId();
  const router = useRouter();
  const [open, setOpen] = useCreateChannelModal();

  const { data: member, isLoading: memberLoading } = useCurrentMember({
    workspaceId,
  });

  const isAdmin = useMemo(() => member?.role === "admin", [member?.role]);

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({
    id: workspaceId,
  });
  const { data: channels, isLoading: channelLoading } = UseGetChannels({
    workspaceId,
  });

  const channelID = useMemo(() => channels?.[0]?._id, [channels]);

  useEffect(() => {
    if (
      workspaceLoading ||
      channelLoading ||
      !workspace ||
      memberLoading ||
      !member
    )
      return;

    if (channelID) {
      router.push(`/workspace/${workspaceId}/channel/${channelID}`);
    } else if (!open && isAdmin) {
      setOpen(true);
    }
  }, [
    channelLoading,
    memberLoading,
    workspace,
    workspaceLoading,
    channelID,
    open,
    channels,
    member,
    router,
    setOpen,
    workspaceId,
    isAdmin,
  ]);

  if (workspaceLoading || channelLoading || memberLoading)
    return (
      <div className="h-full flex flex-1 items-center justify-center flex-col gap-2">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );

  if (!workspace || !member) {
    return (
      <div className="h-full flex flex-1 items-center justify-center flex-col gap-2">
        <TriangleAlert className="size-6  text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Workspace not found
        </span>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-1 items-center justify-center flex-col gap-2">
      <TriangleAlert className="size-6  text-muted-foreground" />
      <span className="text-sm text-muted-foreground">No channel found</span>
    </div>
  );
}

export default WorkspaceIdPage;

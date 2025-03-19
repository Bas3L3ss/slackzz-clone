"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-get-workspace-modal";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { Loader, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

const WorkspaceSwitcher = () => {
  const router = useRouter();
  const workspaceId = useWorkSpaceId();
  const [, setOpen] = useCreateWorkspaceModal();

  const { data: workspaces } = useGetWorkspaces();
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({
    id: workspaceId,
  });

  const filteredWorkspaces = workspaces?.filter(
    (workspace) => workspace?._id !== workspaceId
  );

  const WorkspaceImage = ({
    imageUrl,
    name,
    size = "h-9 w-9",
  }: {
    imageUrl?: string;
    name: string;
    size?: string;
  }) => {
    if (imageUrl) {
      return (
        <div
          className={`relative ${size} rounded-md overflow-hidden  hover:opacity-90 transition-opacity`}
        >
          <Image
            src={imageUrl}
            alt={`${name}'s workspace`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      );
    }

    return (
      <div
        className={`${size} rounded-md bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center text-primary-foreground font-semibold`}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="p-0 size-9 rounded-[16px] overflow-hidden hover:rounded-[12px] transition-all duration-200 relative  hover:shadow-md">
          {workspaceLoading ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            <WorkspaceImage
              imageUrl={workspace?.imageUrl}
              name={workspace?.name || ""}
              size="h-full w-full"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        className="w-64 p-2 rounded-xl border border-border/50 shadow-lg"
      >
        <DropdownMenuItem
          onClick={() => router.push(`/workspace/${workspaceId}`)}
          className="cursor-pointer p-2 flex gap-3 items-center rounded-md "
        >
          <WorkspaceImage
            imageUrl={workspace?.imageUrl}
            name={workspace?.name || ""}
          />
          <div className="flex flex-col">
            <span className="font-medium capitalize">{workspace?.name}</span>
            <span className="text-xs text-muted-foreground">
              Active workspace
            </span>
          </div>
        </DropdownMenuItem>

        {filteredWorkspaces?.map((workspace) => (
          <DropdownMenuItem
            key={workspace?._id}
            className="cursor-pointer p-2 mt-1 flex gap-3 items-center rounded-md "
            onClick={() => router.push(`/workspace/${workspace._id}`)}
          >
            <WorkspaceImage
              imageUrl={workspace?.imageUrl}
              name={workspace.name}
            />
            <span className="font-medium capitalize truncate">
              {workspace.name}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuItem
          className="cursor-pointer p-2 mt-1 flex gap-3 items-center rounded-md "
          onClick={() => setOpen(true)}
        >
          <div className="h-9 w-9  rounded-md flex items-center justify-center   transition-colors">
            <Plus className="h-5 w-5" />
          </div>
          <span className="font-medium">Create a new workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceSwitcher;

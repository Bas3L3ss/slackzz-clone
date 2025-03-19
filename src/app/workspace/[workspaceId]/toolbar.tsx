import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { UseGetChannels } from "@/features/channels/api/use-get-channels";
import { useGetMembers } from "@/features/members/api/use-get-member";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { Hash, Info, Search, User } from "lucide-react";
import Link from "next/link";
import React from "react";

function Toolbar() {
  const workspaceId = useWorkSpaceId();

  const { data } = useGetWorkspace({ id: workspaceId });

  const { data: channels } = UseGetChannels({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const [open, setOpen] = React.useState(false);
  return (
    <nav className="bg-[#481349] flex items-center justify-between h-10 p-1.5 ">
      <div className="flex-1" />
      <div className="min-w-[280px] max-[642px] grow-[2] shrink">
        <Button
          size={"sm"}
          className="bg-accent/25 hover:bg-accent-25 w-full justify-start h-7  px-2"
          onClick={() => setOpen(true)}
        >
          <Search className="size-4 text-white mr-2" />
          <span className="text-white text-xs">Search {data?.name}</span>
          <p className="ml-auto text-sm text-muted-foreground">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">ctrl J</span>
            </kbd>
          </p>
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Channels">
              {channels?.map((channel) => {
                return (
                  <Link
                    key={channel._id}
                    href={`/workspace/${workspaceId}/channel/${channel._id}`}
                    onClick={() => setOpen(false)}
                  >
                    <CommandItem>
                      <Hash className="size-4" />
                      <span>{channel.name}</span>
                    </CommandItem>
                  </Link>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Members ">
              {members?.map((member) => {
                return (
                  <Link
                    key={member._id}
                    href={`/workspace/${workspaceId}/member/${member._id}`}
                    onClick={() => setOpen(false)}
                  >
                    <CommandItem>
                      <User className="size-4" />
                      <span>{member.user.name}</span>
                    </CommandItem>
                  </Link>
                );
              })}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
      <div className="ml-auto flex-1 flex items-center justify-end">
        <Button variant={"transparent"} size={"iconSm"}>
          <Link href="/support">
            <Info className="size-5 text-white" />
          </Link>
        </Button>
      </div>
    </nav>
  );
}

export default Toolbar;

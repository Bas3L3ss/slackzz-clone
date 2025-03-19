import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRemoveChannel } from "@/features/channels/api/use-remove-channel";
import { useUpdateChannel } from "@/features/channels/api/use-update-channel";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useChannelId } from "@/hooks/use-channel-id";
import useConfirm from "@/hooks/use-confirm-tsx";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { DialogTitle } from "@radix-ui/react-dialog";
import { TrashIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { FcEndCall, FcPhone } from "react-icons/fc";
import { toast } from "sonner";

interface HeaderProps {
  title: string;
  isVideoCall: boolean;
}

const Header = ({ title, isVideoCall }: HeaderProps) => {
  const channelId = useChannelId();
  const workspaceId = useWorkSpaceId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [editOpen, setEditOpen] = useState(false);
  const [value, setValue] = useState(title);

  const { data: member } = useCurrentMember({ workspaceId });

  const { mutate: updateChannel, isPending: isUpdatingChannel } =
    useUpdateChannel();
  const { mutate: removeChannel } = useRemoveChannel();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this channel?",
    " You are about to delete this channel. This action is irreversibly"
  );

  const handleOpen = (value: boolean) => {
    if (member?.role !== "admin") return;
    setEditOpen(value);
  };

  const handleRemove = async () => {
    const ok = await confirm();
    if (!ok) return;

    removeChannel(
      { channelId },
      {
        onSuccess: () => {
          toast.success("Channel deleted");
          router.push(`/workspace/${workspaceId}`);
        },
        onError: () => {
          toast.error("Failed to delete channel");
        },
      }
    );
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    updateChannel(
      { channelId, name: value },
      {
        onSuccess: () => {
          toast.success("Channel updated");
          setEditOpen(false);
        },
        onError: () => {
          toast.error("Failed to update channel");
        },
      }
    );
  };

  const handleCall = () => {
    const currentParams = new URLSearchParams(searchParams?.toString());
    if (currentParams.has("call")) {
      currentParams.delete("call");
    } else {
      currentParams.set("call", "true");
    }

    router.push(`?${currentParams.toString()}`);
  };

  return (
    <div className="bg-white border-b  h-[49px] flex items-center px-4 overflow-hidden">
      <ConfirmDialog />
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={"ghost"}
            className="text-lg font-semibold px-2 overflow-hidden w-auto"
            size={"sm"}
          >
            <span className="truncate mr-2"># {title}</span>
            {member?.role === "admin" && <FaChevronDown className="size-2.5" />}
          </Button>
        </DialogTrigger>
        {member?.role === "admin" && (
          <DialogContent className="p-0 bg-gray-50 overflow-hidden">
            <DialogHeader className="p-4 border-b bg-white">
              <DialogTitle># {title}</DialogTitle>
            </DialogHeader>
            <div className="px-4 pb-4 flex flex-col gap-y-2">
              <Dialog open={editOpen} onOpenChange={handleOpen}>
                <DialogTrigger asChild>
                  <div className="px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Channel Name</p>
                      <p className="text-sm text-[#1264a3] hover:underline font-semibold">
                        Edit
                      </p>
                    </div>
                    <p className="text-sm"># {title}</p>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename this channel</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      value={value}
                      disabled={isUpdatingChannel}
                      onChange={(e) =>
                        setValue(
                          e.target.value.replace(/\s+/g, "-").toLowerCase()
                        )
                      }
                      required
                      autoFocus
                      minLength={3}
                      maxLength={80}
                      placeholder="e.g. plan-budget"
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          variant={"outline"}
                          disabled={isUpdatingChannel}
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button disabled={isUpdatingChannel}>Save</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <button
                onClick={handleRemove}
                className=" flex items-center gap-x-2 px-5 py-4 bg-white rounded-lg cursor-pointer border hover:bg-gray-50 text-red-600"
              >
                <TrashIcon className="size-4" />
                <p className="text-sm font-semibold">Delete Channel</p>
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <div className="ml-auto">
        <Button variant={"ghost"} onClick={handleCall}>
          {isVideoCall ? <FcEndCall size={16} /> : <FcPhone size={16} />}
        </Button>
      </div>
    </div>
  );
};

export default Header;

import React from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useGetMemberById } from "../api/use-get-member-by-id";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ChevronDownIcon,
  CrownIcon,
  Loader,
  MailIcon,
  User2Icon,
  XIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useUpdateMember } from "../api/use-update-member";
import { useRemoveMember } from "../api/use-remove-member";
import { useCurrentMember } from "../api/use-current-member";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { toast } from "sonner";
import useConfirm from "@/hooks/use-confirm-tsx";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetUserStatus } from "@/features/status/api/use-get-user-status";
interface ProfileProps {
  memberId: Id<"members">;
  onClose: () => void;
}
const Profile = ({ memberId, onClose }: ProfileProps) => {
  const router = useRouter();
  const workspaceId = useWorkSpaceId();

  const [UpdateDialog, confirmUpdate] = useConfirm(
    "Update member's role",
    "Are you sure you want to change member's role in this workspace?"
  );

  const [LeaveDialog, confirmLeave] = useConfirm(
    "Leave workspace",
    "Are you sure you want to leave this workspace?"
  );

  const [RemoveDialog, confirmRemove] = useConfirm(
    "Remove member",
    "Are you sure you want to remove member from this workspace?"
  );

  const { data: currentMember, isLoading: isLoadingCurrentMember } =
    useCurrentMember({ workspaceId });
  const { data: member, isLoading: isLoadingMember } = useGetMemberById({
    id: memberId,
  });
  const { data: memberStatus, isLoading: isLoadingUserStatus } =
    useGetUserStatus({ id: member?.userId });

  const { mutate: updateMember } = useUpdateMember();
  const { mutate: removeMember } = useRemoveMember();

  const onRemove = async () => {
    const ok = await confirmRemove();
    if (!ok) return;
    removeMember(
      {
        id: memberId,
      },
      {
        onSuccess() {
          toast.success("Member Removed");
          onClose();
        },
        onError() {
          toast.error("failed to remove member");
        },
      }
    );
  };
  const onLeave = async () => {
    const ok = await confirmLeave();
    if (!ok) return;
    removeMember(
      {
        id: memberId,
      },
      {
        onSuccess() {
          router.push("/");

          toast.success("You've left the workspace");
          onClose();
        },
        onError(error) {
          console.log(error);

          toast.error("failed to leave");
        },
      }
    );
  };
  const onUpdate = async (role: "admin" | "member") => {
    const ok = await confirmUpdate();
    if (!ok) return;
    updateMember(
      {
        id: memberId,
        role,
      },
      {
        onSuccess() {
          toast.success("Role changed");
          onClose();
        },
        onError() {
          toast.error("failed to change role");
        },
      }
    );
  };

  if (isLoadingMember || isLoadingCurrentMember || isLoadingUserStatus) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center px-4 h-[49px] border-b">
          <p className="text-lg font-bold">Profile</p>
          <Button variant={"ghost"} onClick={onClose} size={"iconSm"}>
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex items-center h-full justify-center">
          <Loader className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  if (!member) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center px-4 h-[49px] border-b">
          <p className="text-lg font-bold">Profile</p>
          <Button variant={"ghost"} onClick={onClose} size={"iconSm"}>
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col gap-y-2 items-center h-full justify-center">
          <AlertTriangle className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Member not found</p>
        </div>
      </div>
    );
  }
  const fallback = member.user.name?.charAt(0).toUpperCase() ?? "M";
  const avatarOptimizedImageLink = member.user.image
    ? `/api/image-proxy?url=${encodeURIComponent(member.user.image)}&w=100`
    : member.user.image;
  return (
    <>
      <LeaveDialog />
      <RemoveDialog />
      <UpdateDialog />
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center px-4 h-[49px] border-b">
          <p className="text-lg font-bold">Profile</p>

          <Button variant={"ghost"} onClick={onClose} size={"iconSm"}>
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center p-4">
          <Avatar className="max-w-[256px] relative max-h-[256px] size-full">
            <AvatarImage src={avatarOptimizedImageLink} />
            <AvatarFallback className="aspect-square text-6xl">
              {fallback}
            </AvatarFallback>
            <span
              className={`absolute bottom-0 left-0 block h-5 w-5 rounded-full ring-2 ring-white ${
                memberStatus?.currentStatus == "online"
                  ? "bg-green-400"
                  : "bg-gray-400"
              }`}
              aria-hidden="true"
            />
          </Avatar>
        </div>
        <div className="flex flex-col p-4 ">
          <p className="text-lg font-bold flex  items-center ">
            {member.user.name}
            {member.role === "admin" ? (
              <span>
                <CrownIcon className="size-4 ml-2 text-yellow-700" />
              </span>
            ) : (
              <span>
                <User2Icon className="size-4 ml-2" />
              </span>
            )}
          </p>
          <div className="flex gap-2">
            {memberStatus?.customStatusEmoji && (
              <div className="flex items-center text-sm ">
                {memberStatus.customStatusEmoji}
              </div>
            )}

            {memberStatus?.userNote && (
              <p className="    ">{memberStatus.userNote}</p>
            )}
          </div>

          {currentMember?.role === "admin" && currentMember._id !== memberId ? (
            <div className="flex items-center gap-2 mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"outline"} className="w-full capitalize">
                    {member.role} <ChevronDownIcon className="size-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full ">
                  <DropdownMenuRadioGroup
                    value={member.role}
                    onValueChange={(role) =>
                      onUpdate(role as "admin" | "member")
                    }
                  >
                    <DropdownMenuRadioItem value="admin">
                      Admin
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="member">
                      Member
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={onRemove}
                variant={"outline"}
                className="w-full  "
              >
                Remove
              </Button>
            </div>
          ) : currentMember?._id === memberId &&
            currentMember.role !== "admin" ? (
            <div>
              <Button onClick={onLeave} variant="outline" className="w-full">
                Leave workspace
              </Button>
            </div>
          ) : null}
          <Link
            href={`/workspace/${workspaceId}/member/${member._id}`}
            className="w-full text-sm text-blue-500"
          >
            Talk to {member.user.name}
          </Link>
        </div>
        <Separator />
        <div className="flex flex-col p-4 ">
          <p className="text-sm font-bold mb-4 ">Contact information</p>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-md bg-muted flex items-center justify-center">
              <MailIcon className="size-4" />
            </div>
            <div className="flex flex-col ">
              <p className="text-[13px] font-semibold text-muted-foreground">
                Email Address
              </p>
              <Link
                className="text-sm hover:underline text-[#1264a3]"
                href={`mailto:${member.user.email}`}
              >
                {member.user.email}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FaChevronDown } from "react-icons/fa";
import { FcEndCall, FcPhone } from "react-icons/fc";
import { Doc } from "../../../../../../../convex/_generated/dataModel";
import { useMemberId } from "@/hooks/use-member-id";
import { useRouter, useSearchParams } from "next/navigation";

interface HeaderProps {
  memberName?: string;
  memberImage?: string;
  onClick?: () => void;
  currentUser: Doc<"members">;
  isCalling: boolean;
}

const Header = ({
  memberName = "Name",
  memberImage,
  onClick,
  currentUser,
  isCalling,
}: HeaderProps) => {
  const avatarFallBack = memberName.charAt(0).toUpperCase();
  const memberId = useMemberId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleCall = () => {
    const currentParams = new URLSearchParams(searchParams?.toString());
    if (currentParams.has("call")) {
      currentParams.delete("call");
    } else {
      currentParams.set("call", "true");
    }

    router.push(`?${currentParams.toString()}`);
  };
  const avatarOptimizedImageLink = memberImage
    ? `/api/image-proxy?url=${encodeURIComponent(memberImage)}&w=100`
    : memberImage;
  return (
    <div className="bg-white border-b  h-[49px] flex items-center px-4 overflow-hidden">
      <Button
        variant={"ghost"}
        className="text-lg font-semibold px-2 overflow-hidden w-auto"
        size={"sm"}
        onClick={onClick}
      >
        <Avatar className="size-6 mr-2">
          <AvatarImage src={avatarOptimizedImageLink} />
          <AvatarFallback className="rounded-md bg-sky-500 text-white text-sm">
            {avatarFallBack}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">{memberName}</span>
        <FaChevronDown className="size-2.5 ml-2" />
      </Button>
      {memberId != currentUser._id && (
        <div className="ml-auto">
          <Button onClick={handleCall} variant={"ghost"}>
            {isCalling ? <FcEndCall size={16} /> : <FcPhone size={16} />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Header;

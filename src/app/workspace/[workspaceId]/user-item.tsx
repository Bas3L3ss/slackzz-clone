import { cva, VariantProps } from "class-variance-authority";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import Link from "next/link";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";

const userItemVariants = cva(
  "flex items-center gap-1.5 justify-start font-normal h-7 px-4 text-sm overflow-hidden",
  {
    variants: {
      variant: {
        default: "text-[#f9edffcc]",
        active: "text-[#481349] bg-white/90 hover:bg-white/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface UserItemProps {
  id: Id<"members">;
  label?: string;
  image?: string;
  variant?: VariantProps<typeof userItemVariants>["variant"];
}

const UserItem = ({ id, image, label = "Member", variant }: UserItemProps) => {
  const workspaceId = useWorkSpaceId();
  const fallback = label.charAt(0).toUpperCase();
  const avatarOptimizedImageLink = image
    ? `/api/image-proxy?url=${encodeURIComponent(image)}&w=100`
    : image;
  return (
    <Button
      className={cn(userItemVariants({ variant: variant }))}
      size={"sm"}
      variant={"transparent"}
      asChild
    >
      <Link href={`/workspace/${workspaceId}/member/${id}`}>
        <Avatar className="size-5 rounded-md mr-1">
          <AvatarImage src={avatarOptimizedImageLink} alt={label} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <span className=" text-xs truncate">{label}</span>
      </Link>
    </Button>
  );
};

export default UserItem;

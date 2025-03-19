import React from "react";
import { LucideIcon } from "lucide-react";
import { IconType } from "react-icons/lib";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sidebarItemVariants = cva(
  "flex items-center gap-1.5 justify-start font-normal h-7 px-[18px] text-sm overflow-hidden",
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

interface SidebarItemProps {
  label: string;
  id: string;
  Icon: LucideIcon | IconType;
  isFunctionalRoute?: boolean;
  variant?: VariantProps<typeof sidebarItemVariants>["variant"];
}

const SidebarItem = ({
  isFunctionalRoute = false,
  Icon,
  id,
  label,
  variant,
}: SidebarItemProps) => {
  const workspaceId = useWorkSpaceId();
  const linkTo = isFunctionalRoute
    ? `/workspace/${workspaceId}/${id}`
    : `/workspace/${workspaceId}/channel/${id}`;
  return (
    <Button
      variant={"transparent"}
      size={"sm"}
      className={cn(sidebarItemVariants({ variant }))}
      asChild
    >
      <Link href={linkTo}>
        <Icon className="size-3.5 mr-1 shrink-0" />

        <span className="text-sm truncate">{label}</span>
      </Link>
    </Button>
  );
};

export default SidebarItem;

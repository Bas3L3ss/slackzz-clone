import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { IconType } from "react-icons/lib";

interface SideBarButtonProps {
  Icon: LucideIcon | IconType;
  label: string;
  goto: string;
  isActive?: boolean;
  notificationCount?: number;
}

const SideBarButton = ({
  Icon,
  isActive,
  label,
  goto,
  notificationCount,
}: SideBarButtonProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-y-0.5 cursor-pointer group relative">
      <Link href={goto} className="relative">
        <Button
          className={cn(
            isActive && "bg-accent/20",
            "size-9 p-2 group-hover:bg-accent/20"
          )}
          variant="transparent"
        >
          <Icon className="size-5 text-white group-hover:scale-110 transition-all" />
          {notificationCount !== undefined && notificationCount > 0 && (
            <div className="absolute -top-1.5 -right-2.5 flex items-center justify-center">
              <span
                className={cn(
                  "flex items-center justify-center bg-red-500 rounded-full",
                  notificationCount > 99 ? "min-w-[1.25rem] px-1" : "size-4",
                  "text-[9px] font-medium text-white"
                )}
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            </div>
          )}
        </Button>
      </Link>
      <span className="text-[11px] text-white group-hover:text-accent">
        {label}
      </span>
    </div>
  );
};

export default SideBarButton;

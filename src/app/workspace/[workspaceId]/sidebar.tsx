import UserButton from "@/features/auth/components/user-button";
import React from "react";
import WorkspaceSwitcher from "./workspace-switcher";
import SideBarButton from "./sidebar-buttons";
import { Bell, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { PiGearFineBold } from "react-icons/pi";
import { UseGetUnreadNotificationCounts } from "@/features/notifications/api/use-get-unread-notification-count";

const Sidebar = () => {
  const workspaceId = useWorkSpaceId();
  const pathName = usePathname();
  const {
    data: unreadNotificationCount,
    isLoading: isLoadingUnreadNotificationCount,
  } = UseGetUnreadNotificationCounts({
    workspaceId,
  });
  return (
    <aside className="w-[70px] h-full  bg-[#481349] flex flex-col gap-y-4  items-center pt-[9px] pb-4">
      <WorkspaceSwitcher />
      <SideBarButton
        Icon={Home}
        goto={`/workspace/${workspaceId}/`}
        label="Home"
        isActive={
          !pathName.includes("/activity") && !pathName.includes("/settings")
        }
      />
      {isLoadingUnreadNotificationCount ? null : (
        <SideBarButton
          goto={`/workspace/${workspaceId}/activity`}
          Icon={Bell}
          label="Activity"
          isActive={pathName.includes("/activity")}
          notificationCount={unreadNotificationCount}
        />
      )}
      <SideBarButton
        Icon={PiGearFineBold}
        goto={`/workspace/${workspaceId}/settings`}
        label="More"
        isActive={pathName.includes("/settings")}
      />
      <div className="flex flex-col items-center justify-center gap-y-1 mt-auto">
        <UserButton />
      </div>
    </aside>
  );
};

export default Sidebar;

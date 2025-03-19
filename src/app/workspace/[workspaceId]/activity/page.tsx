"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Bell,
  Calendar,
  Check,
  Info,
  AlertTriangle,
  AlertCircle,
  Circle,
  CheckCircle,
  MoreVertical,
  Trash,
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { getPristineUrl } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

type NotificationType = "info" | "success" | "warning" | "error" | "system";
type NotificationSource =
  | "mention"
  | "subscription"
  | "system"
  | "workspace"
  | "channel"
  | "direct_message";

type FilterType = NotificationType | "undefined" | undefined;
type FilterSource = NotificationSource | "undefined" | undefined;

export default function NotificationsPage() {
  const workspaceId = useWorkSpaceId();
  const [type, setType] = useState<FilterType>(undefined);
  const [source, setSource] = useState<FilterSource>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const notifications = useQuery(api.notification.getWorkspaceNotifications, {
    workspaceId,
    type: type === "undefined" ? undefined : type,
    source: source === "undefined" ? undefined : source,
    startDate: startDate?.getTime(),
    endDate: endDate?.getTime(),
    unreadOnly,
  });

  const markAsRead = useMutation(api.notification.markNotificationAsReadOnView);
  const markAsReadAll = useMutation(
    api.notification.markAllNotificationsAsRead
  );
  const deleteNotification = useMutation(api.notification.deleteNotification);
  const clearNotification = useMutation(api.notification.deleteAllNotification);

  // Setup intersection observer for viewport tracking
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.5, // 50% of the element needs to be visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const notificationId = entry.target.getAttribute(
            "data-notification-id"
          );
          if (notificationId) {
            markAsRead({
              notificationId: notificationId as Id<"notifications">,
            });
          }
        }
      });
    }, options);

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [markAsRead]);

  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;

    const elements = document.querySelectorAll(".notification-item");
    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      elements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, [notifications]);

  const getNotificationIcon = (type: NotificationType) => {
    const icons = {
      info: <Info className="h-4 w-4 text-blue-500" />,
      success: <Check className="h-4 w-4 text-green-500" />,
      warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      error: <AlertCircle className="h-4 w-4 text-red-500" />,
      system: <Bell className="h-4 w-4 text-gray-500" />,
    };
    return icons[type];
  };

  return (
    <div className="w-auto mx-auto">
      <header className="flex flex-col md:flex-row items-start p-3 lg:p-6 md:items-center justify-between gap-4 mb-6 sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Activities</h1>
          </div>
          <div className="hidden lg:block">
            <Separator orientation="vertical" className="h-6" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Select
              value={type}
              onValueChange={(value) => setType(value as FilterType)}
            >
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="undefined">All types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={source}
              onValueChange={(value) => setSource(value as FilterSource)}
            >
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="undefined">All sources</SelectItem>
                <SelectItem value="mention">Mentions</SelectItem>
                <SelectItem value="subscription">Subscriptions</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="workspace">Workspace</SelectItem>
                <SelectItem value="channel">Channel</SelectItem>
                <SelectItem value="direct_message">Direct Messages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-[240px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PP") : "Pick date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={{ from: startDate, to: endDate }}
                  onSelect={({ from, to }: any) => {
                    setStartDate(from);
                    setEndDate(to);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant={unreadOnly ? "default" : "outline"}
                onClick={() => setUnreadOnly(!unreadOnly)}
                className="flex-1 md:flex-none"
              >
                Unread only
              </Button>
              <Button
                variant="outline"
                onClick={() => clearNotification()}
                className="flex-1 md:flex-none"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() => markAsReadAll()}
                className="flex-1 md:flex-none"
              >
                Mark read
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4 max-h-[calc(100vh-12rem)] message-scrollbar overflow-y-auto pb-20">
        {notifications?.map((notification) => (
          <div
            key={notification._id}
            data-notification-id={notification._id}
            className={`notification-item p-3 sm:p-4 rounded-lg border transition-colors ${
              notification.isRead ? "bg-gray-50" : "bg-white"
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="mt-1 flex flex-col items-center gap-2">
                {getNotificationIcon(notification.type)}
                {notification.isRead ? (
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                ) : (
                  <Circle className="h-3 w-3 text-blue-500 fill-blue-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm sm:text-base truncate">
                    {notification.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">
                      {format(notification.createdAt, "PP p")}
                    </span>
                    <span className="text-xs text-gray-500 sm:hidden">
                      {format(notification.createdAt, "MM/dd")}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            deleteNotification({
                              notificationId: notification._id,
                            })
                          }
                          className="text-red-600 cursor-pointer"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-gray-600 mt-1 text-sm sm:text-base break-words">
                  {notification.message}
                </p>
                {notification.metadata?.url &&
                  notification.metadata?.messageId && (
                    <a
                      href={
                        getPristineUrl(notification.metadata.url) +
                        `#${notification.metadata.messageId}`
                      }
                      className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm mt-2 inline-block"
                    >
                      View details
                    </a>
                  )}
              </div>
            </div>
          </div>
        ))}

        {notifications?.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            No activities found
          </div>
        )}
      </div>
    </div>
  );
}

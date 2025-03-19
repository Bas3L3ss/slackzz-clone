"use client";

import React, { useState, useMemo } from "react";
import { Loader, Search, Shield, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useGetMembers } from "@/features/members/api/use-get-member";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { usePanel } from "@/hooks/use-panel";

interface UserStatus {
  _id: string;
  _creationTime: number;
  currentStatus: "online" | "offline";
  customStatusEmoji?: string;
  customStatusExpiresAt?: number | null;
  hasForcedOffline?: boolean;
  userId: string;
  userNote?: string;
}

interface User {
  _id: string;
  _creationTime: number;
  email: string;
  emailVerificationTime?: number;
  image?: string;
  name: string;
  userStatus?: UserStatus;
}

interface Member {
  _id: string;
  _creationTime: number;
  role: "admin" | "member";
  user: User;
  userId: string;
  workspaceId: string;
}

interface MemberItemProps {
  member: Member;
}

interface MemberSectionProps {
  title?: string;
  members: Member[];
  showCount?: boolean;
}

const MemberItem: React.FC<MemberItemProps> = ({ member }) => {
  const isOffline = member.user.userStatus?.currentStatus === "offline";
  const { onOpenProfile } = usePanel();

  return (
    <button
      onClick={() => onOpenProfile(member._id)}
      className={`flex items-center gap-3 w-full px-2 py-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors
      ${isOffline ? "opacity-50" : ""}`}
    >
      <div className="relative">
        <Avatar>
          <AvatarImage
            src={member.user.image}
            alt={member.user.name || "user"}
          />
          <AvatarFallback className="bg-sky-500">
            {member.user.name?.charAt(0).toUpperCase() ||
              member.user.email?.charAt(0).toUpperCase() ||
              "?"}
          </AvatarFallback>
          <div
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background
            ${isOffline ? "bg-gray-500" : "bg-green-500"}`}
          />
        </Avatar>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {member.user.name}
          </span>
          {member.role === "admin" && (
            <Shield className="h-4 w-4 text-blue-400" />
          )}
        </div>
        {member.user.userStatus?.userNote && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {member.user.userStatus.customStatusEmoji && (
              <span>{member.user.userStatus.customStatusEmoji}</span>
            )}
            <span className="truncate">{member.user.userStatus.userNote}</span>
          </div>
        )}
      </div>
    </button>
  );
};

const MemberSection: React.FC<MemberSectionProps> = ({
  title,
  members,
  showCount = true,
}) => {
  if (!members.length) return null;

  return (
    <div className="mb-4">
      {title && (
        <div className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase">
          {title} {showCount && `— ${members.length}`}
        </div>
      )}
      <div className="space-y-0.5">
        {members.map((member) => (
          <MemberItem key={member._id} member={member} />
        ))}
      </div>
    </div>
  );
};

const MemberListPage: React.FC = () => {
  const workspaceId = useWorkSpaceId();
  const { data: members, isLoading } = useGetMembers({
    workspaceId,
    isNeedStatus: true,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndSortedMembers = useMemo(() => {
    if (!members) return { admins: [], onlineMembers: [], offlineMembers: [] };

    const filtered = members.filter((member) =>
      member.user?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      admins: filtered.filter(
        (member) =>
          member.role === "admin" &&
          member.user?.userStatus?.currentStatus === "online"
      ),
      onlineMembers: filtered.filter(
        (member) =>
          member.role === "member" &&
          member.user?.userStatus?.currentStatus === "online"
      ),
      offlineMembers: filtered.filter(
        (member) => member.user?.userStatus?.currentStatus === "offline"
      ),
    };
  }, [members, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-3 p-4 sm:p-6 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Members</h1>
          </div>
          <div className="hidden md:flex md:items-center">
            <Separator orientation="vertical" className="h-6" />
          </div>
          <div className="relative flex-1 w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members"
              className="pl-9 bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 w-full overflow-auto message-scrollbar">
        <div className="p-6">
          <div className="space-y-4">
            <MemberSection
              title="Admins"
              members={filteredAndSortedMembers.admins}
            />
            <MemberSection
              title="Members"
              members={filteredAndSortedMembers.onlineMembers}
            />
            <MemberSection
              members={filteredAndSortedMembers.offlineMembers}
              showCount={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberListPage;

"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AvatarFallback } from "@radix-ui/react-avatar";
import React, { useState } from "react";
import { useCurrentUser } from "../hooks/use-current-user";
import { Loader, LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

function UserButton() {
  const { data, isLoading } = useCurrentUser();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const { signOut } = useAuthActions();
  const handleSignOut = async () => {
    setIsLoggingOut(true); // Set it to true immediately

    try {
      await signOut(); // Wait for the sign-out process to complete
      router.push("/auth"); // Redirect after sign-out is successful
    } catch (error) {
      console.error("Error during sign-out", error); // Handle potential errors
    } finally {
      setIsLoggingOut(false); // Reset after the process finishes
    }
  };

  if (isLoading)
    return <Loader className="size-4 animate-spin text-muted-foreground" />;

  if (!data) return null;
  const { image, name } = data;

  const avatarFallback = name!.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none relative">
        <Avatar className="size-10 hover:opacity-75 transition">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback className="flex w-full items-center justify-center bg-gray-200">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="right" className="w-60">
        <DropdownMenuItem
          className={`${isLoggingOut ? "opacity-75" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            handleSignOut();
          }}
        >
          <LogOut className="size-4 mr-2" />
          {!isLoggingOut ? "Log out" : "Logging out...."}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserButton;
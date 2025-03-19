"use client";
import { createContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import io, { Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

type PresenceContextType = undefined;

const PresenceContext = createContext<PresenceContextType | null>(null);

export const PresenceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.replace("/auth");
    }
  }, [isAuthenticated, router, isLoading]);

  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?._id;

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("register", {
        userId,
      });
    });

    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  return (
    <PresenceContext.Provider value={undefined}>
      {children}
    </PresenceContext.Provider>
  );
};

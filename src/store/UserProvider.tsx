// src/store/UserProvider.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "./useAuthStore";
import type { AuthPayload } from "@/lib/types"

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: AuthPayload | null;
  children: ReactNode;
}) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser, setUser]);

  return <>{children}</>;
}

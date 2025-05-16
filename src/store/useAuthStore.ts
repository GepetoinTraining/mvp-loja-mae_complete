import { create } from "zustand";
import type { AuthPayload } from "../lib/types"

interface AuthState {
  // passe a permitir `null`
  user: AuthPayload | null
  // e o setter também recebe `AuthPayload | null`
  setUser: (user: AuthPayload | null) => void
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,                // inicialmente sem usuário
  setUser: user => set({ user }),
}))

if (typeof window !== "undefined") {
  (window as any).auth = useAuthStore;
}

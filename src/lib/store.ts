// /home/ubuntu/mvp-loja-mae-rebuilt/src/lib/store.ts
import { create } from "zustand";

// Define a placeholder User type or import the actual one if available
// For now, using unknown to satisfy linting, replace with actual User type later.
interface UserProfile { 
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string; // Or your specific UserRole enum/type
  // Add other relevant user properties
}

interface AppState {
  user: UserProfile | null; // Changed from any to UserProfile
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void; // Changed from any to UserProfile
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

interface OfflineSyncState {
  isSyncing: boolean;
  pendingSyncItems: number;
  lastSyncStatus: "success" | "error" | "idle";
  setSyncing: (syncing: boolean) => void;
  setPendingItems: (count: number) => void;
  setLastSyncStatus: (status: "success" | "error" | "idle") => void;
}

export const useOfflineSyncStore = create<OfflineSyncState>((set) => ({
    isSyncing: false,
    pendingSyncItems: 0,
    lastSyncStatus: "idle",
    setSyncing: (syncing) => set({ isSyncing: syncing }),
    setPendingItems: (count) => set({ pendingSyncItems: count }),
    setLastSyncStatus: (status) => set({ lastSyncStatus: status }),
}));


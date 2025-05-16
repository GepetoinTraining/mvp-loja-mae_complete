import { get, set, del, clear, keys } from "idb-keyval";

// Generic store for offline data
const OFFLINE_STORE_PREFIX = "offline-data-";

// Store for queued mutations (create, update, delete actions)
const MUTATION_QUEUE_KEY = "mutation-queue";

export interface QueuedMutation {
  id: string; // Unique ID for the mutation (e.g., UUID)
  type: "CREATE" | "UPDATE" | "DELETE";
  entity: string; // e.g., "visita", "checklistInstalacaoItem"
  payload: any; // Data for create/update, or ID for delete
  timestamp: number;
  status: "PENDING" | "PROCESSING" | "FAILED";
  attempts?: number;
  error?: string | null;
  relatedEntityId?: string; // e.g. Visita ID for a checklist item
}

// --- Generic Offline Data Storage ---
export const getOfflineData = async <T>(key: string): Promise<T | undefined> => {
  return get<T>(`${OFFLINE_STORE_PREFIX}${key}`);
};

export const setOfflineData = async <T>(key: string, data: T): Promise<void> => {
  return set(`${OFFLINE_STORE_PREFIX}${key}`, data);
};

export const deleteOfflineData = async (key: string): Promise<void> => {
  return del(`${OFFLINE_STORE_PREFIX}${key}`);
};

export const clearOfflineData = async (): Promise<void> => {
  // Be cautious with this, it will clear all prefixed offline data
  const allKeys = await keys();
  const offlineKeys = allKeys.filter(k => typeof k === "string" && k.startsWith(OFFLINE_STORE_PREFIX));
  await Promise.all(offlineKeys.map(k => del(k)));
};

// --- Mutation Queue Management ---
export const getMutationQueue = async (): Promise<QueuedMutation[]> => {
  const queue = await get<QueuedMutation[]>(MUTATION_QUEUE_KEY);
  return queue || [];
};

export const addToMutationQueue = async (mutation: Omit<QueuedMutation, "id" | "timestamp" | "status" | "attempts">): Promise<QueuedMutation> => {
  const queue = await getMutationQueue();
  const newMutation: QueuedMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    status: "PENDING",
    attempts: 0,
  };
  queue.push(newMutation);
  await set(MUTATION_QUEUE_KEY, queue);
  return newMutation;
};

export const updateMutationInQueue = async (mutationId: string, updates: Partial<QueuedMutation>): Promise<void> => {
  const queue = await getMutationQueue();
  const index = queue.findIndex(m => m.id === mutationId);
  if (index !== -1) {
    queue[index] = { ...queue[index], ...updates };
    await set(MUTATION_QUEUE_KEY, queue);
  }
};

export const removeMutationFromQueue = async (mutationId: string): Promise<void> => {
  let queue = await getMutationQueue();
  queue = queue.filter(m => m.id !== mutationId);
  await set(MUTATION_QUEUE_KEY, queue);
};

export const clearMutationQueue = async (): Promise<void> => {
  await del(MUTATION_QUEUE_KEY);
};

// --- Specific Offline Storage Examples (to be expanded) ---

// Example: Storing an offline Visita form data
export const getOfflineVisita = (visitaId: string) => getOfflineData<any>(`visita-${visitaId}`);
export const setOfflineVisita = (visitaId: string, data: any) => setOfflineData(`visita-${visitaId}`, data);
export const deleteOfflineVisita = (visitaId: string) => deleteOfflineData(`visita-${visitaId}`);

// Example: Storing an offline Checklist form data
export const getOfflineChecklist = (checklistId: string) => getOfflineData<any>(`checklist-${checklistId}`);
export const setOfflineChecklist = (checklistId: string, data: any) => setOfflineData(`checklist-${checklistId}`, data);
export const deleteOfflineChecklist = (checklistId: string) => deleteOfflineData(`checklist-${checklistId}`);

// --- Online/Offline Status Management (Conceptual - usually handled by browser events and context) ---
// You would typically use a React Context or Zustand store to manage online status globally.
// const [isOnline, setIsOnline] = useState(navigator.onLine);
// useEffect(() => {
//   const handleOnline = () => setIsOnline(true);
//   const handleOffline = () => setIsOnline(false);
//   window.addEventListener("online", handleOnline);
//   window.addEventListener("offline", handleOffline);
//   return () => {
//     window.removeEventListener("online", handleOnline);
//     window.removeEventListener("offline", handleOffline);
//   };
// }, []);

console.log("Offline utilities loaded.");


import type { LeadDTO } from "@/lib/types";
import { LeadStatus } from "@prisma/client";
import { get, set, del, clear, keys } from "idb-keyval";

// --- Keys ---
const CACHED_LEADS_KEY = "cached-leads-list";
const OFFLINE_LEAD_NOTES_KEY = "offline-lead-notes";

/**
 * Represents an offline note associated with a Lead
 */
export interface OfflineItem {
  id: string;
  parentId: string;   // e.g., lead ID
  content: string;
  timestamp: number;
}

/**
 * Cache the full list of leads for offline access
 */
export async function cacheLeadsList(leads: LeadDTO[]): Promise<void> {
  await set<LeadDTO[]>(CACHED_LEADS_KEY, leads);
}

/**
 * Retrieve the cached list of leads
 */
export async function getCachedLeadsList(): Promise<LeadDTO[]> {
  return (await get<LeadDTO[]>(CACHED_LEADS_KEY)) || [];
}

/**
 * Retrieve all offline notes for leads
 */
export async function getOfflineLeadNotes(): Promise<OfflineItem[]> {
  return (await get<OfflineItem[]>(OFFLINE_LEAD_NOTES_KEY)) || [];
}

/**
 * Add a new offline note for a lead
 */
export async function addOfflineLeadNote(item: OfflineItem): Promise<void> {
  const notes = await getOfflineLeadNotes();
  notes.push(item);
  await set<OfflineItem[]>(OFFLINE_LEAD_NOTES_KEY, notes);
}

/**
 * Remove an offline note by its ID
 */
export async function removeOfflineLeadNote(id: string): Promise<void> {
  const notes = await getOfflineLeadNotes();
  const filtered = notes.filter((note) => note.id !== id);
  await set<OfflineItem[]>(OFFLINE_LEAD_NOTES_KEY, filtered);
}

// ---------------------------------------------------------------------
// Generic Offline Data Storage (other entities)

const OFFLINE_STORE_PREFIX = "offline-data-";
const MUTATION_QUEUE_KEY = "mutation-queue";

export interface QueuedMutation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  payload: any;
  timestamp: number;
  status: "PENDING" | "PROCESSING" | "FAILED";
  attempts?: number;
  error?: string | null;
  relatedEntityId?: string;
}

export const getOfflineData = async <T>(key: string): Promise<T | undefined> =>
  get<T>(`${OFFLINE_STORE_PREFIX}${key}`);
export const setOfflineData = async <T>(key: string, data: T): Promise<void> =>
  set(`${OFFLINE_STORE_PREFIX}${key}`, data);
export const deleteOfflineData = async (key: string): Promise<void> =>
  del(`${OFFLINE_STORE_PREFIX}${key}`);
export const clearOfflineData = async (): Promise<void> => {
  const allKeys = await keys();
  const offlineKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(OFFLINE_STORE_PREFIX)
  );
  await Promise.all(offlineKeys.map((k) => del(k as string)));
};

export const getMutationQueue = async (): Promise<QueuedMutation[]> =>
  (await get<QueuedMutation[]>(MUTATION_QUEUE_KEY)) || [];

export const addToMutationQueue = async (
  mutation: Omit<QueuedMutation, "id" | "timestamp" | "status" | "attempts">
): Promise<QueuedMutation> => {
  const queue = await getMutationQueue();
  const newMutation: QueuedMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    status: "PENDING",
    attempts: 0,
  };
  queue.push(newMutation);
  await set(MUTATION_QUEUE_KEY, queue);
  return newMutation;
};

export const updateMutationInQueue = async (
  mutationId: string,
  updates: Partial<QueuedMutation>
): Promise<void> => {
  const queue = await getMutationQueue();
  const idx = queue.findIndex((m) => m.id === mutationId);
  if (idx !== -1) {
    queue[idx] = { ...queue[idx], ...updates };
    await set(MUTATION_QUEUE_KEY, queue);
  }
};

export const removeMutationFromQueue = async (
  mutationId: string
): Promise<void> => {
  let queue = await getMutationQueue();
  queue = queue.filter((m) => m.id !== mutationId);
  await set(MUTATION_QUEUE_KEY, queue);
};

export const clearMutationQueue = async (): Promise<void> =>
  del(MUTATION_QUEUE_KEY);

console.log("Offline utilities loaded.");

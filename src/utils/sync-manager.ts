import {
  getOfflineVisitas,
  getOfflineChecklists,
  getOfflineLeadNotes,
  getOfflineClientNotes,
  removeOfflineVisita,
  removeOfflineChecklist,
  removeOfflineLeadNote,
  removeOfflineClientNote,
  updateOfflineVisita,
  updateOfflineChecklist,
  updateOfflineLeadNote,
  updateOfflineClientNote,
  getOfflineFile,
  deleteAllOfflineFilesForItem,
  OfflineItem
} from "./offline-utils";
import { toast } from "sonner";

let isSyncing = false;
let syncIntervalId: NodeJS.Timeout | null = null;

interface SyncPreferences {
  allowMobileData: boolean;
}

const DEFAULT_SYNC_PREFERENCES: SyncPreferences = {
  allowMobileData: false,
};

const SYNC_PREFERENCES_KEY = "sync_preferences";

async function getSyncPreferences(): Promise<SyncPreferences> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const prefs = localStorage.getItem(SYNC_PREFERENCES_KEY);
      return prefs ? JSON.parse(prefs) : DEFAULT_SYNC_PREFERENCES;
    }
    return DEFAULT_SYNC_PREFERENCES;
  } catch (error) {
    console.error("Error getting sync preferences:", error);
    return DEFAULT_SYNC_PREFERENCES;
  }
}

export async function saveSyncPreferences(prefs: SyncPreferences): Promise<void> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(SYNC_PREFERENCES_KEY, JSON.stringify(prefs));
      toast.success("Preferências de sincronização salvas!");
    }
  } catch (error) {
    console.error("Error saving sync preferences:", error);
    toast.error("Erro ao salvar preferências de sincronização.");
  }
}

interface NavigatorConnection {
  type?: string;
  effectiveType?: string;
  downlinkMax?: number;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  onchange?: EventListenerOrEventListenerObject | null;
  // Add other properties if used, like mozConnection, webkitConnection if they are accessed directly
}

async function canSync(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return false;
  }
  const prefs = await getSyncPreferences();
  if (prefs.allowMobileData) {
    return true; 
  }
  if (typeof navigator !== "undefined") {
    const nav = navigator as unknown as { connection?: NavigatorConnection, mozConnection?: NavigatorConnection, webkitConnection?: NavigatorConnection };
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection && connection.type === "wifi") {
      return true;
    }
    // Allow sync if connection type is not cellular, bluetooth, or wimax (i.e., likely ethernet or unknown but not metered)
    if (connection && connection.type !== "cellular" && connection.type !== "bluetooth" && connection.type !== "wimax") {
        return true;
    }
    // If connection object itself is not available, assume we can sync (e.g., desktop with ethernet not reporting type)
    if (!connection) return true; 
  }
  
  toast.info("Sincronização pausada. Conecte-se a uma rede Wi-Fi ou permita dados móveis nas configurações.");
  return false;
}

// Define a more specific type for photo objects if possible
interface PhotoData {
    id: string;
    offlinePath?: string;
    url?: string;
    type?: string; // e.g., 'ASSINATURA_CLIENTE'
    // other photo properties
}

async function syncGenericItem(item: OfflineItem): Promise<boolean> {
  const { id: offlineId, parentId, data, type } = item;
  let endpoint = "";
  let method: "POST" | "PUT" = "POST";
  let updateFn: (id: string, updates: Partial<OfflineItem>) => Promise<OfflineItem | undefined>;
  let removeFn: (id: string) => Promise<void>;
  let successMessage = "";
  let payload: Record<string, unknown> = { ...(data as Record<string, unknown>) }; // Assert data as Record for initial spread

  const itemIdFromData = (data as { id?: string })?.id;

  switch (type) {
    case "visita":
      endpoint = itemIdFromData && !itemIdFromData.startsWith("offline_") ? `/api/visitas/${itemIdFromData}` : "/api/visitas";
      method = itemIdFromData && !itemIdFromData.startsWith("offline_") ? "PUT" : "POST";
      updateFn = updateOfflineVisita;
      removeFn = removeOfflineVisita;
      successMessage = "Visita sincronizada com sucesso!";
      break;
    case "checklist":
      endpoint = itemIdFromData && !itemIdFromData.startsWith("offline_") ? `/api/checklist-instalacao/${itemIdFromData}` : "/api/checklist-instalacao";
      method = itemIdFromData && !itemIdFromData.startsWith("offline_") ? "PUT" : "POST";
      updateFn = updateOfflineChecklist;
      removeFn = removeOfflineChecklist;
      successMessage = "Checklist de instalação sincronizado!";
      
      if (payload.fotos && Array.isArray(payload.fotos)) {
        const onlineFotos: PhotoData[] = [];
        for (const photo of payload.fotos as PhotoData[]) { // Assert photo type
          if (photo.offlinePath && photo.id) {
            const fileBlob = await getOfflineFile(offlineId, photo.id);
            if (fileBlob) {
              console.warn(`File ${photo.id} for ${offlineId} needs actual upload mechanism.`);
              onlineFotos.push({ ...photo, url: `placeholder_uploaded_url_for_${photo.id}`, offlinePath: undefined });
            } else {
              onlineFotos.push(photo);
            }
          } else {
            onlineFotos.push(photo); // Push photo if not offline or no id
          }
        }
        payload.fotos = onlineFotos;
      }
      if (payload.assinaturaClienteUrl === "offline_signature" && Array.isArray(payload.fotos)) {
        const sigPhoto = (payload.fotos as PhotoData[]).find((p: PhotoData) => p.type === "ASSINATURA_CLIENTE" && p.offlinePath);
        if (sigPhoto && sigPhoto.id) {
          const sigBlob = await getOfflineFile(offlineId, sigPhoto.id);
          if (sigBlob) {
            payload.assinaturaClienteUrl = `placeholder_uploaded_signature_url_for_${sigPhoto.id}`;
            sigPhoto.url = payload.assinaturaClienteUrl as string;
            sigPhoto.offlinePath = undefined;
          } else {
            payload.assinaturaClienteUrl = null;
          }
        } else {
          payload.assinaturaClienteUrl = null;
        }
      }
      break;
    case "lead_note":
      if (!parentId) throw new Error("Lead ID (parentId) é obrigatório para sincronizar nota de lead.");
      endpoint = `/api/leads/${parentId}/notes`; 
      method = "POST";
      updateFn = updateOfflineLeadNote;
      removeFn = removeOfflineLeadNote;
      successMessage = "Nota de lead sincronizada!";
      payload = { content: (data as { content?: string })?.content }; 
      break;
    case "client_note":
      if (!parentId) throw new Error("Client ID (parentId) é obrigatório para sincronizar nota de cliente.");
      endpoint = `/api/clientes/${parentId}/notes`;
      method = "POST";
      updateFn = updateOfflineClientNote;
      removeFn = removeOfflineClientNote;
      successMessage = "Nota de cliente sincronizada!";
      payload = { content: (data as { content?: string })?.content }; 
      break;
    default:
      console.error("Tipo de item offline desconhecido:", type);
      return false;
  }

  await updateFn(offlineId, { status: "syncing" });

  try {
    const response = await fetch(endpoint, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error((errorData as { error?: string })?.error || `Falha ao sincronizar ${type}`);
    }

    await removeFn(offlineId);
    if (type === "checklist" || type === "visita") { 
        await deleteAllOfflineFilesForItem(offlineId);
    }
    toast.success(successMessage);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`Erro ao sincronizar ${type} ${offlineId}:`, error);
    await updateFn(offlineId, { status: "failed", error: errorMessage });
    toast.error(`Falha ao sincronizar ${type}: ${errorMessage}`);
    return false;
  }
}

export async function triggerSync(force = false): Promise<void> {
  if (isSyncing && !force) {
    toast.info("Sincronização já em progresso.");
    return;
  }

  if (!await canSync()) {
    return;
  }

  isSyncing = true;
  toast.loading("Sincronizando dados offline...");

  let successCount = 0;
  let failureCount = 0;

  const processQueue = async (getItemsFn: () => Promise<OfflineItem[]>) => {
    const items = await getItemsFn();
    for (const item of items) {
      if (item.status === "pending" || item.status === "failed" || force) {
        const success = await syncGenericItem(item);
        if (success) successCount++; else failureCount++;
      }
    }
  };

  await processQueue(getOfflineVisitas);
  await processQueue(getOfflineChecklists);
  await processQueue(getOfflineLeadNotes);
  await processQueue(getOfflineClientNotes);

  isSyncing = false;
  toast.dismiss(); 

  if (successCount === 0 && failureCount === 0) {
    const allQueues = [
      ...(await getOfflineVisitas()), 
      ...(await getOfflineChecklists()), 
      ...(await getOfflineLeadNotes()), 
      ...(await getOfflineClientNotes())
    ];
    if(allQueues.filter(item => item.status === "pending" || item.status === "failed").length === 0){
        toast.info("Nenhum item para sincronizar.");
    }
  } else {
    if (successCount > 0) toast.success(`${successCount} item(s) sincronizado(s) com sucesso.`);
    if (failureCount > 0) toast.error(`${failureCount} item(s) falharam ao sincronizar. Verifique a fila.`);
  }
  
  if (typeof window !== "undefined") {
    const event = new Event("offlineQueueUpdated");
    window.dispatchEvent(event);
  }
}

export function startBackgroundSync(intervalMinutes = 5): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
  }
  triggerSync(); 
  syncIntervalId = setInterval(() => {
    triggerSync();
  }, intervalMinutes * 60 * 1000);
  console.log(`Background sync started. Interval: ${intervalMinutes} minutes.`);
}

export function stopBackgroundSync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log("Background sync stopped.");
  }
}


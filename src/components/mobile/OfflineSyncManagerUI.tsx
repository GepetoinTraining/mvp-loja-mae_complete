"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  getOfflineVisitas,
  getOfflineChecklists,
  OfflineItem
} from "@/lib/offline-utils";
import {
  triggerSync,
  saveSyncPreferences,
} from "@/lib/sync-manager";

interface SyncPreferences {
  allowMobileData: boolean;
}

const SYNC_PREFERENCES_KEY = "sync_preferences";
const DEFAULT_SYNC_PREFERENCES: SyncPreferences = {
  allowMobileData: false,
};

export function OfflineSyncManagerUI() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingVisitas, setPendingVisitas] = useState<OfflineItem[]>([]);
  const [pendingChecklists, setPendingChecklists] = useState<OfflineItem[]>([]);
  const [syncPreferences, setSyncPreferences] = useState<SyncPreferences>(DEFAULT_SYNC_PREFERENCES);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  const fetchOfflineQueues = async () => {
    setIsLoadingQueue(true);
    try {
      const visitas = await getOfflineVisitas();
      const checklists = await getOfflineChecklists();
      setPendingVisitas(visitas);
      setPendingChecklists(checklists);
    } catch (error) {
      console.error("Error fetching offline queues:", error);
      toast.error("Erro ao carregar filas offline.");
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
        setIsOnline(navigator.onLine);

        const storedPrefs = localStorage.getItem(SYNC_PREFERENCES_KEY);
        if (storedPrefs) {
            try {
                setSyncPreferences(JSON.parse(storedPrefs));
            } catch (e) {
                console.error("Failed to parse sync preferences from localStorage", e);
                localStorage.removeItem(SYNC_PREFERENCES_KEY); // Clear corrupted data
            }
        }

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        fetchOfflineQueues();

        const handleQueueUpdate = () => fetchOfflineQueues();
        window.addEventListener("offlineQueueUpdated", handleQueueUpdate);

        return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("offlineQueueUpdated", handleQueueUpdate);
        };
    }
  }, []);

  const handleTriggerSync = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("Você está offline. Conecte-se para sincronizar.");
      return;
    }
    await triggerSync(true); 
    fetchOfflineQueues(); 
  };

  const handlePreferenceChange = (newPrefs: Partial<SyncPreferences>) => {
    const updatedPrefs = { ...syncPreferences, ...newPrefs };
    setSyncPreferences(updatedPrefs);
    saveSyncPreferences(updatedPrefs);
  };

  const totalPendingItems = pendingVisitas.length + pendingChecklists.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status da Conexão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={isOnline ? "text-green-600" : "text-red-600"}>
            Você está atualmente: {isOnline ? "Online" : "Offline"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências de Sincronização</CardTitle>
          <CardDescription>
            Controle como e quando seus dados offline são sincronizados com o servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="allowMobileData"
              checked={syncPreferences.allowMobileData}
              onCheckedChange={(checked) => handlePreferenceChange({ allowMobileData: checked })}
              aria-label="Permitir sincronização via dados móveis"
            />
            <Label htmlFor="allowMobileData">Permitir sincronização via dados móveis</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Se desativado, a sincronização ocorrerá apenas em redes Wi-Fi.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fila de Sincronização Offline</CardTitle>
          <CardDescription>
            Itens criados ou modificados offline que aguardam envio para o servidor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingQueue ? (
            <p>Carregando itens da fila...</p>
          ) : totalPendingItems > 0 ? (
            <div className="space-y-4">
              <p>Total de itens pendentes: {totalPendingItems}</p>
              {pendingVisitas.length > 0 && (
                <div>
                  <h4 className="font-semibold">Visitas Pendentes: {pendingVisitas.length}</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {pendingVisitas.map(item => (
                      <li key={item.id}>ID: {item.id.substring(0,15)}... - Status: {item.status} {item.error && <span className="text-red-500">({item.error})</span>}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pendingChecklists.length > 0 && (
                <div>
                  <h4 className="font-semibold">Checklists Pendentes: {pendingChecklists.length}</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {pendingChecklists.map(item => (
                      <li key={item.id}>ID: {item.id.substring(0,15)}... - Status: {item.status} {item.error && <span className="text-red-500">({item.error})</span>}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p>Nenhum item na fila de sincronização.</p>
          )}
          <Button onClick={handleTriggerSync} disabled={!isOnline || isLoadingQueue} className="mt-4 w-full">
            {isLoadingQueue ? "Verificando Fila..." : "Sincronizar Agora"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


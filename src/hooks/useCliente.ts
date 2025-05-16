// src/hooks/useCliente.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Cliente } from "@/lib/types";

interface UseClienteResult {
  cliente: Cliente | null;
  isLoading: boolean;
  error: Error | null;
  updateCliente: (data: Partial<Cliente>) => Promise<void>;
}

/**
 * Hook para buscar e atualizar um cliente específico.
 * @param id ID do cliente
 */
export function useCliente(id: string | undefined): UseClienteResult {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch inicial
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/clientes/${id}`);
        if (!res.ok) throw new Error(`Código ${res.status}`);
        const data: Cliente = await res.json();
        setCliente(data);
      } catch (err: any) {
        console.error("Erro ao carregar cliente", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  // Função de atualização via PATCH
  const updateCliente = useCallback(
    async (updates: Partial<Cliente>) => {
      if (!id) throw new Error("ID do cliente ausente");
      setIsLoading(true);
      try {
        const res = await fetch(`/api/clientes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error(`Código ${res.status}`);
        const updated: Cliente = await res.json();
        setCliente(updated);
      } catch (err: any) {
        console.error("Erro ao atualizar cliente", err);
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [id]
  );

  return { cliente, isLoading, error, updateCliente };
}

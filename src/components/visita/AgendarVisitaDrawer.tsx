"use client";

import { useState } from "react";
import { getVendedorId } from "@/utils/auth";

type AgendarVisitaDrawerProps = {
  open: boolean;
  onClose: () => void;
  clienteId: string;
};

export function AgendarVisitaDrawer({
  open,
  onClose,
  clienteId,
}: AgendarVisitaDrawerProps) {
  const [dataHora, setDataHora] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAgendar = async () => {
    const vendedorId = getVendedorId(); // ← agora seguro

    if (!dataHora) return alert("Escolha uma data e horário válidos.");
    if (!vendedorId) return alert("Usuário não autenticado.");

    setLoading(true);

    const res = await fetch("/api/visitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        vendedorId,
        dataHora,
      }),
    });

    setLoading(false);
    if (res.ok) {
      onClose();
      setDataHora("");
    } else {
      alert("Erro ao agendar visita.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold">Agendar Visita</h2>
        <p className="text-sm text-muted-foreground">
          Escolha data e horário para o cliente:
        </p>

        <input
          type="datetime-local"
          value={dataHora}
          onChange={(e) => setDataHora(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="text-sm text-muted-foreground">
            Cancelar
          </button>
          <button
            onClick={handleAgendar}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            {loading ? "Salvando..." : "Agendar Visita"}
          </button>
        </div>
      </div>
    </div>
  );
}

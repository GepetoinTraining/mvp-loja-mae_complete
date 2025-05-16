"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function AgendarVisitaDrawer({
  open,
  onClose,
  clienteId,
}: {
  open: boolean;
  onClose: () => void;
  clienteId: string;
}) {
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [tipo, setTipo] = useState("medicao");
  const [loading, setLoading] = useState(false);

  const handleAgendar = async () => {
    if (!data || !hora) {
      alert("Preencha a data e hora.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/visitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        vendedorId: user?.id,
        dataHora: `${data}T${hora}`,
        tipoVisita: tipo,
      }),
    });

    setLoading(false);

    if (res.ok) {
      onClose();
      setData("");
      setHora("");
      setTipo("medicao");
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
          Para o cliente: <strong>{clienteId}</strong>
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <label className="block text-sm font-medium">Hora</label>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <label className="block text-sm font-medium">Tipo de Visita</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="medicao">Medição</option>
            <option value="instalacao">Instalação</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div className="flex justify-between pt-4">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground underline"
          >
            Cancelar
          </button>

          <button
            onClick={handleAgendar}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            {loading ? "Agendando..." : "Agendar"}
          </button>
        </div>
      </div>
    </div>
  );
}

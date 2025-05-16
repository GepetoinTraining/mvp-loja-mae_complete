"use client";

import { useEffect, useState } from "react";

export function StepEndereco({ visita, onNext }: { visita: any; onNext: () => void }) {
  const [chegadaConfirmada, setChegadaConfirmada] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);

  const registrarChegada = () => {
    setChegadaConfirmada(true);
    console.log("Hora de chegada:", new Date().toISOString());
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Endereço do Cliente</h2>
        <p className="text-muted-foreground">
          {visita.cliente.rua}, {visita.cliente.numero} – {visita.cliente.bairro}, {visita.cliente.cidade} - {visita.cliente.estado}
        </p>
      </div>

      {!chegadaConfirmada && (
        <button
          onClick={registrarChegada}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Confirmar Chegada
        </button>
      )}

      {chegadaConfirmada && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Foto da Fachada</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
            />
          </div>

          <button
            onClick={onNext}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            disabled={!foto}
          >
            Próximo: Ambiente
          </button>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useVisitaFormState } from "../useVisitaFormState";

const ambientesPadrao = [
  "Sala",
  "Quarto",
  "Cozinha",
  "Banheiro",
  "Área de Serviço",
  "Varanda",
  "Outro",
];

export function StepAmbiente({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [ambienteSelecionado, setAmbienteSelecionado] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const { addAmbiente } = useVisitaFormState();

  const podeAvancar = ambienteSelecionado !== "";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Ambiente</h2>

      <div>
        <label className="block text-sm mb-1">Selecione o ambiente</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={ambienteSelecionado}
          onChange={(e) => setAmbienteSelecionado(e.target.value)}
        >
          <option value="">-- Escolha --</option>
          {ambientesPadrao.map((amb) => (
            <option key={amb} value={amb}>
              {amb}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Observações</label>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Alguma observação sobre este ambiente..."
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground underline"
        >
          Voltar
        </button>

        <button
          onClick={() => {
            addAmbiente({ nome: ambienteSelecionado, observacoes });
            onNext();
          }}
          disabled={!podeAvancar}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
        >
          Próximo: Produto
        </button>
      </div>
    </div>
  );
}
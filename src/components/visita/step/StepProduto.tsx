"use client";

import { useVisitaFormState } from "../useVisitaFormState";
import { useState } from "react";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const opcoesProdutos = [
  { tipo: "cortina", label: "Cortina" },
  { tipo: "persiana", label: "Persiana" },
  { tipo: "papel_parede", label: "Papel de Parede" },
  { tipo: "rodape", label: "Rodapé" },
  { tipo: "boiserie", label: "Boiserie" },
  { tipo: "moveis", label: "Móveis Planejados" },
  { tipo: "almofadas", label: "Almofadas" },
  { tipo: "trilho", label: "Trilho" },
  { tipo: "outros", label: "Outros" },
];

export function StepProduto({ onNext, onBack }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const { ambientes, addProdutoToAmbiente } = useVisitaFormState();

  const ambienteIndex = ambientes.length - 1;
  const ambienteAtual = ambientes[ambienteIndex];

  const confirmar = () => {
    if (!selected) return;
    addProdutoToAmbiente(ambienteIndex, { tipo: selected });
    onNext();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-primary">Qual produto você quer orçar?</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {opcoesProdutos.map((opt) => (
          <button
            key={opt.tipo}
            onClick={() => setSelected(opt.tipo)}
            className={`border px-4 py-2 rounded text-sm hover:bg-muted ${
              selected === opt.tipo ? "bg-primary text-white" : ""
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground underline"
        >
          Voltar
        </button>

        <button
          onClick={confirmar}
          disabled={!selected}
          className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Confirmar Produto
        </button>
      </div>
    </div>
  );
}

"use client";

import { useVisitaFormState } from "./useVisitaFormState";

export function VisitaResumo() {
  const { ambientes } = useVisitaFormState();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">Resumo da Visita</h2>
      {ambientes.map((amb, i) => (
        <div key={i} className="border rounded p-2">
          <p className="font-medium">{amb.nome}</p>
          {amb.produtos.length > 0 && (
            <ul className="list-disc pl-4 text-sm">
              {amb.produtos.map((p, idx) => (
                <li key={idx}>{p.tipo}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

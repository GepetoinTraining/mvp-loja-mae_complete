"use client";

import { useVisitaFormState } from "./useVisitaFormState";

export function VisitaResumo() {
  const { ambientes, fotosGerais } = useVisitaFormState();

  if (ambientes.length === 0) {
    return <p className="text-muted-foreground">Nenhum ambiente adicionado ainda.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary">Resumo da Visita</h2>

      {ambientes.map((ambiente, index) => (
        <div key={index} className="border rounded p-4 bg-white space-y-2">
          <h3 className="text-lg font-bold">Ambiente: {ambiente.nome}</h3>
          {ambiente.observacoes && (
            <p className="text-sm text-muted-foreground">{ambiente.observacoes}</p>
          )}

          {ambiente.produtos.length > 0 ? (
            <ul className="list-disc pl-4 space-y-1">
              {ambiente.produtos.map((produto, idx) => (
                <li key={idx}>
                  <strong>{produto.tipo}</strong> – {Object.entries(produto)
                    .filter(([k]) => k !== "tipo" && k !== "foto")
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" | ")}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-muted-foreground">Sem produtos adicionados</p>
          )}
        </div>
      ))}

      {fotosGerais.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Fotos Gerais</h3>
          <div className="flex gap-2 flex-wrap">
            {fotosGerais.map((file, idx) => (
              <img
                key={idx}
                src={foto.url}
                alt={`Foto ${idx + 1}`}
                className="h-24 w-auto rounded border"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
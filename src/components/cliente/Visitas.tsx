"use client";

import type { ClienteDTO, VisitaDTO } from "@/lib/types";
import dayjs from "dayjs";
import "dayjs/locale/pt-br"; // Import pt-BR locale for dayjs

dayjs.locale("pt-br"); // Set pt-BR as the default locale for dayjs

interface Props {
  visitas: VisitaDTO[];
  clienteId: string;
}
export function ClienteVisitas({ visitas, clienteId }: Props) {
  return (
    <section className="bg-white rounded-lg shadow p-4 space-y-4">
      <h2 className="text-lg font-semibold text-primary">Visitas</h2>

      {visitas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma visita registrada.</p>
      ) : (
        <ul className="space-y-3">
          {visitas.map((visita) => (
            <li
              key={visita.id}
              className="flex justify-between items-center border rounded p-2"
            >
              <div className="text-sm">
                <p className="font-medium text-primary">
                  {dayjs(visita.dataHora).format("DD [de] MMMM [às] HH:mm")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vendedor ID: {visita.vendedorId}
                </p>
              </div>

              <button
                onClick={() => {
                  alert("🚧 Em breve: iniciar orçamento a partir desta visita");
                }}
                className="text-sm bg-primary text-white px-3 py-1 rounded hover:bg-primary/90"
              >
                Criar Orçamento
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


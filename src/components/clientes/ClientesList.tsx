"use client";

import type { ClienteDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface Props {
  clientes: ClienteDTO[];
}

export function ClienteList({ clientes }: Props) {
  if (clientes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum cliente encontrado com os filtros aplicados.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {clientes.map((cliente) => (
        <li
          key={cliente.id}
          className="bg-white border rounded-lg shadow-sm p-4 flex flex-col justify-between hover:ring-1 hover:ring-primary transition"
        >
          <div className="space-y-1 text-sm">
            <p className="font-medium text-primary">{cliente.nome}</p>
            {cliente.telefone && (
              <p className="text-muted-foreground">📞 {cliente.telefone}</p>
            )}
            {cliente.email && (
              <p className="text-muted-foreground">✉️ {cliente.email}</p>
            )}
            {cliente.cidade && (
              <p className="text-muted-foreground">📍 {cliente.cidade}</p>
            )}
          </div>

          <div className="mt-4 text-right">
            <Link href={`/clientes/${cliente.id}`} passHref>
                    <Button variant="outline" size="icon" title="Ver Detalhes">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

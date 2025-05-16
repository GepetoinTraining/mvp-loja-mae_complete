"use client";

import { useEffect, useState } from "react";
import type { ClienteDTO } from "@/lib/types";
import { FiltroDinamico } from "@/components/shared/FiltroDinamico";
import { useRouter } from "next/navigation";

export function ClientesSearchPage() {
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [filtro, setFiltro] = useState({ nome: "" });
  const router = useRouter();

  const filtroConfig = [
    {
      tipo: "text",
      campo: "nome",
      label: "Buscar por nome",
    },
  ];

  useEffect(() => {
    const fetchClientes = async () => {
      const res = await fetch("/api/clientes");
      if (!res.ok) return;
      const data = await res.json();
      setClientes(data);
    };

    fetchClientes();
  }, []);

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(filtro.nome.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 bg-muted/50 min-h-screen">
      <h1 className="text-2xl font-bold text-primary">Clientes</h1>

      <FiltroDinamico
        config={filtroConfig}
        filtro={filtro}
        setFiltro={setFiltro}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesFiltrados.map((cliente) => (
          <button
            key={cliente.id}
            type="button"
            onClick={() => {
              console.log("Redirecionando para:", `/visita/iniciar/${cliente.id}`);
              router.push(`/visita/iniciar/${cliente.id}`);
            }}
            className="text-left bg-white rounded shadow p-4 hover:ring-2 ring-offset-1 hover:ring-primary transition cursor-pointer"
          >
            <p className="font-semibold">{cliente.nome}</p>
            <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
            <p className="text-sm text-muted-foreground">{cliente.email}</p>

            <div className="mt-4 text-right">
              <span className="text-sm underline text-primary">
                Iniciar Visita
              </span>
            </div>
          </button>
        ))}

        {clientesFiltrados.length === 0 && (
          <p className="text-muted-foreground col-span-full">
            Nenhum cliente encontrado.
          </p>
        )}
      </div>
    </div>
  );
}

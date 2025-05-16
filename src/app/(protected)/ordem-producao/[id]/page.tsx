// src/app/(protected)/ordem-producao/editar/[id]/page.tsx
"use client";

import OrdemProducaoForm from "@/components/ordem-producao/OrdemProducaoForm";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OrdemProducao, ItemOrdemProducao, Orcamento, Cliente } from "@prisma/client";

interface OrdemProducaoComFullRelacoes extends OrdemProducao {
  itens: ItemOrdemProducao[];
  orcamento?: Orcamento & { cliente?: Cliente | null } | null;
}

export default function EditarOrdemProducaoPage() {
  const params = useParams();
  const ordemId = params?.id as string | undefined;
  const [ordem, setOrdem] = useState<OrdemProducaoComFullRelacoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ordemId) {
      const fetchOrdem = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/ordem-producao/${ordemId}`);
          if (!response.ok) {
            if (response.status === 404) {
              setError("Ordem de Produção não encontrada.");
            } else {
              throw new Error("Falha ao carregar Ordem de Produção");
            }
            return;
          }
          const data = await response.json();
          setOrdem(data);
        } catch (err: any) {
          setError(err.message || "Ocorreu um erro desconhecido.");
          console.error("Error fetching Ordem de Produção for edit:", err);
        }
        setLoading(false);
      };
      fetchOrdem();
    }
  }, [ordemId]);

  if (loading && ordemId) {
    return <p className="container mx-auto p-4">Carregando dados da Ordem de Produção...</p>;
  }

  if (error) {
    return <p className="container mx-auto p-4 text-red-500">Erro: {error}</p>;
  }

  if (!ordem && ordemId) {
    return <p className="container mx-auto p-4">Ordem de Produção não encontrada.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Ordem de Produção</h1>
      <OrdemProducaoForm ordem={ordem} />
    </div>
  );
}


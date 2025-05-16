// src/app/(protected)/estoque/editar/[id]/page.tsx
"use client";

import EstoqueForm from "@/components/estoque/EstoqueForm";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Estoque } from "@prisma/client";

export default function EditarEstoqueItemPage() {
  const params = useParams();
  const itemId = params?.id as string | undefined;
  const [item, setItem] = useState<Estoque | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemId) {
      const fetchItem = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/estoque/${itemId}`);
          if (!response.ok) {
            if (response.status === 404) {
              setError("Item do estoque não encontrado.");
            } else {
              throw new Error("Falha ao carregar item do estoque");
            }
            return;
          }
          const data = await response.json();
          setItem(data);
        } catch (err: any) {
          setError(err.message || "Ocorreu um erro desconhecido.");
          console.error("Error fetching estoque item for edit:", err);
        }
        setLoading(false);
      };
      fetchItem();
    }
  }, [itemId]);

  if (loading && itemId) {
    return <p className="container mx-auto p-4">Carregando dados do item do estoque...</p>;
  }

  if (error) {
    return <p className="container mx-auto p-4 text-red-500">Erro: {error}</p>;
  }

  if (!item && itemId) {
    return <p className="container mx-auto p-4">Item do estoque não encontrado.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Item do Estoque</h1>
      <EstoqueForm item={item} />
    </div>
  );
}


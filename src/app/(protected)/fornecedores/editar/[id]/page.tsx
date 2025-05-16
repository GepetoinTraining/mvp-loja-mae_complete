// src/app/(protected)/fornecedores/editar/[id]/page.tsx
"use client";

import FornecedorForm from "@/components/fornecedores/FornecedorForm";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Fornecedor } from "@prisma/client";

export default function EditarFornecedorPage() {
  const params = useParams();
  const fornecedorId = params?.id as string | undefined;
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fornecedorId) {
      const fetchFornecedor = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/fornecedores/${fornecedorId}`);
          if (!response.ok) {
            if (response.status === 404) {
              setError("Fornecedor não encontrado.");
            } else {
              throw new Error("Falha ao carregar fornecedor");
            }
            return;
          }
          const data = await response.json();
          setFornecedor(data);
        } catch (err: any) {
          setError(err.message || "Ocorreu um erro desconhecido.");
          console.error("Error fetching fornecedor for edit:", err);
        }
        setLoading(false);
      };
      fetchFornecedor();
    }
  }, [fornecedorId]);

  if (loading && fornecedorId) {
    return <p className="container mx-auto p-4">Carregando dados do fornecedor...</p>;
  }

  if (error) {
    return <p className="container mx-auto p-4 text-red-500">Erro: {error}</p>;
  }

  if (!fornecedor && fornecedorId) {
    // This case might be covered by error state if 404 is handled, but good for explicit check
    return <p className="container mx-auto p-4">Fornecedor não encontrado.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Fornecedor</h1>
      {/* Pass the fetched fornecedor to the form for pre-population */}
      <FornecedorForm fornecedor={fornecedor} />
    </div>
  );
}


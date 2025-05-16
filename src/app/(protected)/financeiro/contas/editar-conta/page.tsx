import { ContaForm } from "@/components/financeiro/contas/ContaForm";
import { Suspense } from "react";

export default function EditarContaPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Editar Conta</h1>
      <Suspense fallback={<div>Carregando formulário...</div>}>
        <ContaForm /> 
      </Suspense>
    </div>
  );
}


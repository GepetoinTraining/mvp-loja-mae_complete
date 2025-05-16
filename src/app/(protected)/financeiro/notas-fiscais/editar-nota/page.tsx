import { NotaFiscalForm } from "@/components/financeiro/notas-fiscais/NotaFiscalForm";
import { Suspense } from "react";

export default function EditarNotaFiscalPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Editar Nota Fiscal</h1>
      <Suspense fallback={<div>Carregando formulário...</div>}>
        <NotaFiscalForm />
      </Suspense>
    </div>
  );
}


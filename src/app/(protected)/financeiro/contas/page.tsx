import { ContaList } from "@/components/financeiro/contas/ContaList";
import { Suspense } from "react";

export default function ContasPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Gestão de Contas</h1>
      <Suspense fallback={<div>Carregando contas...</div>}>
        <ContaList />
      </Suspense>
    </div>
  );
}

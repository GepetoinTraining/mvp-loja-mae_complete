import { NotaFiscalList } from "@/components/financeiro/notas-fiscais/NotaFiscalList";
import { Suspense } from "react";

export default function NotasFiscaisPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Gestão de Notas Fiscais</h1>
      <Suspense fallback={<div>Carregando notas fiscais...</div>}>
        <NotaFiscalList />
      </Suspense>
    </div>
  );
}
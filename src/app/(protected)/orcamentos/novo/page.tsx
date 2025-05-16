// app/(protected)/orcamentos/novo/page.tsx
"use client";

import OrcamentoForm from "@/components/orcamentos/OrcamentoForm";

export default function NovoOrcamentoPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Novo Orçamento</h1>
      <OrcamentoForm />
    </div>
  );
}


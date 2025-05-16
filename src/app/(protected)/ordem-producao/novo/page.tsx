// src/app/(protected)/ordem-producao/novo/page.tsx
"use client";

import OrdemProducaoForm from "@/components/ordem-producao/OrdemProducaoForm";

export default function NovaOrdemProducaoPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Nova Ordem de Produção</h1>
      <OrdemProducaoForm />
    </div>
  );
}


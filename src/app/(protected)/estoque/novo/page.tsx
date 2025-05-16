// src/app/(protected)/estoque/novo/page.tsx
"use client";

import EstoqueForm from "@/components/estoque/EstoqueForm";

export default function NovoEstoqueItemPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Adicionar Novo Item ao Estoque</h1>
      <EstoqueForm />
    </div>
  );
}


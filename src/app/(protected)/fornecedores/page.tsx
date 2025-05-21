// src/app/(protected)/fornecedores/page.tsx
"use client";

import FornecedorList from "@/components/fornecedores/FornecedorList";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FornecedoresPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fornecedores</h1>
        <Link href="/fornecedores/novo" passHref>
          <Button>Novo Fornecedor</Button>
        </Link>
      </div>
      <FornecedorList />
    </div>
  );
}


// app/(protected)/orcamentos/page.tsx
"use client";

import OrcamentoList from "@/components/orcamentos/OrcamentoList";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OrcamentosPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <Link href="/orcamentos/novo" passHref>
          <Button>Novo Orçamento</Button>
        </Link>
      </div>
      <OrcamentoList />
    </div>
  );
}


// src/app/(protected)/ordem-producao/page.tsx
"use client";

import OrdemProducaoList from "@/components/ordem-producao/OrdemProducaoList";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export default function OrdensProducaoPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ordens de Produção</h1>
        <Link href="/ordem-producao/novo" passHref>
          <Button>Nova Ordem de Produção</Button>
        </Link>
      </div>
      <OrdemProducaoList />
    </div>
  );
}


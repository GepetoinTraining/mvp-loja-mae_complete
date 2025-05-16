// src/app/(protected)/clientes/[id]/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ClienteDashboard } from "@/components/cliente/Dashboard";

interface Props {
  params: { id: string };
}

export default async function ClientePage({ params }: Props) {
  const { id } = params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      visitas: true,
      orcamentos: { include: { itens: true } },
      leads: true,
    },
  });

  if (!cliente) return notFound();

  return <ClienteDashboard cliente={cliente} />;
}

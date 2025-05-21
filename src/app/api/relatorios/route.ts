import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Example: Leads by Status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
      orderBy: {
        _count: {
          status: "desc",
        },
      },
    });

    // Example: Orcamentos by Status
    const orcamentosByStatus = await prisma.orcamento.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
      orderBy: {
        _count: {
          status: "desc",
        },
      },
    });
    
    // Example: Recent Activity (e.g., last 5 created leads)
    const recentLeads = await prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { vendedor: { select: { name: true }}}
    });

    const totalClientes = await prisma.cliente.count();
    const totalLeads = await prisma.lead.count();
    const totalOrcamentos = await prisma.orcamento.count();
    const totalProdutos = await prisma.produtoEstoque.count();


    return NextResponse.json({
      leadsByStatus: leadsByStatus.map(item => ({ name: item.status, value: item._count.status })),
      orcamentosByStatus: orcamentosByStatus.map(item => ({ name: item.status, value: item._count.status })),
      recentLeads,
      summaryStats: {
        totalClientes,
        totalLeads,
        totalOrcamentos,
        totalProdutos
      }
    });
  } catch (error: any) {
    console.error("Erro ao buscar dados para o dashboard:", error);
    return NextResponse.json({ error: "Erro interno no servidor", details: error.message }, { status: 500 });
  }
}


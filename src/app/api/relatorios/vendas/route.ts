import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== Role.ADMIN && session.user.role !== Role.FINANCEIRO && session.user.role !== Role.VENDEDOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const vendedorIdParam = searchParams.get("vendedorId");

  let dateFilter = {};
  if (startDateParam && endDateParam) {
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999); // Include the whole end day
    dateFilter = {
      updatedAt: { // Assuming updatedAt reflects when an orcamento is closed/finalized
        gte: startDate,
        lte: endDate,
      },
    };
  } else if (startDateParam) {
    const startDate = new Date(startDateParam);
    dateFilter = { updatedAt: { gte: startDate } };
  } else if (endDateParam) {
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);
    dateFilter = { updatedAt: { lte: endDate } };
  }

  let vendedorFilter = {};
  if (session.user.role === Role.VENDEDOR) {
    // Vendedor can only see their own sales
    vendedorFilter = { vendedorId: session.user.id };
  } else if (vendedorIdParam && (session.user.role === Role.ADMIN || session.user.role === Role.FINANCEIRO)) {
    // Admin/Financeiro can filter by vendedor
    vendedorFilter = { vendedorId: vendedorIdParam };
  }

  try {
    const salesData = await prisma.orcamento.findMany({
      where: {
        status: { in: ["FECHADO", "INSTALACAO_CONCLUIDA"] }, // Consider these as sales
        ...dateFilter,
        ...vendedorFilter,
      },
      include: {
        cliente: {
          select: { id: true, nome: true },
        },
        vendedor: {
          select: { id: true, name: true },
        },
        itens: {
          select: { descricao: true, precoFinal: true, quantidade: true, tipoProduto: true }
        }
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Calculate total sales amount for the filtered data
    const totalSalesAmount = salesData.reduce((sum, orcamento) => sum + (orcamento.valorTotal || 0), 0);

    return NextResponse.json({ salesData, totalSalesAmount });

  } catch (error: any) {
    console.error("Erro ao buscar dados para o relatório de vendas:", error);
    return NextResponse.json({ error: "Erro interno no servidor", details: error.message }, { status: 500 });
  }
}


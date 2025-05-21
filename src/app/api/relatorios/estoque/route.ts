import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== Role.ADMIN && session.user.role !== Role.FINANCEIRO && session.user.role !== Role.GESTOR_PRODUCAO)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  // Add any relevant filters here, e.g., by category, low stock threshold
  const lowStockThresholdParam = searchParams.get("lowStockThreshold");
  const categoryParam = searchParams.get("category");

  let whereClause: any = {};
  if (lowStockThresholdParam) {
    whereClause.quantidade = { lte: parseInt(lowStockThresholdParam, 10) };
  }
  if (categoryParam) {
    // Assuming 'categoria' is a field in ProdutoEstoque or a related model
    // This might need adjustment based on the actual schema for categories
    // whereClause.categoria = categoryParam; 
  }

  try {
    const inventoryData = await prisma.produtoEstoque.findMany({
      where: whereClause,
      include: {
        fornecedor: { select: { id: true, nome: true } }, // If you track preferred supplier
        // Include other relevant relations like product category if applicable
      },
      orderBy: {
        nome: "asc",
      },
    });

    const totalValue = inventoryData.reduce((sum, item) => sum + (item.precoCusto || 0) * item.quantidade, 0);

    return NextResponse.json({ inventoryData, totalValue });

  } catch (error: any) {
    console.error("Erro ao buscar dados para o relatório de estoque:", error);
    return NextResponse.json({ error: "Erro interno no servidor", details: error.message }, { status: 500 });
  }
}


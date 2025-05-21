// API route for /api/orcamentos
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Adjusted path
import { z } from "zod";
import { calculateOrcamentoTotal, applyBusinessRules } from "@/lib/businessRules";

const orcamentoCreateSchema = z.object({
  clienteId: z.string().cuid(),
  visitaId: z.string().cuid().optional(),
  observacoes: z.string().optional(),
  itens: z.array(
    z.object({
      tipoProduto: z.string(),
      descricao: z.string(),
      largura: z.number().optional(),
      altura: z.number().optional(),
      metragem: z.number().optional(),
      precoUnitario: z.number().optional(),
      // precoFinal will be calculated
    })
  ).min(1),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  try {
    let whereClause: any = {};
    // Potentially filter by vendedorId if not admin
    // whereClause.vendedorId = session.user.id;

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const orcamentos = await prisma.orcamento.findMany({
      where: whereClause,
      include: {
        cliente: true,
        vendedor: true,
        itens: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(orcamentos);
  } catch (error) {
    console.error("Failed to fetch orcamentos:", error);
    return NextResponse.json({ error: "Failed to fetch orcamentos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "VENDEDOR")) {
    return NextResponse.json({ error: "Unauthorized to create orcamento" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = orcamentoCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { clienteId, visitaId, observacoes, itens } = validation.data;

    // Apply business rules and calculate totals
    const { itensComPrecoFinal, valorTotalCalculado } = calculateOrcamentoTotal(itens);
    const orcamentoDataComRegras = applyBusinessRules(
        { clienteId, vendedorId: session.user.id, visitaId, observacoes, itens: itensComPrecoFinal, valorTotal: valorTotalCalculado, status: "EM_ANDAMENTO" }, 
        session.user.role
    );

    const newOrcamento = await prisma.orcamento.create({
      data: {
        clienteId: orcamentoDataComRegras.clienteId,
        vendedorId: session.user.id, // Associate with the logged-in user
        visitaId: orcamentoDataComRegras.visitaId,
        observacoes: orcamentoDataComRegras.observacoes,
        status: orcamentoDataComRegras.status,
        valorTotal: orcamentoDataComRegras.valorTotal,
        itens: {
          create: orcamentoDataComRegras.itens.map(item => ({
            tipoProduto: item.tipoProduto,
            descricao: item.descricao,
            largura: item.largura,
            altura: item.altura,
            metragem: item.metragem,
            precoUnitario: item.precoUnitario,
            precoFinal: item.precoFinal, // This is now calculated
          })),
        },
      },
      include: {
        itens: true,
        cliente: true,
        vendedor: true,
      },
    });

    return NextResponse.json(newOrcamento, { status: 201 });
  } catch (error) {
    console.error("Failed to create orcamento:", error);
    let errorMessage = "Failed to create orcamento";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


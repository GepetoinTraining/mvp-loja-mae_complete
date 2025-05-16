// src/app/api/estoque/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth"; // Adjusted path
import { z } from "zod";

const estoqueCreateSchema = z.object({
  produtoId: z.string().cuid("ID de produto inválido").optional().nullable(), // Can be a generic product or a specific item from an Orcamento/Visita
  nomeProduto: z.string().min(1, "Nome do produto é obrigatório"),
  descricao: z.string().optional(),
  quantidade: z.coerce.number().min(0, "Quantidade não pode ser negativa"),
  unidade: z.string().min(1, "Unidade é obrigatória (ex: m, m², un, pç)"),
  localizacao: z.string().optional(),
  pontoReposicao: z.coerce.number().min(0, "Ponto de reposição não pode ser negativo").optional().nullable(),
  observacoes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "ESTOQUISTA" && session.user.role !== "COMPRADOR")) {
    return NextResponse.json({ error: "Unauthorized to view estoque" }, { status: 403 });
  }

  try {
    const estoqueItems = await prisma.estoque.findMany({
      orderBy: {
        nomeProduto: "asc",
      },
      // include: { produto: true } // If you have a direct relation to a Produto model
    });
    return NextResponse.json(estoqueItems);
  } catch (error) {
    console.error("Failed to fetch estoque items:", error);
    return NextResponse.json({ error: "Failed to fetch estoque items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "ESTOQUISTA" && session.user.role !== "COMPRADOR")) {
    return NextResponse.json({ error: "Unauthorized to create estoque item" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = estoqueCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { produtoId, nomeProduto, descricao, quantidade, unidade, localizacao, pontoReposicao, observacoes } = validation.data;

    const newEstoqueItem = await prisma.estoque.create({
      data: {
        produtoId: produtoId === "" ? null : produtoId,
        nomeProduto,
        descricao,
        quantidade,
        unidade,
        localizacao,
        pontoReposicao,
        observacoes,
        // lastUpdatedById: session.user.id, // Log who last updated
      },
    });

    return NextResponse.json(newEstoqueItem, { status: 201 });
  } catch (error) {
    console.error("Failed to create estoque item:", error);
    return NextResponse.json({ error: "Failed to create estoque item" }, { status: 500 });
  }
}


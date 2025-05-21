// src/app/api/estoque/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Adjusted path
import { z } from "zod";

const estoqueUpdateSchema = z.object({
  produtoId: z.string().cuid("ID de produto inválido (CUID)").optional().nullable(),
  nomeProduto: z.string().min(1, "Nome do produto é obrigatório").optional(),
  descricao: z.string().optional(),
  quantidade: z.coerce.number().min(0, "Quantidade não pode ser negativa").optional(),
  unidade: z.string().min(1, "Unidade é obrigatória").optional(),
  localizacao: z.string().optional(),
  pontoReposicao: z.coerce.number().min(0, "Ponto de reposição não pode ser negativo").optional().nullable(),
  observacoes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "ESTOQUISTA" && session.user.role !== "COMPRADOR")) {
    return NextResponse.json({ error: "Unauthorized to view estoque item" }, { status: 403 });
  }

  const id = params.id;
  try {
    const estoqueItem = await prisma.estoque.findUnique({
      where: { id },
      // include: { produto: true } // If direct relation exists
    });
    if (!estoqueItem) {
      return NextResponse.json({ error: "Item do estoque não encontrado" }, { status: 404 });
    }
    return NextResponse.json(estoqueItem);
  } catch (error) {
    console.error(`Failed to fetch estoque item ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch estoque item" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "ESTOQUISTA" && session.user.role !== "COMPRADOR")) {
    return NextResponse.json({ error: "Unauthorized to update estoque item" }, { status: 403 });
  }

  const id = params.id;
  try {
    const body = await request.json();
    const validation = estoqueUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }
    
    const dataToUpdate = {
        ...validation.data,
        produtoId: validation.data.produtoId === "" ? null : validation.data.produtoId,
        pontoReposicao: validation.data.pontoReposicao === undefined ? null : validation.data.pontoReposicao,
        // lastUpdatedById: session.user.id, // Log who last updated
    };

    const updatedEstoqueItem = await prisma.estoque.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedEstoqueItem);
  } catch (error: any) {
    console.error(`Failed to update estoque item ${id}:`, error);
    if (error.code === "P2025") { // Record to update not found
        return NextResponse.json({ error: "Item do estoque não encontrado para atualização." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update estoque item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "ESTOQUISTA")) {
    return NextResponse.json({ error: "Unauthorized to delete estoque item" }, { status: 403 });
  }

  const id = params.id;
  try {
    await prisma.estoque.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Item do estoque excluído com sucesso" }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete estoque item ${id}:`, error);
    if (error.code === "P2025") { // Record to delete not found
        return NextResponse.json({ error: "Item do estoque não encontrado para exclusão." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete estoque item" }, { status: 500 });
  }
}


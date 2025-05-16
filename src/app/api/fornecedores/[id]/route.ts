// src/app/api/fornecedores/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth"; // Adjusted path
import { z } from "zod";

const fornecedorUpdateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  try {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id },
    });
    if (!fornecedor) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });
    }
    return NextResponse.json(fornecedor);
  } catch (error) {
    console.error(`Failed to fetch fornecedor ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch fornecedor" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "COMPRADOR")) {
    return NextResponse.json({ error: "Unauthorized to update fornecedor" }, { status: 403 });
  }

  const id = params.id;
  try {
    const body = await request.json();
    const validation = fornecedorUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const updatedFornecedor = await prisma.fornecedor.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json(updatedFornecedor);
  } catch (error: any) {
    console.error(`Failed to update fornecedor ${id}:`, error);
    if (error.code === "P2002") { // Prisma unique constraint violation
        let field = error.meta?.target?.join(", ");
        return NextResponse.json({ error: `Fornecedor com este ${field} já existe.` }, { status: 409 });
    }
    if (error.code === "P2025") { // Record to update not found
        return NextResponse.json({ error: "Fornecedor não encontrado para atualização." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update fornecedor" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "COMPRADOR")) {
    return NextResponse.json({ error: "Unauthorized to delete fornecedor" }, { status: 403 });
  }

  const id = params.id;
  try {
    // Check if there are any related PedidoCompra records
    const relatedPedidos = await prisma.pedidoCompra.count({
      where: { fornecedorId: id },
    });

    if (relatedPedidos > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir o fornecedor pois existem pedidos de compra associados." },
        { status: 409 } // Conflict
      );
    }

    await prisma.fornecedor.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Fornecedor excluído com sucesso" }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete fornecedor ${id}:`, error);
    if (error.code === "P2025") { // Record to delete not found
        return NextResponse.json({ error: "Fornecedor não encontrado para exclusão." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete fornecedor" }, { status: 500 });
  }
}


// src/app/api/pedidos-compra/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Adjusted path
import { z } from "zod";

const itemPedidoCompraUpdateSchema = z.object({
  id: z.string().cuid().optional(), // For existing items
  produtoId: z.string().optional(),
  descricao: z.string().min(1, "Descrição do item é obrigatória"),
  quantidade: z.coerce.number().min(0.01, "Quantidade deve ser maior que zero"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  precoUnitario: z.coerce.number().min(0, "Preço unitário não pode ser negativo"),
});

const pedidoCompraUpdateSchema = z.object({
  fornecedorId: z.string().cuid("ID de fornecedor inválido").optional(),
  orcamentoId: z.string().cuid("ID de orçamento inválido").optional().nullable(),
  dataNecessidade: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Data de necessidade inválida" }).optional().nullable(),
  observacoes: z.string().optional(),
  status: z.enum(["PENDENTE", "APROVADO", "REJEITADO", "EM_COTACAO", "CONCLUIDO", "CANCELADO"]).optional(),
  itens: z.array(itemPedidoCompraUpdateSchema).min(1, "Adicione pelo menos um item ao pedido").optional(),
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
    const pedidoCompra = await prisma.pedidoCompra.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        itens: true,
        orcamento: true, // Include linked orcamento
        comprador: true, // Include buyer details
      },
    });
    if (!pedidoCompra) {
      return NextResponse.json({ error: "Pedido de compra não encontrado" }, { status: 404 });
    }
    return NextResponse.json(pedidoCompra);
  } catch (error) {
    console.error(`Failed to fetch pedido de compra ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch pedido de compra" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "COMPRADOR")) {
    return NextResponse.json({ error: "Unauthorized to update pedido de compra" }, { status: 403 });
  }

  const id = params.id;
  try {
    const body = await request.json();
    const validation = pedidoCompraUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }
    
    const { itens, ...pedidoData } = validation.data;

    let valorTotalPedido = 0;
    if (itens) {
        for (const item of itens) {
            valorTotalPedido += item.quantidade * item.precoUnitario;
        }
    }

    const dataToUpdate: any = {
        ...pedidoData,
        dataNecessidade: pedidoData.dataNecessidade ? new Date(pedidoData.dataNecessidade) : null,
        orcamentoId: pedidoData.orcamentoId === "" ? null : pedidoData.orcamentoId,
    };

    if (itens) {
        dataToUpdate.valorTotal = valorTotalPedido;
    }

    const updatedPedidoCompra = await prisma.$transaction(async (tx) => {
        if (itens) {
            // Delete existing items not present in the update (if managing items directly)
            // Or, more simply, delete all and recreate if the logic is complex
            await tx.itemPedidoCompra.deleteMany({ where: { pedidoCompraId: id } });
            
            const createdItens = await tx.itemPedidoCompra.createMany({
                data: itens.map(item => ({
                    ...item,
                    precoTotal: item.quantidade * item.precoUnitario,
                    pedidoCompraId: id,
                })),
            });
        }

        return tx.pedidoCompra.update({
            where: { id },
            data: dataToUpdate,
            include: {
                itens: true,
                fornecedor: true,
            },
        });
    });

    return NextResponse.json(updatedPedidoCompra);
  } catch (error: any) {
    console.error(`Failed to update pedido de compra ${id}:`, error);
    if (error.code === "P2025") { // Record to update not found
        return NextResponse.json({ error: "Pedido de compra não encontrado para atualização." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update pedido de compra" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "COMPRADOR")) {
    return NextResponse.json({ error: "Unauthorized to delete pedido de compra" }, { status: 403 });
  }

  const id = params.id;
  try {
    // First delete related items, then the pedido itself
    await prisma.itemPedidoCompra.deleteMany({
      where: { pedidoCompraId: id },
    });
    await prisma.pedidoCompra.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Pedido de compra excluído com sucesso" }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete pedido de compra ${id}:`, error);
    if (error.code === "P2025") { // Record to delete not found
        return NextResponse.json({ error: "Pedido de compra não encontrado para exclusão." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete pedido de compra" }, { status: 500 });
  }
}


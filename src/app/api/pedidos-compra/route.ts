// src/app/api/pedidos-compra/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth"; // Adjusted path
import { z } from "zod";

const itemPedidoCompraSchema = z.object({
  produtoId: z.string().optional(), // Link to a generic product catalog if exists
  descricao: z.string().min(1, "Descrição do item é obrigatória"),
  quantidade: z.coerce.number().min(0.01, "Quantidade deve ser maior que zero"),
  unidade: z.string().min(1, "Unidade é obrigatória (ex: m, m², un)"),
  precoUnitario: z.coerce.number().min(0, "Preço unitário não pode ser negativo"),
  // precoTotal will be calculated: quantidade * precoUnitario
});

const pedidoCompraCreateSchema = z.object({
  fornecedorId: z.string().cuid("ID de fornecedor inválido"),
  orcamentoId: z.string().cuid("ID de orçamento inválido").optional(), // Link to an Orcamento
  dataNecessidade: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Data de necessidade inválida" }).optional(),
  observacoes: z.string().optional(),
  itens: z.array(itemPedidoCompraSchema).min(1, "Adicione pelo menos um item ao pedido"),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Add role check if necessary, e.g., only ADMIN or COMPRADOR

  try {
    const pedidosCompra = await prisma.pedidoCompra.findMany({
      include: {
        fornecedor: true,
        itens: true,
        //orcamento: true, // if you want to include related budget details
        //comprador: true, // if you want to include buyer details
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(pedidosCompra);
  } catch (error) {
    console.error("Failed to fetch pedidos de compra:", error);
    return NextResponse.json({ error: "Failed to fetch pedidos de compra" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "COMPRADOR")) {
    return NextResponse.json({ error: "Unauthorized to create pedido de compra" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = pedidoCompraCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { fornecedorId, orcamentoId, dataNecessidade, observacoes, itens } = validation.data;

    let valorTotalPedido = 0;
    const itensData = itens.map(item => {
      const precoTotalItem = item.quantidade * item.precoUnitario;
      valorTotalPedido += precoTotalItem;
      return {
        ...item,
        precoTotal: precoTotalItem,
      };
    });

    const newPedidoCompra = await prisma.pedidoCompra.create({
      data: {
        fornecedorId,
        orcamentoId,
        compradorId: session.user.id, // Logged-in user is the buyer
        dataNecessidade: dataNecessidade ? new Date(dataNecessidade) : null,
        observacoes,
        valorTotal: valorTotalPedido,
        status: "PENDENTE", // Initial status
        itens: {
          create: itensData,
        },
      },
      include: {
        itens: true,
        fornecedor: true,
      },
    });

    return NextResponse.json(newPedidoCompra, { status: 201 });
  } catch (error) {
    console.error("Failed to create pedido de compra:", error);
    return NextResponse.json({ error: "Failed to create pedido de compra" }, { status: 500 });
  }
}


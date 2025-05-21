// src/app/api/ordem-producao/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Adjusted path
import { z } from "zod";

// Define Zod schema for item within a production order
const itemOrdemProducaoSchema = z.object({
  descricao: z.string().min(1, "Descrição do item é obrigatória"),
  quantidade: z.coerce.number().min(0.01, "Quantidade deve ser maior que zero"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  observacoes: z.string().optional(),
  // Add other relevant fields for production items, e.g., material, dimensions, etc.
});

// Define Zod schema for creating a production order
const ordemProducaoCreateSchema = z.object({
  orcamentoId: z.string().cuid("ID de orçamento inválido"), // Link to an Orcamento
  // clienteId: z.string().cuid("ID de cliente inválido"), // Can be derived from Orcamento
  dataPrevistaEntrega: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Data prevista de entrega inválida" }).optional().nullable(),
  observacoesGerais: z.string().optional(),
  status: z.enum(["PENDENTE", "EM_PRODUCAO", "CONCLUIDA", "CANCELADA"]).default("PENDENTE"),
  itens: z.array(itemOrdemProducaoSchema).min(1, "Adicione pelo menos um item à ordem de produção"),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Add role check if necessary, e.g., only ADMIN or PRODUCAO (Production team)

  try {
    const ordensProducao = await prisma.ordemProducao.findMany({
      include: {
        orcamento: {
          include: {
            cliente: true, // Include client details from orcamento
          }
        },
        itens: true,
        responsavel: true, // User who created/is responsible for the OP
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(ordensProducao);
  } catch (error) {
    console.error("Failed to fetch ordens de produção:", error);
    return NextResponse.json({ error: "Failed to fetch ordens de produção" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PRODUCAO" && session.user.role !== "VENDEDOR")) {
    return NextResponse.json({ error: "Unauthorized to create ordem de produção" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = ordemProducaoCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { orcamentoId, dataPrevistaEntrega, observacoesGerais, status, itens } = validation.data;

    // Fetch orcamento to get clienteId
    const orcamento = await prisma.orcamento.findUnique({
        where: { id: orcamentoId },
        select: { clienteId: true }
    });

    if (!orcamento || !orcamento.clienteId) {
        return NextResponse.json({ error: "Orçamento ou cliente associado não encontrado." }, { status: 404 });
    }

    const newOrdemProducao = await prisma.ordemProducao.create({
      data: {
        orcamentoId,
        clienteId: orcamento.clienteId, // Set clienteId from the orcamento
        responsavelId: session.user.id, // Logged-in user is responsible
        dataPrevistaEntrega: dataPrevistaEntrega ? new Date(dataPrevistaEntrega) : null,
        observacoesGerais,
        status: status || "PENDENTE",
        itens: {
          create: itens.map(item => ({ ...item })),
        },
      },
      include: {
        itens: true,
        orcamento: { include: { cliente: true } },
        responsavel: true,
      },
    });

    return NextResponse.json(newOrdemProducao, { status: 201 });
  } catch (error) {
    console.error("Failed to create ordem de produção:", error);
    return NextResponse.json({ error: "Failed to create ordem de produção" }, { status: 500 });
  }
}


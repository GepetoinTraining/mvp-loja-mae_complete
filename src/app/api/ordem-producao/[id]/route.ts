// src/app/api/ordem-producao/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Adjusted path
import { z } from "zod";

const itemOrdemProducaoUpdateSchema = z.object({
  id: z.string().cuid().optional(), // For existing items
  descricao: z.string().min(1, "Descrição do item é obrigatória"),
  quantidade: z.coerce.number().min(0.01, "Quantidade deve ser maior que zero"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  observacoes: z.string().optional(),
});

const ordemProducaoUpdateSchema = z.object({
  orcamentoId: z.string().cuid("ID de orçamento inválido").optional(),
  dataPrevistaEntrega: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Data prevista de entrega inválida" }).optional().nullable(),
  observacoesGerais: z.string().optional(),
  status: z.enum(["PENDENTE", "EM_PRODUCAO", "CONCLUIDA", "CANCELADA"]).optional(),
  itens: z.array(itemOrdemProducaoUpdateSchema).min(1, "Adicione pelo menos um item à ordem").optional(),
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
    const ordemProducao = await prisma.ordemProducao.findUnique({
      where: { id },
      include: {
        orcamento: { include: { cliente: true } },
        itens: true,
        responsavel: true,
      },
    });
    if (!ordemProducao) {
      return NextResponse.json({ error: "Ordem de Produção não encontrada" }, { status: 404 });
    }
    return NextResponse.json(ordemProducao);
  } catch (error) {
    console.error(`Failed to fetch ordem de produção ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch ordem de produção" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PRODUCAO" && session.user.role !== "VENDEDOR")) {
    return NextResponse.json({ error: "Unauthorized to update ordem de produção" }, { status: 403 });
  }

  const id = params.id;
  try {
    const body = await request.json();
    const validation = ordemProducaoUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }
    
    const { itens, ...ordemData } = validation.data;

    const dataToUpdate: any = {
        ...ordemData,
        dataPrevistaEntrega: ordemData.dataPrevistaEntrega ? new Date(ordemData.dataPrevistaEntrega) : null,
    };
    
    // Fetch orcamento to get clienteId if orcamentoId is being updated
    if (ordemData.orcamentoId) {
        const orcamento = await prisma.orcamento.findUnique({
            where: { id: ordemData.orcamentoId },
            select: { clienteId: true }
        });
        if (!orcamento || !orcamento.clienteId) {
            return NextResponse.json({ error: "Orçamento ou cliente associado não encontrado para atualização." }, { status: 404 });
        }
        dataToUpdate.clienteId = orcamento.clienteId;
    }

    const updatedOrdemProducao = await prisma.$transaction(async (tx) => {
        if (itens) {
            await tx.itemOrdemProducao.deleteMany({ where: { ordemProducaoId: id } });
            await tx.itemOrdemProducao.createMany({
                data: itens.map(item => ({
                    ...item,
                    ordemProducaoId: id,
                })),
            });
        }

        return tx.ordemProducao.update({
            where: { id },
            data: dataToUpdate,
            include: {
                itens: true,
                orcamento: { include: { cliente: true } },
                responsavel: true,
            },
        });
    });

    return NextResponse.json(updatedOrdemProducao);
  } catch (error: any) {
    console.error(`Failed to update ordem de produção ${id}:`, error);
    if (error.code === "P2025") { // Record to update not found
        return NextResponse.json({ error: "Ordem de Produção não encontrada para atualização." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update ordem de produção" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PRODUCAO")) {
    return NextResponse.json({ error: "Unauthorized to delete ordem de produção" }, { status: 403 });
  }

  const id = params.id;
  try {
    const ordem = await prisma.ordemProducao.findUnique({ where: { id } });
    if (ordem && ordem.status !== "PENDENTE" && ordem.status !== "CANCELADA") {
        return NextResponse.json({ error: "Apenas ordens PENDENTES ou CANCELADAS podem ser excluídas." }, { status: 403 });
    }

    await prisma.itemOrdemProducao.deleteMany({
      where: { ordemProducaoId: id },
    });
    await prisma.ordemProducao.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Ordem de Produção excluída com sucesso" }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete ordem de produção ${id}:`, error);
    if (error.code === "P2025") { // Record to delete not found
        return NextResponse.json({ error: "Ordem de Produção não encontrada para exclusão." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete ordem de produção" }, { status: 500 });
  }
}


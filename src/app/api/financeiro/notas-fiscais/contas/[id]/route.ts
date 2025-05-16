import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { z } from "zod";

const contaUpdateSchema = z.object({
  tipo: z.enum(["PAGAR", "RECEBER"]).optional(),
  descricao: z.string().min(1, "Descrição é obrigatória").optional(),
  valor: z.number().positive("Valor deve ser positivo").optional(),
  dataVencimento: z.string().datetime("Data de vencimento inválida").optional(),
  dataPagamento: z.string().datetime().optional().nullable(),
  status: z.enum(["PENDENTE", "PAGA_PARCIALMENTE", "PAGA_TOTALMENTE", "VENCIDA", "CANCELADA"]).optional(),
  clienteId: z.string().cuid().optional().nullable(),
  fornecedorId: z.string().cuid().optional().nullable(),
  orcamentoId: z.string().cuid().optional().nullable(),
  pedidoCompraId: z.string().cuid().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  // Boleto fields
  nossoNumero: z.string().optional().nullable(),
  codigoBarras: z.string().optional().nullable(),
  linhaDigitavel: z.string().optional().nullable(),
});

// GET /api/contas/[id] - Get a specific conta
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = params;
  try {
    const conta = await prisma.conta.findUnique({
      where: { id },
      include: {
        cliente: true,
        fornecedor: true,
        orcamento: true,
        pedidoCompra: true,
      },
    });
    if (!conta) {
      return NextResponse.json({ error: "Conta not found" }, { status: 404 });
    }
    return NextResponse.json(conta);
  } catch (error) {
    console.error(`Failed to fetch conta ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch conta" }, { status: 500 });
  }
}

// PUT /api/contas/[id] - Update a conta
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = params;
  try {
    const body = await request.json();
    const validation = contaUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const data = validation.data;
    const updatedConta = await prisma.conta.update({
      where: { id },
      data: {
        ...data,
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : undefined,
        dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : (data.dataPagamento === null ? null : undefined),
      },
    });
    return NextResponse.json(updatedConta);
  } catch (error: any) {
    console.error(`Failed to update conta ${id}:`, error);
    if (error.code === 'P2002' && error.meta?.target?.includes('nossoNumero')) {
        return NextResponse.json({ error: "'Nosso Número' já existe." }, { status: 409 });
    }
    if (error.code === 'P2025') { // Record to update not found
        return NextResponse.json({ error: "Conta not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update conta" }, { status: 500 });
  }
}

// DELETE /api/contas/[id] - Delete a conta
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = params;
  try {
    await prisma.conta.delete({ where: { id } });
    return NextResponse.json({ message: "Conta deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete conta ${id}:`, error);
    if (error.code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: "Conta not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete conta" }, { status: 500 });
  }
}


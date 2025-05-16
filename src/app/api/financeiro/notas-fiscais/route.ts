import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { z } from "zod";

const contaSchema = z.object({
  tipo: z.enum(["PAGAR", "RECEBER"]),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.number().positive("Valor deve ser positivo"),
  dataVencimento: z.string().datetime("Data de vencimento inválida"),
  dataPagamento: z.string().datetime().optional().nullable(),
  status: z.enum(["PENDENTE", "PAGA_PARCIALMENTE", "PAGA_TOTALMENTE", "VENCIDA", "CANCELADA"]).default("PENDENTE"),
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

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");
  const clienteId = searchParams.get("clienteId");
  const fornecedorId = searchParams.get("fornecedorId");

  let whereClause: any = {};
  if (tipo) whereClause.tipo = tipo;
  if (status) whereClause.status = status;
  if (clienteId) whereClause.clienteId = clienteId;
  if (fornecedorId) whereClause.fornecedorId = fornecedorId;

  try {
    const contas = await prisma.conta.findMany({
      where: whereClause,
      include: {
        cliente: true,
        fornecedor: true,
        orcamento: true,
        pedidoCompra: true,
      },
      orderBy: {
        dataVencimento: "asc",
      },
    });
    return NextResponse.json(contas);
  } catch (error) {
    console.error("Failed to fetch contas:", error);
    return NextResponse.json({ error: "Failed to fetch contas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = contaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const data = validation.data;
    const newConta = await prisma.conta.create({
      data: {
        ...data,
        dataVencimento: new Date(data.dataVencimento),
        dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
      },
    });
    return NextResponse.json(newConta, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create conta:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('nossoNumero')) {
        return NextResponse.json({ error: "'Nosso Número' já existe." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create conta" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { z } from "zod";

const notaFiscalCreateSchema = z.object({
  orcamentoId: z.string().cuid("ID do Orçamento inválido"),
  tipo: z.enum(["NFE", "NFCE", "NFSE"], { required_error: "Tipo da nota fiscal é obrigatório" }),
  // status is defaulted in schema
  observacoes: z.string().optional().nullable(),
  // Other fields like numero, serie, chaveAcesso, xml, pdfUrl will be updated by a SEFAZ integration process or manually later
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const orcamentoId = searchParams.get("orcamentoId");

  let whereClause: any = {};
  if (orcamentoId) {
    whereClause.orcamentoId = orcamentoId;
  }

  try {
    const notasFiscais = await prisma.notaFiscal.findMany({
      where: whereClause,
      include: {
        orcamento: {
          include: {
            cliente: true,
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(notasFiscais);
  } catch (error) {
    console.error("Failed to fetch notas fiscais:", error);
    return NextResponse.json({ error: "Failed to fetch notas fiscais" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = notaFiscalCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { orcamentoId, tipo, observacoes } = validation.data;

    // Check if Orcamento exists and is in a valid status for NF generation (e.g., FECHADO or INSTALACAO_CONCLUIDA)
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: orcamentoId },
    });

    if (!orcamento) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }
    // Add status check for orcamento if needed, e.g.
    // if (orcamento.status !== "FECHADO" && orcamento.status !== "INSTALACAO_CONCLUIDA") {
    //   return NextResponse.json({ error: "Orçamento não está em status válido para emissão de nota fiscal" }, { status: 400 });
    // }

    const newNotaFiscal = await prisma.notaFiscal.create({
      data: {
        orcamentoId,
        tipo,
        observacoes,
        status: "PENDENTE_GERACAO", // Initial status
      },
      include: {
        orcamento: true,
      }
    });

    return NextResponse.json(newNotaFiscal, { status: 201 });
  } catch (error) {
    console.error("Failed to create nota fiscal:", error);
    return NextResponse.json({ error: "Failed to create nota fiscal" }, { status: 500 });
  }
}


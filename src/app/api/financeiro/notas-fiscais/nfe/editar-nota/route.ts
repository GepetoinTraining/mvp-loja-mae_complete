import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const notaFiscalUpdateSchema = z.object({
  // Only status and observacoes might be updatable before SEFAZ interaction
  // Or fields that SEFAZ returns (numero, serie, chaveAcesso, xml, pdfUrl, dataAutorizacao, protocolo, motivoRejeicao)
  status: z.enum(["PENDENTE_GERACAO", "GERADA", "ENVIADA_SEFAZ", "AUTORIZADA", "REJEITADA", "CANCELADA", "ERRO"]).optional(),
  observacoes: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  serie: z.string().optional().nullable(),
  chaveAcesso: z.string().optional().nullable(),
  xml: z.string().optional().nullable(),
  pdfUrl: z.string().optional().nullable(),
  dataAutorizacao: z.string().datetime().optional().nullable(),
  protocolo: z.string().optional().nullable(),
  motivoRejeicao: z.string().optional().nullable(),
});

// GET /api/notas-fiscais/[id] - Get a specific nota fiscal
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = params;
  try {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id },
      include: {
        orcamento: {
          include: {
            cliente: true,
            itens: true,
          }
        },
      },
    });
    if (!notaFiscal) {
      return NextResponse.json({ error: "Nota Fiscal not found" }, { status: 404 });
    }
    return NextResponse.json(notaFiscal);
  } catch (error) {
    console.error(`Failed to fetch nota fiscal ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch nota fiscal" }, { status: 500 });
  }
}

// PUT /api/notas-fiscais/[id] - Update a nota fiscal
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    // More granular permissions might be needed depending on what can be updated
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = params;
  try {
    const body = await request.json();
    const validation = notaFiscalUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const dataToUpdate = validation.data;
    
    // Ensure dataAutorizacao is a Date object if provided
    if (dataToUpdate.dataAutorizacao) {
      dataToUpdate.dataAutorizacao = new Date(dataToUpdate.dataAutorizacao) as any;
    }

    const updatedNotaFiscal = await prisma.notaFiscal.update({
      where: { id },
      data: dataToUpdate,
      include: {
        orcamento: true,
      }
    });
    return NextResponse.json(updatedNotaFiscal);
  } catch (error: any) {
    console.error(`Failed to update nota fiscal ${id}:`, error);
    if (error.code === 'P2025') { // Record to update not found
        return NextResponse.json({ error: "Nota Fiscal not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update nota fiscal" }, { status: 500 });
  }
}

// DELETE /api/notas-fiscais/[id] - Delete a nota fiscal (if allowed, e.g., if not yet sent to SEFAZ)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = params;
  try {
    // Add logic here to check if deletion is allowed based on status
    const notaFiscal = await prisma.notaFiscal.findUnique({ where: { id } });
    if (!notaFiscal) {
      return NextResponse.json({ error: "Nota Fiscal not found" }, { status: 404 });
    }
    if (notaFiscal.status !== "PENDENTE_GERACAO" && notaFiscal.status !== "ERRO" && notaFiscal.status !== "REJEITADA") {
      return NextResponse.json({ error: "Cannot delete nota fiscal unless it is PENDENTE_GERACAO, ERRO, or REJEITADA" }, { status: 400 });
    }

    await prisma.notaFiscal.delete({ where: { id } });
    return NextResponse.json({ message: "Nota Fiscal deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete nota fiscal ${id}:`, error);
    if (error.code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: "Nota Fiscal not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete nota fiscal" }, { status: 500 });
  }
}


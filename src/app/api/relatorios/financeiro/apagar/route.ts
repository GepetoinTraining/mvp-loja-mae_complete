import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== Role.ADMIN && session.user.role !== Role.FINANCEIRO)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const asOfDateParam = searchParams.get("asOfDate") || new Date().toISOString();
  const asOfDate = new Date(asOfDateParam);

  try {
    const accountsPayable = await prisma.conta.findMany({
      where: {
        tipo: "PAGAR",
        status: { in: ["PENDENTE", "VENCIDO"] }, // Consider only unpaid and not fully paid
        dataVencimento: {
          lte: asOfDate, // Include all due up to the asOfDate
        },
      },
      include: {
        fornecedor: { select: { id: true, nome: true } },
        pedidoCompra: { select: { id: true, observacoes: true } }, // Link to purchase order if applicable
        nfeCompra: { select: { id: true, chaveAcesso: true } } // Link to NFe Compra if applicable
      },
      orderBy: {
        dataVencimento: "asc",
      },
    });

    const today = new Date();
    today.setHours(0,0,0,0);

    const agingReport = accountsPayable.map(conta => {
      const dueDate = new Date(conta.dataVencimento);
      dueDate.setHours(0,0,0,0);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      let bucket = "Current";
      if (diffDays > 90) bucket = "> 90 Days";
      else if (diffDays > 60) bucket = "61-90 Days";
      else if (diffDays > 30) bucket = "31-60 Days";
      else if (diffDays > 0) bucket = "1-30 Days";
      
      return {
        ...conta,
        diasAtraso: diffDays,
        agingBucket: conta.status === "VENCIDO" ? bucket : "Current",
      };
    });

    return NextResponse.json(agingReport);

  } catch (error: any) {
    console.error("Erro ao buscar dados para o relatório de contas a pagar:", error);
    return NextResponse.json({ error: "Erro interno no servidor", details: error.message }, { status: 500 });
  }
}


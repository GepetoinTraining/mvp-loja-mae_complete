import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const nfeCompras = await prisma.nfeCompraImportada.findMany({
      orderBy: [{ dataImportacao: "desc" }, { dataEmissao: "desc" }],
      include: {
        fornecedor: true,
        itens: {
          include: {
            produtoEstoque: true,
          },
        },
      },
    });
    return NextResponse.json(nfeCompras);
  } catch (error: any) {
    console.error("Erro ao listar NFes de Compra Importadas:", error);
    return NextResponse.json({ error: "Erro interno no servidor", details: error.message }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  try {
    const nfeCompra = await prisma.nfeCompraImportada.findUnique({
      where: { id },
      include: {
        fornecedor: true, // Include linked Fornecedor
        itens: {
          include: {
            produtoEstoque: true, // Include linked ProdutoEstoque
          },
        },
        contaPagar: true, // Include linked Conta a Pagar
      },
    });

    if (!nfeCompra) {
      return NextResponse.json({ error: "NFe de Compra Importada não encontrada" }, { status: 404 });
    }

    return NextResponse.json(nfeCompra);
  } catch (error: any) {
    console.error("Erro ao buscar NFe de Compra Importada:", error);
    return NextResponse.json({ error: "Erro interno no servidor", details: error.message }, { status: 500 });
  }
}

// POST or PUT for processing/updating the NFe Compra (matching products, suppliers, creating ContaPagar)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: nfeCompraId } = params;
  try {
    const body = await request.json();
    // body should contain matched items, new supplier info if any, confirmation to create contaPagar etc.
    // This is a placeholder for the actual processing logic which will be complex.

    const nfeCompra = await prisma.nfeCompraImportada.findUnique({
        where: { id: nfeCompraId },
        include: { itens: true }
    });

    if (!nfeCompra) {
        return NextResponse.json({ error: "NFe de Compra não encontrada para processamento." }, { status: 404 });
    }

    // Example: Mark as AGUARDANDO_REVISAO_ADMIN or PROCESSADA_COM_SUCESSO based on body content
    // For now, just a simple update to show the endpoint works
    const updatedNfeCompra = await prisma.nfeCompraImportada.update({
      where: { id: nfeCompraId },
      data: {
        statusProcessamento: body.statusProcessamento || "AGUARDANDO_REVISAO_ADMIN",
        observacoesErro: body.observacoesErro || null,
        dataProcessamento: new Date(),
        // ... other updates based on processing logic ...
      },
    });

    return NextResponse.json(updatedNfeCompra);
  } catch (error: any) {
    console.error("Erro ao processar NFe de Compra Importada:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao processar NFe", details: error.message }, { status: 500 });
  }
}


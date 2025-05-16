import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getToken } from "next-auth/jwt";
import { Role } from "@/types/Role";
import { businessRules } from "@/lib/businessRules";
import xml2js from 'xml2js';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

// Enhanced error handling for XML parsing
async function getDueDatesFromXml(xmlContent: string): Promise<string[]> {
  if (!xmlContent) {
    console.warn("XML content is empty, cannot extract due dates.");
    return [];
  }
  try {
    const parser = new xml2js.Parser({ explicitArray: false, explicitRoot: false });
    const result = await parser.parseStringPromise(xmlContent);
    const dueDates: string[] = [];

    // Adjusted path to NFe data, considering nfeProc wrapper
    const nfeData = result.NFe || result.nfeProc?.NFe || result;
    
    if (nfeData && nfeData.infNFe && nfeData.infNFe.cobr && nfeData.infNFe.cobr.dup) {
      const dups = Array.isArray(nfeData.infNFe.cobr.dup) ? nfeData.infNFe.cobr.dup : [nfeData.infNFe.cobr.dup];
      for (const dup of dups) {
        if (dup && dup.dVenc) {
          // Validate date format before pushing
          if (typeof dup.dVenc === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dup.dVenc)) {
            dueDates.push(dup.dVenc);
          } else {
            console.warn(`Invalid or missing due date format in NFe XML: ${dup.dVenc}`);
          }
        }
      }
    }
    if (dueDates.length === 0) {
        console.warn("No due dates (dVenc) found in NFe XML structure.");
    }
    return dueDates;
  } catch (error: any) {
    console.error("Error parsing NFe XML for due dates:", error.message);
    // Optionally, rethrow a custom error or return a specific error indicator
    // For now, returning empty array and logging the error.
    return []; 
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request });
  if (!token || ![Role.Admin, Role.Financeiro].includes(token.role as Role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const validation = paramsSchema.safeParse(params);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid request parameters", details: validation.error.format() }, { status: 400 });
  }

  const { id } = validation.data;

  try {
    const nfeCompra = await prisma.nfeCompraImportada.findUnique({
      where: { id },
      include: { itens: true }, // Keep itens for stock processing
    });

    if (!nfeCompra) {
      return NextResponse.json(
        { error: "NFe de compra não encontrada." },
        { status: 404 }
      );
    }

    // Check if already processed to prevent reprocessing
    if (nfeCompra.statusProcessamento === "PROCESSADA_COM_SUCESSO") { // Using a more specific status
      return NextResponse.json(
        { message: "Esta NFe já foi processada com sucesso." },
        { status: 400 }
      );
    }
    
    // Update status to indicate processing has started
    await prisma.nfeCompraImportada.update({
        where: { id: nfeCompra.id },
        data: { statusProcessamento: "PROCESSANDO" }, // New status
    });

    const dueDates = await getDueDatesFromXml(nfeCompra.xmlContent || "");

    // Transaction for atomicity
    const processingResult = await prisma.$transaction(async (tx) => {
      let fornecedor = await tx.fornecedor.findUnique({
        where: { cnpj: nfeCompra.fornecedorCnpj || "" },
      });

      if (!fornecedor && nfeCompra.fornecedorCnpj && nfeCompra.fornecedorNome) {
        try {
            fornecedor = await tx.fornecedor.create({
                data: {
                nome: nfeCompra.fornecedorNome,
                cnpj: nfeCompra.fornecedorCnpj,
                // Consider adding a flag like 'autoCreated: true' or 'needsReview: true'
                },
            });
        } catch (e: any) {
            console.error(`Error creating supplier ${nfeCompra.fornecedorNome} (${nfeCompra.fornecedorCnpj}): ${e.message}`);
            // Decide if this is a critical error that should stop processing
            // For now, we'll log and continue, but the NFe won't be linked to a supplier if creation fails.
        }
      }

      // Create Contas a Pagar entries
      if (dueDates.length > 0) {
        const installmentValue = nfeCompra.valorTotal / dueDates.length;
        for (let i = 0; i < dueDates.length; i++) {
          const dueDate = dueDates[i];
          await tx.conta.create({
            data: {
              descricao: `NFe Compra ${nfeCompra.chaveAcesso || "S/Chave"} - Parc. ${i + 1}/${dueDates.length}`,
              valor: parseFloat(installmentValue.toFixed(2)), // Ensure two decimal places
              dataVencimento: new Date(dueDate),
              tipo: "PAGAR",
              status: "PENDENTE",
              fornecedorId: fornecedor?.id, // Link to supplier if found/created
              nfeCompraImportadaId: nfeCompra.id,
            },
          });
        }
      } else if (nfeCompra.valorTotal > 0) {
        // Fallback: create one installment (e.g., 30 days from emission)
        const emissionDate = nfeCompra.dataEmissao ? new Date(nfeCompra.dataEmissao) : new Date();
        const fallbackDueDate = new Date(emissionDate.setDate(emissionDate.getDate() + businessRules.nfe.fallbackDueDateDays)); // Use business rule
        await tx.conta.create({
          data: {
            descricao: `NFe Compra ${nfeCompra.chaveAcesso || "S/Chave"}`,
            valor: nfeCompra.valorTotal,
            dataVencimento: fallbackDueDate,
            tipo: "PAGAR",
            status: "PENDENTE",
            fornecedorId: fornecedor?.id,
            nfeCompraImportadaId: nfeCompra.id,
          },
        });
      }

      // Process items for stock update
      for (const item of nfeCompra.itens) {
        let produtoEstoque = await tx.produtoEstoque.findFirst({
          where: {
            // Enhanced matching: try by code first, then by name (case-insensitive)
            OR: [
              { id: item.produtoEstoqueId || undefined }, // If already linked
              { nome: { equals: item.descricaoProduto, mode: 'insensitive' } }
            ]
          },
        });

        if (produtoEstoque) {
          await tx.produtoEstoque.update({
            where: { id: produtoEstoque.id },
            data: {
              quantidade: { increment: item.quantidade },
              // More robust average cost calculation, handling potential division by zero or nulls
              precoCusto: ((produtoEstoque.precoCusto || 0) * (produtoEstoque.quantidade || 0) + (item.valorUnitario || 0) * item.quantidade) / ((produtoEstoque.quantidade || 0) + item.quantidade) || 0,
            },
          });
        } else {
          // Product not found: Log for now. Could create or flag for review.
          console.warn(`Product matching failed for NFe item: ${item.descricaoProduto} (NFe: ${nfeCompra.chaveAcesso}). Manual review needed.`);
          // Could update item status in NfeCompraItem if such a field exists
          // await tx.itemNfeCompraImportada.update({ where: {id: item.id}, data: { statusItem: "PENDENTE_MATCH" } });
        }
      }

      // Finalize NFe processing status
      return tx.nfeCompraImportada.update({
        where: { id: nfeCompra.id },
        data: {
          statusProcessamento: "PROCESSADA_COM_SUCESSO",
          fornecedorId: fornecedor?.id,
          dataProcessamento: new Date(),
        },
      });
    });

    return NextResponse.json({ message: "NFe processada com sucesso.", data: processingResult });

  } catch (error: any) {
    console.error(`Erro crítico ao processar NFe de compra ${id}:`, error);
    // Attempt to update NFe status to ERRO_PROCESSAMENTO
    try {
        await prisma.nfeCompraImportada.update({
            where: { id },
            data: { 
                statusProcessamento: "ERRO_PROCESSAMENTO",
                observacoesErro: error.message || "Erro desconhecido durante o processamento."
            }
        });
    } catch (statusUpdateError: any) {
        console.error(`Failed to update NFe status to ERRO_PROCESSAMENTO for ${id}:`, statusUpdateError.message);
    }
    return NextResponse.json(
      { error: "Erro interno ao processar NFe.", details: error.message },
      { status: 500 }
    );
  }
}


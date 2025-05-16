import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Helper to get company/emitente details (assuming a single company for now or from user settings)
// This should be more robust in a multi-tenant app or if company details are stored per user/org
async function getEmitenteDetails() {
  // Placeholder: In a real app, fetch this from a config, database (e.g., User.tituloLoja related settings)
  // For now, using fixed example data. User should configure this.
  return {
    cnpj: process.env.EMITENTE_CNPJ || "00000000000191", // Example CNPJ
    nome_razao: process.env.EMITENTE_NOME_RAZAO || "MINHA EMPRESA LTDA",
    nome_fantasia: process.env.EMITENTE_NOME_FANTASIA || "NOME FANTASIA DA MINHA EMPRESA",
    logradouro: process.env.EMITENTE_LOGRADOURO || "RUA PRINCIPAL",
    numero: process.env.EMITENTE_NUMERO || "123",
    complemento: process.env.EMITENTE_COMPLEMENTO || "SALA 101",
    bairro: process.env.EMITENTE_BAIRRO || "CENTRO",
    municipio_nome: process.env.EMITENTE_MUNICIPIO_NOME || "SAO PAULO",
    municipio_codigo_ibge: process.env.EMITENTE_MUNICIPIO_CODIGO_IBGE || "3550308", // Sao Paulo IBGE code
    uf_sigla: process.env.EMITENTE_UF_SIGLA || "SP",
    cep: process.env.EMITENTE_CEP || "01001000",
    telefone: process.env.EMITENTE_TELEFONE || "11999998888",
    inscricao_estadual: process.env.EMITENTE_INSCRICAO_ESTADUAL || "111222333444",
    regime_tributario_codigo: process.env.EMITENTE_REGIME_TRIBUTARIO_CODIGO || "1", // 1 for Simples Nacional
  };
}

const sefazTransmitSchema = z.object({
  certificate_base64: z.string().min(1, "Certificado é obrigatório"),
  certificate_password: z.string().min(1, "Senha do certificado é obrigatória"),
  ambiente: z.enum(["1", "2"]).default("2"), // 1=Produção, 2=Homologação
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: notaFiscalId } = params;

  try {
    const body = await request.json();
    const validation = sefazTransmitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { certificate_base64, certificate_password, ambiente } = validation.data;

    // 1. Fetch NotaFiscal and related data
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id: notaFiscalId },
      include: {
        orcamento: {
          include: {
            cliente: true,
            itens: true, // Assuming ItemOrcamento has product details or can be mapped
            // Add other relations if needed for NFe data
          },
        },
      },
    });

    if (!notaFiscal) {
      return NextResponse.json({ error: "Nota Fiscal não encontrada" }, { status: 404 });
    }
    if (!notaFiscal.orcamento) {
        return NextResponse.json({ error: "Orçamento vinculado à Nota Fiscal não encontrado" }, { status: 404 });
    }
    if (!notaFiscal.orcamento.cliente) {
        return NextResponse.json({ error: "Cliente vinculado ao Orçamento não encontrado" }, { status: 404 });
    }

    // 2. Prepare data for SEFAZ Service
    const emitente = await getEmitenteDetails(); // Fetch or define your company details
    const cliente = notaFiscal.orcamento.cliente;

    const destinatarioPayload = {
        cpf_cnpj: cliente.cpf?.replace(/\D/g, 	est""") || "", // Ensure only digits or handle CNPJ if applicable
        nome_razao: cliente.nomeSocial || cliente.nome,
        logradouro: cliente.rua || "",
        numero: cliente.numero || "S/N",
        bairro: cliente.bairro || "",
        municipio_nome: cliente.cidade || "",
        municipio_codigo_ibge: "", // Needs to be fetched or mapped based on cliente.cidade/estado
        uf_sigla: cliente.estado || "",
        cep: cliente.cep?.replace(/\D/g, 	est""") || "",
        telefone: cliente.telefone?.replace(/\D/g, 	est""") || "",
        email: cliente.email || "",
        indicador_ie_codigo: "9", // Default to Não Contribuinte, adjust if you store this
    };
    
    // TODO: Map municipio_codigo_ibge and uf_sigla for destinatario more accurately
    // This might require a local table or an external API call if not stored directly
    // For now, placeholders or allow SEFAZ service to use defaults if possible
    if (destinatarioPayload.uf_sigla === "SP" && destinatarioPayload.municipio_nome.toUpperCase() === "SAO PAULO") {
        destinatarioPayload.municipio_codigo_ibge = "3550308";
    }

    const produtosPayload = notaFiscal.orcamento.itens.map((item, index) => ({
        item: (index + 1).toString(),
        codigo_produto: item.id, // Or a specific product code if available
        descricao: item.descricao,
        ncm: "00000000", // Placeholder - NCM is crucial and must be correct
        cfop: "5102",     // Placeholder - CFOP for Venda de mercadoria adquirida ou recebida de terceiros
        unidade_comercial: "UN", // Placeholder
        quantidade: item.metragem || 1, // Assuming metragem is quantity, or use a dedicated field
        valor_unitario: item.precoUnitario || 0,
        valor_total_bruto: item.precoFinal || 0,
        // TRIBUTOS - This is highly complex and needs accurate data per product/operation
        tributos: {
            icms: { origem: "0", cst: "00", mod_bc: "3", valor_bc: item.precoFinal || 0, aliquota: 0, valor: 0 },
            pis: { cst: "01", valor_bc: item.precoFinal || 0, aliquota_percentual: 0, valor: 0 },
            cofins: { cst: "01", valor_bc: item.precoFinal || 0, aliquota_percentual: 0, valor: 0 },
        },
    }));

    const notaFiscalInfoPayload = {
        natureza_operacao: "VENDA DE MERCADORIA", // Example
        modelo_documento_fiscal: notaFiscal.tipo === "NFE" ? "55" : (notaFiscal.tipo === "NFCE" ? "65" : "55"),
        serie_nf: notaFiscal.serie || "1", // Get from NF or generate next
        numero_nf: notaFiscal.numero || uuidv4().substring(0,8).replace(/-/g, 	est"""), // Get from NF or generate next (sequential control needed)
        data_emissao: new Date().toISOString(), // Current date-time
        finalidade_emissao_codigo: "1", // 1=NF-e normal
        tipo_operacao_codigo: "1", // 1=Saída
        forma_pagamento_nf_codigo: "0", // 0=Pagamento à vista
        presenca_comprador_codigo: "1", // 1=Operação presencial (adjust as needed)
        pagamentos: [
            {
                forma_pagamento_codigo: "01", // Dinheiro (example)
                valor_pagamento: notaFiscal.orcamento.valorTotal || 0
            }
        ]
        // Add other fields as required by PyNFe and your business logic
    };

    const sefazServicePayload = {
        certificate_base64,
        certificate_password,
        ambiente,
        emitente: emitente,
        destinatario: destinatarioPayload,
        produtos: produtosPayload,
        nota_fiscal_info: notaFiscalInfoPayload,
    };

    // 3. Call the Python SEFAZ Service
    // Ensure the SEFAZ service is running and accessible at this URL
    const sefazServiceUrl = process.env.SEFAZ_SERVICE_URL || "http://localhost:5001/api/nfe/generate-transmit";
    let sefazResponseData;

    try {
      const responseFromSefazService = await fetch(sefazServiceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sefazServicePayload),
      });

      sefazResponseData = await responseFromSefazService.json();

      if (!responseFromSefazService.ok) {
        // The SEFAZ service itself returned an error (e.g., 4xx, 5xx)
        await prisma.notaFiscal.update({
          where: { id: notaFiscalId },
          data: {
            status: "ERRO",
            motivoRejeicao: `Erro ao chamar serviço SEFAZ: ${sefazResponseData.error || responseFromSefazService.statusText} - ${JSON.stringify(sefazResponseData.details || sefazResponseData.raw_response)}`,
          },
        });
        return NextResponse.json({ error: "Erro no serviço SEFAZ", details: sefazResponseData }, { status: responseFromSefazService.status });
      }
    } catch (fetchError: any) {
      // Network error or SEFAZ service not reachable
      await prisma.notaFiscal.update({
        where: { id: notaFiscalId },
        data: {
          status: "ERRO",
          motivoRejeicao: `Falha de comunicação com serviço SEFAZ: ${fetchError.message}`,
        },
      });
      return NextResponse.json({ error: "Falha de comunicação com serviço SEFAZ", details: fetchError.message }, { status: 503 });
    }

    // 4. Update NotaFiscal in DB with SEFAZ response
    let updatedNotaData: any = {
        status: notaFiscal.status, // Keep current status unless changed by SEFAZ response
        motivoRejeicao: null,
    };

    if (sefazResponseData.status_sefaz === "autorizada") {
        updatedNotaData.status = "AUTORIZADA";
        updatedNotaData.chaveAcesso = sefazResponseData.chave_acesso;
        updatedNotaData.protocolo = sefazResponseData.protocolo;
        updatedNotaData.xml = sefazResponseData.xml_autorizado; // Store the authorized XML
        updatedNotaData.dataAutorizacao = new Date();
        // updatedNotaData.pdfUrl = ? // If DANFE PDF is returned as URL or needs to be stored/linked
        if (sefazResponseData.danfe_pdf_base64) {
            // Handle storing/linking the PDF. For now, maybe store as a large string or save to a file and link.
            // This is a placeholder for PDF handling.
            // For simplicity, we might not store it directly in DB if too large.
            // Could save to a file and store path, or just allow re-generation on demand.
            // For now, let's assume we might store a path or a flag that it's available.
        }
    } else if (sefazResponseData.status_sefaz === "rejeitada_ou_erro") {
        updatedNotaData.status = sefazResponseData.codigo_status_sefaz === "204" ? "CANCELADA" : "REJEITADA"; // Example: 204 Duplicidade de NF-e
        updatedNotaData.motivoRejeicao = `(${sefazResponseData.codigo_status_sefaz}) ${sefazResponseData.motivo_sefaz}`;
    } else {
        // Unknown status from SEFAZ service response
        updatedNotaData.status = "ERRO";
        updatedNotaData.motivoRejeicao = `Resposta inesperada do serviço SEFAZ: ${JSON.stringify(sefazResponseData)}`;
    }
    
    // Update numero_nf and serie_nf if they were generated and are now confirmed by SEFAZ (or part of the authorized XML)
    // This depends on how PyNFe and your sequential control work.
    // If PyNFe uses the numero_nf and serie_nf you provided, and they are in the authorized XML, they are confirmed.
    // If the service generates them, you need to get them back.
    // For now, assume they are confirmed if authorized.
    if (updatedNotaData.status === "AUTORIZADA") {
        updatedNotaData.numero = notaFiscalInfoPayload.numero_nf;
        updatedNotaData.serie = notaFiscalInfoPayload.serie_nf;
    }

    const finalUpdatedNota = await prisma.notaFiscal.update({
      where: { id: notaFiscalId },
      data: updatedNotaData,
    });

    return NextResponse.json({ 
        message: "Processamento SEFAZ concluído", 
        sefaz_response: sefazResponseData,
        updated_nota_fiscal: finalUpdatedNota 
    });

  } catch (error: any) {
    console.error("Erro ao processar transmissão SEFAZ para Nota Fiscal:", error);
    // Attempt to update NF status to ERRO if an unexpected error occurs here
    try {
        await prisma.notaFiscal.update({
            where: { id: notaFiscalId },
            data: { status: "ERRO", motivoRejeicao: `Erro interno no servidor: ${error.message}` }
        });
    } catch (dbError) {
        console.error("Falha ao atualizar status da NF para ERRO após erro principal:", dbError);
    }
    return NextResponse.json({ error: "Erro interno no servidor", details: error.message }, { status: 500 });
  }
}


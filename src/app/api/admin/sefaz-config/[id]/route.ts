import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { z } from "zod";
import fs from "fs/promises";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// Encryption/Decryption constants - should match admin/sefaz-config/route.ts
const ENCRYPTION_KEY = process.env.CERTIFICATE_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error("CRITICAL: CERTIFICATE_ENCRYPTION_KEY is not set or is too short for notas-fiscais/transmitir.");
}

// Decryption function - should match admin/sefaz-config/route.ts
function decrypt(encryptedText: string): string | null {
  if (!ENCRYPTION_KEY) {
    console.error("Decryption key not available in notas-fiscais/transmitir.");
    return null;
  }
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted text format for password decryption.");
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedData = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed in notas-fiscais/transmitir:", error);
    return null;
  }
}

const sefazTransmitSchema = z.object({
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

    const { ambiente } = validation.data;

    // 1. Fetch active SEFAZ Configuration
    const sefazConfig = await prisma.sefazConfiguration.findFirst({
      where: { isActive: true },
    });

    if (!sefazConfig || !sefazConfig.certificatePath || !sefazConfig.encryptedPassword) {
      return NextResponse.json({ error: "Configuração SEFAZ (certificado/senha) não encontrada ou incompleta." }, { status: 400 });
    }

    // 2. Read certificate file and decrypt password
    let certificate_base64: string;
    try {
      const certFileBuffer = await fs.readFile(sefazConfig.certificatePath);
      certificate_base64 = certFileBuffer.toString("base64");
    } catch (fileError) {
      console.error("Error reading certificate file:", fileError);
      return NextResponse.json({ error: "Erro ao ler arquivo do certificado configurado." }, { status: 500 });
    }

    const certificate_password = decrypt(sefazConfig.encryptedPassword);
    if (!certificate_password) {
      return NextResponse.json({ error: "Erro ao decifrar a senha do certificado configurado." }, { status: 500 });
    }

    // 3. Fetch NotaFiscal and related data
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id: notaFiscalId },
      include: {
        orcamento: {
          include: {
            cliente: true,
            itens: true,
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

    // 4. Prepare Emitente details from SefazConfiguration
    const emitente = {
        cnpj: sefazConfig.companyCnpj,
        nome_razao: sefazConfig.emitenteNomeRazao || "",
        nome_fantasia: sefazConfig.emitenteNomeFantasia || sefazConfig.emitenteNomeRazao || "",
        logradouro: sefazConfig.emitenteLogradouro || "",
        numero: sefazConfig.emitenteNumero || "S/N",
        complemento: sefazConfig.emitenteComplemento || "",
        bairro: sefazConfig.emitenteBairro || "",
        municipio_nome: sefazConfig.emitenteMunicipioNome || "",
        municipio_codigo_ibge: sefazConfig.emitenteMunicipioCodigo || "",
        uf_sigla: sefazConfig.emitenteUfSigla || "", // Crucial for PyNFe config
        cep: sefazConfig.emitenteCep || "",
        telefone: sefazConfig.emitenteTelefone || "",
        inscricao_estadual: sefazConfig.emitenteInscricaoEstadual || "",
        regime_tributario_codigo: sefazConfig.emitenteRegimeTributario || "1",
    };
    if (!emitente.uf_sigla) {
        return NextResponse.json({ error: "UF do emitente não configurada na Configuração SEFAZ." }, { status: 400 });
    }

    // 5. Prepare Destinatario and Produtos details (as before)
    const cliente = notaFiscal.orcamento.cliente;
    const destinatarioPayload = {
        cpf_cnpj: cliente.cpf?.replace(/\D/g, "") || cliente.nome, // Use name if CPF is not available
        nome_razao: cliente.nomeSocial || cliente.nome,
        logradouro: cliente.rua || "",
        numero: cliente.numero || "S/N",
        bairro: cliente.bairro || "",
        municipio_nome: cliente.cidade || "",
        municipio_codigo_ibge: "", // Placeholder, needs mapping
        uf_sigla: cliente.estado || "",
        cep: cliente.cep?.replace(/\D/g, "") || "",
        telefone: cliente.telefone?.replace(/\D/g, "") || "",
        email: cliente.email || "",
        indicador_ie_codigo: "9",
    };
    // Basic IBGE code mapping example (should be more robust)
    if (destinatarioPayload.uf_sigla && destinatarioPayload.municipio_nome) {
        // This is a very simplified example. A proper lookup is needed.
        if (destinatarioPayload.uf_sigla.toUpperCase() === "SP" && destinatarioPayload.municipio_nome.toUpperCase() === "SAO PAULO") {
            destinatarioPayload.municipio_codigo_ibge = "3550308";
        }
    }

    const produtosPayload = notaFiscal.orcamento.itens.map((item, index) => ({
        item: (index + 1).toString(),
        codigo_produto: item.id.substring(0, 20), // Ensure product code is not too long
        descricao: item.descricao,
        ncm: "00000000", // Placeholder
        cfop: "5102",     // Placeholder
        unidade_comercial: "UN",
        quantidade: item.metragem || 1,
        valor_unitario: item.precoUnitario || 0,
        valor_total_bruto: item.precoFinal || 0,
        tributos: {
            icms: { origem: "0", cst: "00", mod_bc: "3", valor_bc: item.precoFinal || 0, aliquota: 0, valor: 0 },
            pis: { cst: "01", valor_bc: item.precoFinal || 0, aliquota_percentual: 0, valor: 0 },
            cofins: { cst: "01", valor_bc: item.precoFinal || 0, aliquota_percentual: 0, valor: 0 },
        },
    }));

    const notaFiscalInfoPayload = {
        natureza_operacao: "VENDA DE MERCADORIA",
        modelo_documento_fiscal: notaFiscal.tipo === "NFE" ? "55" : (notaFiscal.tipo === "NFCE" ? "65" : "55"),
        serie_nf: notaFiscal.serie || "1",
        numero_nf: notaFiscal.numero || uuidv4().substring(0,8).replace(/-/g, ""),
        data_emissao: new Date().toISOString(),
        finalidade_emissao_codigo: "1",
        tipo_operacao_codigo: "1",
        forma_pagamento_nf_codigo: "0",
        presenca_comprador_codigo: "1",
        pagamentos: [
            {
                forma_pagamento_codigo: "01",
                valor_pagamento: notaFiscal.orcamento.valorTotal || 0
            }
        ]
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

    // 6. Call the Python SEFAZ Service (as before)
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
        await prisma.notaFiscal.update({
          where: { id: notaFiscalId },
          data: { status: "ERRO", motivoRejeicao: `Serviço SEFAZ: ${sefazResponseData.error || responseFromSefazService.statusText} - ${JSON.stringify(sefazResponseData.details || sefazResponseData.raw_response)}`},
        });
        return NextResponse.json({ error: "Erro no serviço SEFAZ", details: sefazResponseData }, { status: responseFromSefazService.status });
      }
    } catch (fetchError: any) {
      await prisma.notaFiscal.update({
        where: { id: notaFiscalId },
        data: { status: "ERRO", motivoRejeicao: `Comunicação com serviço SEFAZ: ${fetchError.message}` },
      });
      return NextResponse.json({ error: "Falha de comunicação com serviço SEFAZ", details: fetchError.message }, { status: 503 });
    }

    // 7. Update NotaFiscal in DB with SEFAZ response (as before)
    let updatedNotaData: any = { motivoRejeicao: null };

    if (sefazResponseData.status_sefaz === "autorizada") {
        updatedNotaData.status = "AUTORIZADA";
        updatedNotaData.chaveAcesso = sefazResponseData.chave_acesso;
        updatedNotaData.protocolo = sefazResponseData.protocolo;
        updatedNotaData.xml = sefazResponseData.xml_autorizado;
        updatedNotaData.dataAutorizacao = new Date();
        updatedNotaData.numero = notaFiscalInfoPayload.numero_nf;
        updatedNotaData.serie = notaFiscalInfoPayload.serie_nf;
    } else if (sefazResponseData.status_sefaz === "rejeitada_ou_erro") {
        updatedNotaData.status = sefazResponseData.codigo_status_sefaz === "204" ? "CANCELADA" : "REJEITADA";
        updatedNotaData.motivoRejeicao = `(${sefazResponseData.codigo_status_sefaz}) ${sefazResponseData.motivo_sefaz}`;
    } else {
        updatedNotaData.status = "ERRO";
        updatedNotaData.motivoRejeicao = `Resposta inesperada do serviço SEFAZ: ${JSON.stringify(sefazResponseData)}`;
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
    try {
        await prisma.notaFiscal.update({
            where: { id: notaFiscalId },
            data: { status: "ERRO", motivoRejeicao: `Erro interno no servidor API: ${error.message}` }
        });
    } catch (dbError) {
        console.error("Falha ao atualizar status da NF para ERRO após erro principal:", dbError);
    }
    return NextResponse.json({ error: "Erro interno no servidor", details: error.message }, { status: 500 });
  }
}


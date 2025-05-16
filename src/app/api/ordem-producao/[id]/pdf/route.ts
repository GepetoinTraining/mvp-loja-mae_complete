// src/app/api/ordem-producao/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth"; // Adjusted path
import { WeasyPrint } from "weasyprint"; // Using WeasyPrint for HTML to PDF
import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process"; // For calling Python script

// Helper function to render Jinja-like template using Python script
function renderTemplateWithJinja(templatePath: string, data: object): string {
  const dataString = JSON.stringify(data).replace(/"/g, "\"");
  const scriptPath = path.resolve(process.cwd(), "src/scripts/render_jinja_template.py");
  const templateDir = path.dirname(templatePath);
  const templateFile = path.basename(templatePath);
  
  // Ensure the script has execute permissions
  try {
    execSync(`chmod +x ${scriptPath}`);
  } catch (e) {
    console.warn("Could not chmod +x python script, assuming it has permissions.")
  }

  const command = `python3 ${scriptPath} "${templateDir}" "${templateFile}" "${dataString}"`;
  
  try {
    const output = execSync(command, { encoding: "utf-8" });
    return output;
  } catch (error: any) {
    console.error("Error rendering Jinja template:", error.stderr || error.message);
    throw new Error("Failed to render Jinja template: " + (error.stderr || error.message));
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ordemId = params.id;

  try {
    const ordemProducao = await prisma.ordemProducao.findUnique({
      where: { id: ordemId },
      include: {
        orcamento: {
          include: {
            cliente: true,
            vendedor: true,
          },
        },
        itens: true,
        responsavel: true,
      },
    });

    if (!ordemProducao) {
      return NextResponse.json({ error: "Ordem de Produção não encontrada" }, { status: 404 });
    }

    // Prepare data for the template
    const templateData = {
      ordem: {
        ...ordemProducao,
        idCurto: ordemProducao.id.substring(0, 8),
        dataCriacaoFormatada: new Date(ordemProducao.createdAt).toLocaleDateString("pt-BR"),
        dataPrevistaEntregaFormatada: ordemProducao.dataPrevistaEntrega 
            ? new Date(ordemProducao.dataPrevistaEntrega).toLocaleDateString("pt-BR") 
            : "N/A",
        statusFormatado: ordemProducao.status.replace(/_/g, " "),
      },
      cliente: ordemProducao.orcamento?.cliente,
      vendedor: ordemProducao.orcamento?.vendedor,
      responsavelProducao: ordemProducao.responsavel,
      itens: ordemProducao.itens.map(item => ({
        ...item,
        quantidadeFormatada: item.quantidade.toLocaleString("pt-BR"),
      })),
      dataGeracao: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      // Add any other necessary data for the OP PDF
    };

    const templatePath = path.resolve(process.cwd(), "src/templates/ordem_producao_pdf_template.html");
    
    // Check if template file exists
    try {
        await fs.access(templatePath);
    } catch (e) {
        console.error("Template file not found:", templatePath);
        return NextResponse.json({ error: "Ordem de Produção PDF template not found." }, { status: 500 });
    }

    const htmlContent = renderTemplateWithJinja(templatePath, templateData);

    // Generate PDF using WeasyPrint
    const pdfBuffer = await new WeasyPrint({ html: htmlContent }).writePdf();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="ordem_producao_${ordemProducao.id.substring(0,8)}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("Failed to generate Ordem de Produção PDF:", error);
    return NextResponse.json({ error: "Failed to generate Ordem de Produção PDF", details: error.message }, { status: 500 });
  }
}


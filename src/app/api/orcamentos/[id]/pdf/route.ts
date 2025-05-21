// API route for /api/orcamentos/[id]/pdf
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Adjusted path
import { WeasyPrint } from "weasyprint"; // Correct import for WeasyPrint
import path from "path";
import { execSync } from "child_process"; // For calling Python script

// Helper function to render Jinja2 template using Python
function renderTemplateWithJinja(templatePath: string, data: object): string {
  const scriptPath = path.resolve(process.cwd(), "src/scripts/render_jinja_template.py");
  const dataJsonString = JSON.stringify(data).replace(/'/g, "'\\''"); // Escape single quotes for shell
  const command = `python3 "${scriptPath}" "${templatePath}" '${dataJsonString}'`;
  
  try {
    const output = execSync(command, { encoding: "utf-8" });
    return output;
  } catch (error: any) {
    console.error("Error rendering Jinja template:", error.stderr || error.message);
    throw new Error("Failed to render PDF template with Jinja.");
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orcamentoId = params.id;

  try {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: orcamentoId },
      include: {
        cliente: true,
        vendedor: true,
        itens: true,
      },
    });

    if (!orcamento) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }

    // Prepare data for the template
    const subtotal = orcamento.itens.reduce((sum, item) => sum + (item.precoFinal || 0), 0);
    const valorDesconto = orcamento.desconto || 0; // Assuming desconto is a direct value or needs calculation
    const valorTotal = subtotal - valorDesconto; // Simplified total calculation

    const templateData = {
      orcamento: {
        ...orcamento,
        createdAt: new Date(orcamento.createdAt).toLocaleDateString("pt-BR"), // Format date
        status: orcamento.status.replace(/_/g, " "),
        subtotal: subtotal,
        valorDesconto: valorDesconto,
        valorTotal: valorTotal, // Use the calculated total
        itens: orcamento.itens.map(item => ({
            ...item,
            // Ensure all numbers are formatted if needed by Jinja, or handle in template
        })),
        // Add QR code data if available, e.g., a URL to the QR code image or the data itself
        // qrCodePix: "data:image/png;base64,..." // Example if you generate and embed
      },
    };

    const templatePath = path.resolve(process.cwd(), "src/templates/orcamento_pdf_template.html");
    const htmlContent = renderTemplateWithJinja(templatePath, templateData);

    // Generate PDF using WeasyPrint
    const pdfBuffer = await new WeasyPrint({ html: htmlContent }).writePdf();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="orcamento_${orcamentoId}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Failed to generate PDF:", error);
    let errorMessage = "Failed to generate PDF";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


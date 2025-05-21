// src/app/api/ai/generate-product-description/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Adjusted path

// This is a mock implementation. In a real scenario, you would integrate with an AI service.
async function generateDescriptionWithAI(productType: string, currentDescription?: string): Promise<string> {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (!productType) {
    return "Por favor, especifique um tipo de produto para gerar a descrição.";
  }

  let prompt = `Gere uma descrição de produto detalhada e atraente para ${productType}.`;
  if (currentDescription) {
    prompt += ` Considere a seguinte descrição parcial ou palavras-chave: ${currentDescription}.`;
  }
  prompt += " A descrição deve ser adequada para um orçamento comercial.";

  // Mocked AI responses based on product type
  if (productType.toLowerCase().includes("cortina")) {
    return `Cortina ${currentDescription || productType} elegante, confeccionada com tecidos de alta qualidade, proporcionando privacidade e controle de luminosidade. Ideal para ambientes sofisticados. Medidas: (a ser preenchido). Cor: (a ser definida).`;
  }
  if (productType.toLowerCase().includes("persiana")) {
    return `Persiana ${currentDescription || productType} moderna e funcional, oferecendo praticidade no controle da luz e ventilação. Perfeita para escritórios e residências. Material: (a ser especificado). Cor: (a ser definida).`;
  }
  if (productType.toLowerCase().includes("papel de parede")) {
    return `Papel de parede ${currentDescription || productType} com design exclusivo, transformando ambientes com estilo e personalidade. Material lavável e de fácil aplicação. Coleção: (a ser informada).`;
  }
  return `Descrição gerada por IA para ${productType}: ${currentDescription || "Produto de alta qualidade, customizável conforme suas necessidades."}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productType, currentDescription } = await request.json();

    if (!productType || typeof productType !== "string") {
      return NextResponse.json({ error: "Tipo de produto inválido" }, { status: 400 });
    }

    const description = await generateDescriptionWithAI(productType, currentDescription);
    return NextResponse.json({ description });

  } catch (error) {
    console.error("Error generating product description:", error);
    return NextResponse.json({ error: "Falha ao gerar descrição do produto" }, { status: 500 });
  }
}


// src/app/api/ai/generate-product-description/route.ts
import { NextResponse } from "next/server";
<<<<<<< HEAD
import { auth } from "@/lib/auth"; // Adjusted path
=======
import { auth } from "@/../auth"; // Adjusted path
import OpenAI from "openai";
>>>>>>> 6e216db275680a6025a0e6521a60d3ed5209837d

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateDescriptionWithAI(
  productType: string,
  currentDescription?: string,
): Promise<string> {
  const systemPrompt =
    "Você é um assistente que gera descrições curtas de produtos para orçamentos.";
  let userPrompt = `Crie uma descrição atrativa e comercial para ${productType}.`;
  if (currentDescription) {
    userPrompt += ` Palavras-chave ou descrição atual: ${currentDescription}.`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  return text || "";
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


// src/app/api/fornecedores/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Adjusted path
import { z } from "zod";

const fornecedorSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(), // Add validation if CNPJ is mandatory or has specific format
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fornecedores = await prisma.fornecedor.findMany({
      orderBy: {
        nome: "asc",
      },
    });
    return NextResponse.json(fornecedores);
  } catch (error) {
    console.error("Failed to fetch fornecedores:", error);
    return NextResponse.json({ error: "Failed to fetch fornecedores" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  // Assuming only ADMIN or COMPRADOR (Buyer) can create suppliers
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "COMPRADOR")) {
    return NextResponse.json({ error: "Unauthorized to create fornecedor" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = fornecedorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { nome, cnpj, telefone, email, endereco, observacoes } = validation.data;

    const newFornecedor = await prisma.fornecedor.create({
      data: {
        nome,
        cnpj,
        telefone,
        email,
        endereco,
        observacoes,
      },
    });

    return NextResponse.json(newFornecedor, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create fornecedor:", error);
    // Check for unique constraint violation (e.g., duplicate CNPJ or email if they are unique)
    if (error.code === "P2002") { // Prisma unique constraint violation code
        let field = error.meta?.target?.join(', ');
        return NextResponse.json({ error: `Fornecedor com este ${field} já existe.` }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create fornecedor" }, { status: 500 });
  }
}


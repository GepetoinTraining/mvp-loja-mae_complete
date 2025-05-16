import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  if (!token) return NextResponse.redirect(new URL("/", req.url))

  try {
    const body = await req.json();
    const { clienteId, mensagem } = body;

    if (!clienteId || !mensagem) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const followUp = await prisma.followUp.create({
      data: {
        clienteId,
        mensagem,
        userId: user.id, // 🔒 vem do token, não do cliente
      },
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/followups]", error);
    return NextResponse.json({ error: "Erro interno.", detalhe: error.message }, { status: 500 });
  }
}


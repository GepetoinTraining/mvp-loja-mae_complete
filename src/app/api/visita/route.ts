// app/api/visitas/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clienteId, dataHora, vendedorId, tipoVisita } = body;

    if (!clienteId || !dataHora || !vendedorId) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    // 1. Criar a visita
    const novaVisita = await prisma.visita.create({
      data: {
        clienteId,
        vendedorId,
        dataHora: new Date(dataHora),
        tipoVisita, // agora gravando no banco!
      },
    });

    // 2. Atualizar status do lead (se houver)
    await prisma.lead.updateMany({
      where: {
        clienteId,
        vendedorId,
      },
      data: {
        status: "VISITA_AGENDADA",
      },
    });

    return NextResponse.json(novaVisita, { status: 201 });
  } catch (error) {
    console.error("[POST /api/visitas]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

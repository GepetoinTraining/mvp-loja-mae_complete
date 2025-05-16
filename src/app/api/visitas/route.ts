// src/app/api/visitas/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      clienteId,
      vendedorId,
      dataHora,
      tipoVisita,
      ambientes,
      fotos,         // array de { filename: string; base64?: string; legenda?: string }
      payloadForm,   // JSON completo do formulário
    } = body;

    if (!clienteId || !dataHora || !vendedorId) {
      return NextResponse.json(
        { error: "Dados incompletos." },
        { status: 400 }
      );
    }

    const visita = await prisma.visita.create({
      data: {
        clienteId,
        vendedorId,
        dataHora: new Date(dataHora),
        tipoVisita,
        ambientes: {
          create: ambientes.map((amb: any) => ({
            nome: amb.nome,
            observacoes: amb.observacoes,
            produtos: {
              create: amb.produtos.map((prod: any) => ({
                tipoProduto: prod.tipo,
                dados: prod, // JSON com detalhes do produto
                imagemUrl: prod.imagemUrl ?? null,
              })),
            },
          })),
        },
        fotosGerais: {
          create: fotos.map((f: any) => ({
            url: `/uploads/${f.filename}`,
            legenda: f.legenda ?? null,
          })),
        },
        // descomente se seu schema aceita esse campo
        // payloadForm: payloadForm ? JSON.stringify(payloadForm) : null,
      },
      include: {
        ambientes: { include: { produtos: true } },
        fotosGerais: true,
      },
    });

    return NextResponse.json(visita, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/visitas]", error);
    return NextResponse.json(
      { error: "Erro ao salvar visita.", detalhe: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendedorId = searchParams.get("vendedorId") || undefined;
    const dateParam = searchParams.get("date") || undefined;

    // monta o filtro dinamicamente
    const where: any = {};
    if (vendedorId) where.vendedorId = vendedorId;
    if (dateParam) {
      const date = new Date(dateParam);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));
      where.dataHora = { gte: start, lte: end };
    }

    const visitas = await prisma.visita.findMany({
      where,
      include: {
        cliente: { select: { nome: true } },
      },
    });

    const eventos = visitas.map((v) => ({
      title: `Visita – ${v.cliente.nome}`,
      start: v.dataHora,
      end: v.dataHora, // ou: new Date(v.dataHora.getTime() + 60 * 60 * 1000)
      allDay: false,
      resource: v,
    }));

    return NextResponse.json(eventos);
  } catch (error: any) {
    console.error("[GET /api/visitas]", error);
    return NextResponse.json(
      { error: "Erro ao buscar visitas.", detalhe: error.message },
      { status: 500 }
    );
  }
}

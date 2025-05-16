import { prisma } from "@/lib/db";
import { writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const visitaId = formData.get("visitaId") as string;
    const ambientesRaw = formData.get("ambientes") as string;
    const fotos = formData.getAll("fotosGerais") as File[];

    const ambientes = JSON.parse(ambientesRaw);

    // 1. Salvar ambientes e produtos
    for (const ambiente of ambientes) {
      const novoAmbiente = await prisma.ambiente.create({
        data: {
          nome: ambiente.nome,
          observacoes: ambiente.observacoes,
          visitaId,
        },
      });

      for (const produto of ambiente.produtos) {
        await prisma.produtoOrcado.create({
          data: {
            tipoProduto: produto.tipo,
            dados: produto,
            ambienteId: novoAmbiente.id,
          },
        });
      }
    }

    // 2. Salvar fotos gerais no disco e linkar no banco
    for (const file of fotos) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${randomUUID()}_${file.name}`;
      const filePath = path.join(process.cwd(), "public", "uploads", filename);
      await writeFile(filePath, buffer);

      await prisma.fotoVisita.create({
        data: {
          visitaId,
          url: `/uploads/${filename}`,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao finalizar visita:", error);
    return NextResponse.json({ error: "Erro ao finalizar visita" }, { status: 500 });
  }
}

// src/app/api/checklist-instalacao/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth"; // Assuming auth.ts is in the root

interface Params {
  params: {
    id: string;
  };
}

export async function GET(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const checklist = await db.checklistInstalacao.findUnique({
      where: { id: params.id },
      include: {
        orcamento: {
          include: {
            cliente: true,
            itens: true, // Include items from orcamento for checklist generation
          },
        },
        instalador: true,
        fotos: true, // Include photos if you have a FotoChecklist model
      },
    });

    if (!checklist) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }
    return NextResponse.json(checklist);
  } catch (error) {
    console.error("[CHECKLIST_INSTALACAO_ID_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orcamentoId, dataPrevista, dataRealizada, instaladorId, observacoes, itensConferidos, status, assinaturaClienteUrl } = body;

    const updatedChecklist = await db.checklistInstalacao.update({
      where: { id: params.id },
      data: {
        orcamentoId,
        dataPrevista: dataPrevista ? new Date(dataPrevista) : null,
        dataRealizada: dataRealizada ? new Date(dataRealizada) : null,
        instaladorId,
        observacoes,
        itensConferidos,
        status,
        assinaturaClienteUrl,
      },
    });
    return NextResponse.json(updatedChecklist);
  } catch (error) {
    console.error("[CHECKLIST_INSTALACAO_ID_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") { // Or other roles as needed
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.checklistInstalacao.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Checklist deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[CHECKLIST_INSTALACAO_ID_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Assuming authOptions is in lib/auth

const prisma = new PrismaClient();

// GET /api/checklist-instalacao - List all installation checklists
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO" && session.user.role !== "VENDEDOR" && session.user.role !== "INSTALADOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const checklists = await prisma.checklistInstalacao.findMany({
      include: {
        orcamento: {
          include: {
            cliente: true,
          },
        },
        instalador: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(checklists);
  } catch (error) {
    console.error("Error fetching installation checklists:", error);
    return NextResponse.json({ error: "Failed to fetch installation checklists" }, { status: 500 });
  }
}

// POST /api/checklist-instalacao - Create a new installation checklist
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "FINANCEIRO")) {
    // Only Admin or Financeiro can create checklists initially
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orcamentoId, dataPrevista, instaladorId, observacoes } = body;

    if (!orcamentoId) {
      return NextResponse.json({ error: "Budget ID (orcamentoId) is required" }, { status: 400 });
    }

    // Fetch budget items to auto-populate checklist items
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: orcamentoId },
      include: { itens: true },
    });

    if (!orcamento) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Auto-populate checklist items from budget items
    const itensConferidos = orcamento.itens.map(item => ({
      item: item.descricao, // Or a more detailed description if available
      checked: false,
      obs: "",
    }));

    const newChecklist = await prisma.checklistInstalacao.create({
      data: {
        orcamentoId,
        dataPrevista: dataPrevista ? new Date(dataPrevista) : null,
        instaladorId,
        observacoes,
        status: "PENDENTE", // Default status
        itensConferidos: itensConferidos, // Automatically populated
      },
      include: {
        orcamento: true,
        instalador: true,
      }
    });

    return NextResponse.json(newChecklist, { status: 201 });
  } catch (error) {
    console.error("Error creating installation checklist:", error);
    return NextResponse.json({ error: "Failed to create installation checklist" }, { status: 500 });
  }
}


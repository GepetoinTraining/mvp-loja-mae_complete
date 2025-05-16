// app/api/leads/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { prisma } from "@/lib/db";
import { LeadStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// helper para checar token e devolver payload ou null
async function authenticate(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    return verifyJwt(token) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") as LeadStatus | null;

  const where: any = { vendedorId: payload.id };
  if (statusParam) where.status = statusParam;

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { nome, telefone, email } = await req.json();
  if (!nome || !telefone) {
    return NextResponse.json(
      { error: "Nome e telefone são obrigatórios" },
      { status: 400 }
    );
  }

  const newLead = await prisma.lead.create({
    data: {
      nome,
      telefone,
      email: email || null,
      status: LeadStatus.SEM_DONO,
      vendedorId: payload.id,
    },
  });

  return NextResponse.json(newLead, { status: 201 });
}

// app/api/clientes/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "src/lib/jwt";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Helper para autenticar e obter payload ou null
async function authenticate(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
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

  const clientes = await prisma.cliente.findMany({
    where: {
      leads: {
        some: { vendedorId: payload.id },
      },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    nome,
    nomeSocial,
    telefone,
    email,
    cpf,
    aniversario,
    fotoUrl,
    sexo,
    cep,
    estado,
    cidade,
    bairro,
    rua,
    numero,
    complemento,
    tipo,
    origemLead,
    interesseEm,
    observacoes,
  } = body;

  if (!nome || !telefone) {
    return NextResponse.json(
      { error: "Nome e telefone são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const novoCliente = await prisma.cliente.create({
      data: {
        nome,
        nomeSocial: nomeSocial || null,
        telefone,
        email: email || null,
        cpf: cpf || null,
        aniversario: aniversario ? new Date(aniversario) : null,
        fotoUrl: fotoUrl || null,
        sexo: sexo || null,
        cep: cep || null,
        estado: estado || null,
        cidade: cidade || null,
        bairro: bairro || null,
        rua: rua || null,
        numero: numero || null,
        complemento: complemento || null,
        tipo: tipo === "MASTER" ? "MASTER" : "NORMAL",
        origemLead: origemLead || null,
        interesseEm: interesseEm || [],
        observacoes: observacoes || null,
        vendedorId: payload.sub,
      },
    });

    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar cliente" },
      { status: 500 }
    );
  }
}

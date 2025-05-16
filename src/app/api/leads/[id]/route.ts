// app/api/clientes/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { prisma } from "@/lib/db";

// Campos permitidos para atualização
const UPDATABLE_FIELDS = [
  "nome",
  "nomeSocial",
  "telefone",
  "email",
  "cpf",
  "aniversario",
  "fotoUrl",
  "sexo",
  "cep",
  "estado",
  "cidade",
  "bairro",
  "rua",
  "numero",
  "complemento",
  "tipo",
  "origemLead",
  "interesseEm",
  "observacoes",
] as const;

type UpdatableField = typeof UPDATABLE_FIELDS[number];

// Helper de autenticação
async function authenticate(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    return verifyJwt(token) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Busca cliente por ID, incluindo relacionamentos
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      visitas: true,
      orcamentos: true,
      leads: true,
      followUps: true,
    },
  });

  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(cliente);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { clienteId } = await req.json();
  if (!clienteId) {
    return NextResponse.json({ error: "clienteId obrigatório" }, { status: 400 });
  }

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: {
      clienteId,
      status: "PRIMEIRO_CONTATO",     // ou outro status que faça sentido
      vendedorId: payload.sub, // (re)amarrar o vendedor como dono
    },
  });

  return NextResponse.json(lead);
}

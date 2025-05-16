import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = getUserFromToken();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: {
        id: params.id,
        vendedorId: user.id, // 🔐 garante que pertence ao usuário logado
      },
      include: {
        visitas: true,
        leads: true,
        orcamentos: {
          include: { itens: true },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado ou acesso negado" },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const clienteAtualizado = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        nome: body.nome,
        nomeSocial: body.nomeSocial,
        telefone: body.telefone,
        email: body.email,
        cpf: body.cpf,
        aniversario: body.aniversario ? new Date(body.aniversario) : null,
        fotoUrl: body.fotoUrl,
        sexo: body.sexo,
        cep: body.cep,
        estado: body.estado,
        cidade: body.cidade,
        bairro: body.bairro,
        rua: body.rua,
        numero: body.numero,
        complemento: body.complemento,
        tipo: body.tipo,
        origemLead: body.origemLead,
        interesseEm: body.interesseEm,
        observacoes: body.observacoes,
      },
    });

    return NextResponse.json(clienteAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
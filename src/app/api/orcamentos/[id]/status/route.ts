import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs"; // For password hashing

// Define the OrcamentoStatus enum values from your schema.prisma
enum OrcamentoStatus {
  EM_ANDAMENTO = "EM_ANDAMENTO",
  AGUARDANDO_APROVACAO = "AGUARDANDO_APROVACAO",
  FECHADO = "FECHADO",
  CANCELADO = "CANCELADO",
}

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrcamentoStatus),
});

// Function to generate a random password
function generateRandomPassword(length = 10) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "VENDEDOR")) {
    return NextResponse.json({ error: "Forbidden: Apenas Admins ou Vendedores podem alterar o status." }, { status: 403 });
  }

  const { id: orcamentoId } = params;

  if (!orcamentoId) {
    return NextResponse.json({ error: "ID do Orçamento é obrigatório." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados de entrada inválidos", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { status: newStatus } = validation.data;

    const orcamento = await prisma.orcamento.findUnique({
      where: { id: orcamentoId },
      include: { 
        cliente: true, // Include cliente for user creation
      },
    });

    if (!orcamento) {
      return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
    }

    if (orcamento.status === newStatus) {
      return NextResponse.json(
        { message: "Orçamento já está neste status.", orcamento },
        { status: 200 }
      );
    }

    const updatedOrcamento = await prisma.orcamento.update({
      where: { id: orcamentoId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        cliente: true,
        itens: true,
        vendedor: true,
      }
    });

    if (newStatus === OrcamentoStatus.FECHADO && updatedOrcamento.cliente) {
      console.log(`Orçamento ${orcamentoId} foi FECHADO. Iniciando criação de usuário para cliente ${updatedOrcamento.clienteId}`);
      
      const cliente = updatedOrcamento.cliente;

      if (!cliente.email) {
        console.warn(`Cliente ${cliente.id} não possui email. Não é possível criar usuário.`);
        // Optionally, you might want to return a specific message or handle this case
      } else {
        // Check if a user already exists for this clienteId or email
        const existingUserByClienteId = await prisma.user.findFirst({
          where: { cliente: { id: cliente.id } },
        });
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email: cliente.email },
        });

        if (existingUserByClienteId || existingUserByEmail) {
          console.log(`Usuário já existe para o cliente ${cliente.id} (email: ${cliente.email}).`);
          if (cliente.userId && (existingUserByClienteId?.id === cliente.userId || existingUserByEmail?.id === cliente.userId)) {
            console.log("Cliente já está associado ao usuário existente.");
          } else if (existingUserByEmail && !cliente.userId) {
            // If user exists by email but cliente is not linked, link them
            await prisma.cliente.update({
                where: { id: cliente.id },
                data: { userId: existingUserByEmail.id },
            });
            console.log(`Cliente ${cliente.id} associado ao usuário existente ${existingUserByEmail.id} pelo email.`);
          }
        } else {
          const rawPassword = generateRandomPassword();
          const hashedPassword = await bcrypt.hash(rawPassword, 10);

          try {
            const newUser = await prisma.user.create({
              data: {
                name: cliente.nome || "Cliente", // Use cliente's name or a default
                email: cliente.email,
                password: hashedPassword,
                role: "CLIENTE", // Assign CLIENTE role
                cliente: {
                  connect: { id: cliente.id },
                },
              },
            });
            console.log(`Novo usuário criado para cliente ${cliente.id} com ID: ${newUser.id}. Senha (antes do hash): ${rawPassword}`);
            // TODO: Implement email sending with credentials (rawPassword) here if required
            // For security, do not log rawPassword in production

          } catch (userCreationError: any) {
            console.error(`Erro ao criar usuário para cliente ${cliente.id}:`, userCreationError);
            // Decide how to handle user creation failure - rollback status? Log and continue?
            // For now, we log and the orcamento status update will still be successful.
          }
        }
      }
    }

    return NextResponse.json(updatedOrcamento);
  } catch (error: any) {
    console.error("Erro ao atualizar status do orçamento:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao atualizar status.", details: error.message },
      { status: 500 }
    );
  }
}


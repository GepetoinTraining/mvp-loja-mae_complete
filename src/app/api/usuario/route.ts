import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  if (!token) return NextResponse.redirect(new URL("/", req.url))
  }

  try {
    const body = await req.json();
    const { name, email, senha, tituloLoja, avatarUrl } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const updateData: any = {
      name,
      email,
      tituloLoja,
      avatarUrl,
    };

    if (senha) {
      const hashed = await bcrypt.hash(senha, 10);
      updateData.password = hashed;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id }, // 🔐 ID seguro do token
      data: updateData,
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("[PUT /api/usuario]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

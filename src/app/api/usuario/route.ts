import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!; // Or your actual key if named differently

export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    let user: any;
    try {
      user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

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
      where: { id: user.id }, // From decoded token
      data: updateData,
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("[PUT /api/usuario]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

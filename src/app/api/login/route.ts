// app/api/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { compare } from "bcryptjs";
import { signJwt } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await compare(password, user.password))) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Empacote TODOS os campos que o badge/dropdown vai precisar:
    const token = signJwt({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      tituloLoja: user.tituloLoja ?? null,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        tituloLoja: user.tituloLoja,
      },
      token,
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 12,
      sameSite: "strict",
      // secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    console.error("Erro no login:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

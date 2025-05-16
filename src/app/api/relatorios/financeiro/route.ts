import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { Role } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  // Allow ADMIN or FINANCEIRO to fetch user lists, especially for filtering by VENDEDOR
  if (!session?.user?.id || (session.user.role !== Role.ADMIN && session.user.role !== Role.FINANCEIRO)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get("role");

  let whereClause = {};
  if (roleParam) {
    const roleEnumValue = Role[roleParam.toUpperCase() as keyof typeof Role];
    if (roleEnumValue) {
      whereClause = { role: roleEnumValue };
    } else {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }
  }

  try {
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao buscar usuários", details: error.message }, { status: 500 });
  }
}


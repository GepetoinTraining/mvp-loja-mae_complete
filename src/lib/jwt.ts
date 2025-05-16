// src/lib/jwt.ts
import { encode, decode, JWT } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET as string;
const MAX_AGE = 12 * 60 * 60; // 12 horas em segundos

/**
 * Gera um JWT compatível com NextAuth
 */
export async function signJwt(payload: object): Promise<string> {
  return await encode({
    token: payload as JWT,
    secret,
    maxAge: MAX_AGE,
  });
}

/**
 * Valida/decodifica um JWT gerado pelo NextAuth
 */
export async function verifyJwt<T = any>(token: string): Promise<T | null> {
  const decoded = await decode({ token, secret });
  return (decoded as T) || null;
}

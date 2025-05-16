// src/lib/session.ts
import { auth } from '@/lib/auth'; // Importe o 'auth' do seu arquivo principal de configuração
import { UserRole, AuthPayload } from '@/lib/auth'; // Importe os tipos necessários

export async function getCurrentUser(): Promise<AuthPayload | null> {
  try {
    const session = await auth(); // Agora 'auth' é o exportado de @/lib/auth

    if (session && session.user) {
      return {
        id: session.user.id as string,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as UserRole,
      };
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter usuário da sessão:", error);
    return null;
  }
}
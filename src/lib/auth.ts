// /home/ubuntu/mvp-loja-mae-rebuilt/src/lib/auth.ts
import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import { getServerSession } from "next-auth/next";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs"; // Uncomment and use bcrypt for hashing in production

const prisma = new PrismaClient();

// DEBUG
console.log("🔐 [auth.ts] NEXTAUTH_SECRET =", process.env.NEXTAUTH_SECRET);

// Define UserRole enum locally
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  INSTALADOR = "INSTALADOR",
  VENDEDOR = "VENDEDOR",
  MARKETER = "MARKETER",
}

// Payload returned from getUserFromToken
export interface AuthPayload {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
}

// Extend default session user type
interface CustomUser extends NextAuthUser {
  id: string;
  role: UserRole;
}

export const nextAuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "My Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req): Promise<CustomUser | null> {
        if (!credentials) {
          console.log("Authorize: missing credentials");
          return null;
        }
        const { email, password } = credentials;
        if (!email || !password) {
          console.log("Authorize: Email or password not provided");
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.role) {
          console.log("Authorize: User not found or role missing", email);
          return null;
        }
        // TODO: Replace plain-text check with bcrypt.compare in production
        const isPasswordValid = password === (user as any).passwordHash;
        if (!isPasswordValid) {
          console.log("Authorize: Invalid password for", email);
          return null;
        }
        console.log("Authorize: Authentication successful for", email);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    // ... your callbacks here
  },
};

// Destructure NextAuth handlers and helpers
export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthOptions);

// Utility to get user from session
export async function getUserFromToken(): Promise<AuthPayload | null> {
  try {
    const session = await getServerSession(nextAuthOptions);
    if (session?.user) {
      const { id, name, email, role } = session.user as CustomUser;
      return { id, name, email, role };
    }
    return null;
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
}

"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function UserDropdown() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore.getState().setUser;
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!user) return null;

  async function handleLogout() {
    // 1) chama o endpoint que limpa o cookie no servidor
    await fetch("/api/logout", { method: "POST" });
    // 2) limpa o estado do usuário no client
    setUser(null);
    // 3) redireciona para a tela de login
    router.push("/login");
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={user.avatarUrl ?? "/avatar-placeholder.png"}
              alt="avatar"
            />
            <AvatarFallback>{user.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">
              {user.tituloLoja ?? "Sem loja vinculada"}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/perfil" onClick={() => setOpen(false)}>
            Ver Perfil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            setTheme(
              theme === "light"
                ? "dark"
                : theme === "dark"
                ? "brand"
                : "light"
            );
          }}
        >
          {theme === "light"
            ? "Modo Escuro"
            : theme === "dark"
            ? "Modo Brand"
            : "Modo Claro"}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-red-600"
          onClick={handleLogout}
        >
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useTheme } from "next-themes";
import { useState } from "react";

export function UserBadge() {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-3 px-2 py-1">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatarUrl ?? "/avatar-placeholder.png"} />
            <AvatarFallback>{user.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-primary">
              {user.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {user.tituloLoja ?? "Sem loja vinculada"}
            </div>
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-48 space-y-2">
        <Link
          href="/perfil"
          className="block text-sm px-3 py-2 rounded hover:bg-muted transition"
          onClick={() => setOpen(false)}
        >
          Ver perfil
        </Link>

        <Button
          variant="ghost"
          className="w-full text-sm text-left px-3 py-2 hover:bg-muted"
          onClick={() =>
            setTheme(
              theme === "light"
                ? "dark"
                : theme === "dark"
                ? "brand"
                : "light"
            )
          }
        >
          {theme === "light"
            ? "Modo Escuro"
            : theme === "dark"
            ? "Modo Brand"
            : "Modo Claro"}
        </Button>

        <Button
          variant="ghost"
          className="w-full text-sm text-left px-3 py-2 text-red-600 hover:bg-red-100"
          onClick={() => {
            useAuthStore.getState().setUser(null);
            localStorage.removeItem("vendedorId");
            location.href = "/";
          }}
        >
          Sair
        </Button>
      </PopoverContent>
    </Popover>
  );
}

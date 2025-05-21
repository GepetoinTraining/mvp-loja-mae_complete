"use client";

import type { ClienteDTO } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export function ClientSummaryCard({ cliente }: { cliente: ClienteDTO }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Avatar + Nome + Email */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={cliente.fotoUrl || ""} alt={cliente.nome} />
            <AvatarFallback>
              <User className="w-6 h-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="text-xl font-bold text-primary">
              {cliente.nomeSocial || cliente.nome}
            </h2>
            <p className="text-sm text-muted-foreground">
              {cliente.email || "Sem email"}
            </p>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Telefone</p>
            <p>{cliente.telefone || "Não informado"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">E-mail</p>
            <p>{cliente.email || "Não informado"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Endereço</p>
            <p>
              {cliente.rua && cliente.numero
                ? `${cliente.rua}, ${cliente.numero} – ${cliente.cidade}/${cliente.estado}`
                : "Não informado"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

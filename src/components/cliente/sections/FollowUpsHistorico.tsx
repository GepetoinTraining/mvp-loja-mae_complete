"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card"; // Corrected path
import { ScrollArea } from "@/components/ui/scroll-area"; // Corrected path
import { User } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

type FollowUp = {
  id: string;
  mensagem: string;
  criadoEm: string;
  autor: {
    name: string;
    avatarUrl?: string | null;
  };
};

export function FollowUpsHistorico({ clienteId }: { clienteId: string }) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  useEffect(() => {
    async function fetchFollowUps() {
      const res = await fetch(`/api/followups?clienteId=${clienteId}`);
      const data = await res.json();
      setFollowUps(data);
    }

    fetchFollowUps();
  }, [clienteId]);

  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-primary">Histórico de Alterações</h2>

      {followUps.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>
      ) : (
        <ScrollArea className="h-[500px] pr-2">
          <ul className="space-y-3">
            {followUps.map((fup) => (
              <li key={fup.id} className="border rounded-md p-3 space-y-2 bg-muted/20">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    {fup.autor?.avatarUrl ? (
                      <AvatarImage src={fup.autor.avatarUrl} alt={fup.autor.name} />
                    ) : (
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {fup.autor?.name || "Usuário desconhecido"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayjs(fup.criadoEm).format("DD/MM/YYYY [às] HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground whitespace-pre-line border-l-2 pl-3 border-primary">
                  {fup.mensagem}
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </Card>
  );
}


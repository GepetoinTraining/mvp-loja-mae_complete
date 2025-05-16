"use client";

import type { ClienteDTO } from "@/lib/types";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/src/components/ui/button";

interface Props {
  cliente: ClienteDTO;
}

export function ClientFollowUps({ cliente }: Props) {
  const [editing, setEditing] = useState(false);
  const [texto, setTexto] = useState(cliente.observacoes || "");

  const handleSave = async () => {
    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observacoes: texto }),
    });

    if (res.ok) {
      setEditing(false);
    } else {
      alert("Erro ao salvar observações");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Follow-ups</CardTitle>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {editing ? (
          <>
            <Textarea
              rows={4}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">
                Salvar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTexto(cliente.observacoes || "");
                  setEditing(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {cliente.observacoes || "Nenhuma observação registrada."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import type { LeadDTO as LeadType } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface LeadCardProps {
  lead: LeadType;
  onConvert?: (leadId: string) => Promise<void>;
  onSelect?: (leadId: string) => void;
}

export function LeadCard({ lead, onConvert, onSelect }: LeadCardProps) {
  const [isConverting, setIsConverting] = useState(false);

  async function handleConvert() {
    if (!onConvert) return;
    setIsConverting(true);
    try {
      await onConvert(lead.id);
    } catch (err) {
      console.error("Erro ao converter lead:", err);
      alert("Não foi possível converter este lead.");
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <article
      role="group"
      aria-labelledby={`lead-title-${lead.id}`}
      className="bg-white rounded-md shadow p-4 hover:shadow-lg transition cursor-pointer"
      onClick={() => onSelect?.(lead.id)}
    >
      <h3
        id={`lead-title-${lead.id}`}
        className="text-base font-semibold mb-1 text-primary"
      >
        {lead.nome}
      </h3>
      <p className="text-sm text-muted-foreground mb-2">
        {lead.telefone}
      </p>
      {lead.email && (
        <p className="text-sm text-muted-foreground mb-2">
          {lead.email}
        </p>
      )}
      <div className="flex justify-end space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleConvert();
          }}
          disabled={isConverting}
          aria-label="Converter este lead em cliente"
        >
          {isConverting ? "Convertendo…" : "Meu Lead"}
        </Button>
      </div>
    </article>
  );
}

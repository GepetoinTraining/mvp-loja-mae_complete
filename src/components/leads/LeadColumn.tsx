"use client";

import { LeadCard } from "./LeadCard";
import type { LeadDTO, LeadStatus } from "@/lib/types"; // seu tipo leve, só com id, nome, telefone, status, etc.

interface LeadColumnProps {
  title: string;
  status?: LeadStatus;
  leads: LeadDTO[];
  isOnline: boolean;
  onConvert: (leadId: string) => Promise<void>;
  onSelect:  (leadId: string) => void;
}

export function LeadColumn({
  title,
  leads,
  onSelect,
  onConvert,
}: LeadColumnProps) {
  return (
    <section
    aria-labelledby={`status-${title}`}
    role="region"
    className="min-w-[260px] bg-muted p-2 rounded-md shadow-md"
  >
    <h2
      id={`status-${title}`}
      className="text-sm font-bold mb-2 uppercase text-muted-foreground"
    >
      {title}
    </h2>

    {leads.length === 0 ? (
      <p className="text-xs text-center text-muted-foreground">
        Nenhum lead
      </p>
    ) : (
      <div role="list" className="space-y-2">
        {leads.map((lead) => (
          <div role="listitem" key={lead.id}>
            <LeadCard
              lead={lead}
              onSelect={onSelect}
              onConvert={onConvert}
            />
          </div>
        ))}
      </div>
    )}
  </section>
);
}
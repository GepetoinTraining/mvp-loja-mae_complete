"use client";

import dayjs from 'dayjs';

// src/components/shared/DayAgenda.tsx


import { useState, useEffect } from "react";
import type { Visita } from "@/lib/types"; // defina Visita em types.ts

export function DayAgenda({
  date = new Date()
}: {
  /** Data para filtrar; padrão = hoje */
  date?: Date;
}) {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const isoDate = dayjs(date).format("YYYY-MM-DD"); // Replaced date-fns with dayjs

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/visitas?date=${isoDate}`);
        if (!res.ok) throw new Error("Falha ao carregar agenda do dia");
        const data: Visita[] = await res.json();
        setVisitas(data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [isoDate]);

  if (visitas.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma visita hoje.</p>;
  }

  return (
    <ul className="space-y-2">
      {visitas.map((v) => (
        <li
          key={v.id}
          className="p-2 bg-white rounded shadow cursor-pointer hover:bg-gray-50"
        >
          <div className="text-sm font-medium">
            {dayjs(v.dataHora).format("HH:mm")} {/* Replaced date-fns with dayjs */}
          </div>
          <div className="text-sm">{v.cliente.nome}</div>
        </li>
      ))}
    </ul>
  );
}


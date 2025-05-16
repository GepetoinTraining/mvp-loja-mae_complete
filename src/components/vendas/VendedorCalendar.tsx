"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar"; // seu componente de calendário
import type { VisitaDTO } from "@/lib/types";           // tipo simplificado de Visita
import { useRouter } from "next/navigation";

export function VendedorCalendar() {
  const [visitas, setVisitas] = useState<VisitaDTO[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/visitas");
        if (!res.ok) throw new Error("Não foi possível carregar visitas");
        const data: VisitaDTO[] = await res.json();
        setVisitas(data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  // Exemplo: quando clica num dia, vai para a lista de visitas desse dia
  function handleDateClick(date: Date) {
    const iso = date.toISOString();
    router.push(`/vendas?date=${encodeURIComponent(iso)}`);
  }

  return (
    <Calendar
      events={visitas.map((v) => ({
        id: v.id,
        title: v.cliente.nome,    // supondo que Visita inclua cliente.nome
        date: new Date(v.dataHora),
      }))}
      onDateClick={handleDateClick}
    />
  );
}

// components/admin/CalendarioAdmin.tsx
"use client";

import { useEffect, useState } from "react";
import { Calendar, dayjsLocalizer, Event } from "react-big-calendar";
import dayjs from "dayjs";
import "dayjs/locale/pt-br"; // Import pt-BR locale for dayjs
import weekday from "dayjs/plugin/weekday"; // For getDay and startOfWeek equivalent
import localeData from "dayjs/plugin/localeData"; // For localizer
import customParseFormat from "dayjs/plugin/customParseFormat"; // If needed for parsing

import "react-big-calendar/lib/css/react-big-calendar.css";

// Extend dayjs with plugins
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);
dayjs.locale("pt-br"); // Set pt-BR as the default locale for dayjs

const localizer = dayjsLocalizer(dayjs);

const VISITA_COLORS: Record<string, string> = {
  medicao: "#2563eb", // azul
  instalacao: "#16a34a", // verde
  manutencao: "#d97706", // laranja
};

export function CalendarioAdmin() {
  const [eventos, setEventos] = useState<Event[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/visitas")
      .then((r) => {
        if (!r.ok) throw new Error("Resposta inválida");
        return r.json();
      })
      .then((data: Array<{ title: string; start: string; end: string; allDay: boolean }>) => {
        // converte strings em Date()
        const parsed = data.map((e) => ({
          ...e,
          start: dayjs(e.start).toDate(), // Use dayjs to parse and convert to Date
          end: dayjs(e.end).toDate(),     // Use dayjs to parse and convert to Date
        }));
        setEventos(parsed);
      })
      .catch(() => setError("Não foi possível carregar visitas"));
  }, []);

  if (error) {
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Calendário Administrativo</h2>
      <Calendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        eventPropGetter={(event) => {
          // pega o tipo com fallback para string vazia
          const tipoRaw = (event as any).resource?.tipoVisita;
          const tipo = typeof tipoRaw === "string" ? tipoRaw.toLowerCase() : "";
          // mapa de cores
          const color = VISITA_COLORS[tipo] ?? "#2563eb";
          return {
            style: {
              backgroundColor: color,
              borderColor: color,
            },
          };
        }}
        messages={{
          today: "Hoje",
          previous: "Anterior",
          next: "Próximo",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
          showMore: (total) => `+ Ver mais (${total})`,
        }}
      />
    </div>
  );
}


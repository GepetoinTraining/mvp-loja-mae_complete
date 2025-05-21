"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import dayjs from "dayjs";
import "@/styles/fullcalendar.css";



const VISITA_COLORS: Record<string, string> = {
  medicao: "#2563eb",     // azul
  instalacao: "#16a34a",  // verde
  manutencao: "#d97706",  // laranja
};

export function CalendarioAdmin() {
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/visitas")
      .then((r) => {
        if (!r.ok) throw new Error("Resposta inválida");
        return r.json();
      })
      .then((data) => {
        const parsed = data.map((e: any) => ({
          title: e.title,
          start: dayjs(e.start).toISOString(),
          end: dayjs(e.end).toISOString(),
          allDay: e.allDay,
          extendedProps: {
            tipoVisita: e.tipoVisita || "",
          },
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
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          start: "prev,next today",
          center: "title",
          end: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height={600}
        locale={ptBrLocale}
        events={eventos}
        eventContent={(arg) => {
          const tipo = arg.event.extendedProps.tipoVisita?.toLowerCase?.() || "";
          const color = VISITA_COLORS[tipo] ?? "#2563eb";
          return (
            <div style={{ backgroundColor: color, padding: "2px 4px", borderRadius: 4 }}>
              {arg.event.title}
            </div>
          );
        }}
      />
    </div>
  );
}

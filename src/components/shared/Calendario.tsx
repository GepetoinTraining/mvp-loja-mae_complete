"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br.js";
import "@fullcalendar/daygrid/index.css";
import "@fullcalendar/timegrid/index.css";

export interface Evento {
  id: string;
  title: string;
  start: Date;
  end: Date;
  vendedorId?: string;
  allDay?: boolean;
}

interface Props {
  eventos: Evento[];
  height?: number;
}

export function Calendario({ eventos, height = 600 }: Props) {
  const [mappedEventos, setMappedEventos] = useState([]);

  useEffect(() => {
    const parsed = eventos.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      allDay: e.allDay ?? false,
    }));
    setMappedEventos(parsed);
  }, [eventos]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          start: "prev,next today",
          center: "title",
          end: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height={height}
        locale={ptBrLocale}
        events={mappedEventos}
        eventDisplay="block"
        eventColor="#2563eb"
        dayMaxEventRows={true}
        views={{
          dayGridMonth: { dayMaxEventRows: 3 },
        }}
      />
    </div>
  );
}

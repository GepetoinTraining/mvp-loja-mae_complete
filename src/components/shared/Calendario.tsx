"use client";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { ptBR } from "date-fns/locale";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "pt-BR": ptBR };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

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
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <Calendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        style={{ height }}
        views={["month", "week", "day"]}
        messages={{
          today: "Hoje",
          previous: "Anterior",
          next: "Próximo",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          showMore: (total) => `+${total} mais`,
        }}
      />
    </div>
  );
}

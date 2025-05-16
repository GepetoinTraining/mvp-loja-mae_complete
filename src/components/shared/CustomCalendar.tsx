import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { Select } from "@/components/ui/select";
import { SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { addYears, format } from "date-fns";
import { useState } from "react";

export function CustomCalendar({
  selected,
  onSelect,
}: {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
}) {
  const currentDate = selected || new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const months = Array.from({ length: 12 }, (_, i) =>
    format(new Date(2020, i, 1), "MMMM", { locale: ptBR })
  );
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleMonthYearChange = (newMonth: number, newYear: number) => {
    const newDate = new Date(newYear, newMonth, 1);
    onSelect(newDate); // apenas altera a visualização
    setMonth(newMonth);
    setYear(newYear);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          value={month.toString()}
          onValueChange={(val) => handleMonthYearChange(Number(val), year)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {months.map((mes, index) => (
              <SelectItem key={index} value={index.toString()}>
                {mes}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={year.toString()}
          onValueChange={(val) => handleMonthYearChange(month, Number(val))}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((ano) => (
              <SelectItem key={ano} value={ano.toString()}>
                {ano}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={new Date(year, month)}
        locale={ptBR}
      />
    </div>
  );
}

import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";

interface DaySelectorProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

export function DaySelector({ selectedDay, onSelectDay }: DaySelectorProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  
  const days = [
    { id: "segunda", name: "Segunda-feira" },
    { id: "terca", name: "Terça-feira" },
    { id: "quarta", name: "Quarta-feira" },
    { id: "quinta", name: "Quinta-feira" },
    { id: "sexta", name: "Sexta-feira" },
    { id: "sabado", name: "Sábado" },
    { id: "domingo", name: "Domingo" },
  ];
  
  const handleDayChange = (day: string) => {
    onSelectDay(day);
  };
  
  return (
    <div className="mb-6" id="day-selector">
      {isMobile ? (
        <div>
          <label htmlFor="day-select" className="sr-only">
            Selecionar dia
          </label>
          <select
            id="day-select"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            value={selectedDay}
            onChange={(e) => handleDayChange(e.target.value)}
          >
            {days.map((day) => (
              <option key={day.id} value={day.id}>
                {day.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="hidden sm:block">
          <nav className="flex space-x-4 border-b border-gray-200" aria-label="Tabs">
            {days.map((day) => (
              <button
                key={day.id}
                className={`px-3 py-2 text-sm font-medium ${
                  selectedDay === day.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300"
                }`}
                onClick={() => handleDayChange(day.id)}
                data-day={day.id}
                aria-current={selectedDay === day.id ? "page" : undefined}
              >
                {day.name}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

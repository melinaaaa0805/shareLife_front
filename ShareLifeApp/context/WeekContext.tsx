import React, { createContext, useContext, useState } from 'react';

// ─── ISO week helper ──────────────────────────────────────────────────────────

function getISOWeekAndYear(date: Date): { week: number; year: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return { week, year: d.getFullYear() };
}

// ─── Context type ─────────────────────────────────────────────────────────────

type WeekContextType = {
  week: number;
  year: number;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
  goToToday: () => void;
  isCurrentWeek: boolean;
};

const WeekContext = createContext<WeekContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const WeekProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const today = new Date();
  const { week: todayWeek, year: todayYear } = getISOWeekAndYear(today);

  const [week, setWeek] = useState(todayWeek);
  const [year, setYear] = useState(todayYear);

  const goToPrevWeek = () => {
    if (week === 1) {
      setWeek(52);
      setYear((y) => y - 1);
    } else {
      setWeek((w) => w - 1);
    }
  };

  const goToNextWeek = () => {
    if (week === 52) {
      setWeek(1);
      setYear((y) => y + 1);
    } else {
      setWeek((w) => w + 1);
    }
  };

  const goToToday = () => {
    setWeek(todayWeek);
    setYear(todayYear);
  };

  const isCurrentWeek = week === todayWeek && year === todayYear;

  return (
    <WeekContext.Provider
      value={{ week, year, goToPrevWeek, goToNextWeek, goToToday, isCurrentWeek }}
    >
      {children}
    </WeekContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useWeek = () => {
  const ctx = useContext(WeekContext);
  if (!ctx) throw new Error('useWeek must be used inside WeekProvider');
  return ctx;
};

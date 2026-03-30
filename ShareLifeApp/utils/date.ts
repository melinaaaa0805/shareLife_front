export const DAYS_FR_FULL = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export const DAYS_FR_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export const MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

/** Parse un YYYY-MM-DD en Date locale (évite le décalage UTC de new Date("YYYY-MM-DD")) */
export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Sérialise une Date en YYYY-MM-DD local */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Retourne le numéro de semaine ISO et l'année */
export function getISOWeek(d: Date): { week: number; year: number } {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week =
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 +
        ((week1.getDay() + 6) % 7)) /
        7,
    ) + 1;
  return { week, year: date.getFullYear() };
}

/** Retourne le nom du jour et la date formatée en français à partir d'un YYYY-MM-DD */
export function formatDayHeader(dateStr: string): {
  dayName: string;
  dateLabel: string;
} {
  const d = parseDateStr(dateStr);
  const dayName = DAYS_FR_FULL[(d.getDay() + 6) % 7];
  const day = d.getDate();
  const month = MONTHS_FR[d.getMonth()];
  const year = d.getFullYear();
  return { dayName, dateLabel: `${day} ${month} ${year}` };
}

/** Retourne les 7 dates (lundi→dimanche) d'une semaine ISO donnée */
export function getWeekDates(week: number, year: number): Date[] {
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const monday = new Date(startOfWeek1);
  monday.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Retourne true si dateStr correspond à aujourd'hui */
export function isToday(dateStr: string): boolean {
  const t = new Date();
  return toLocalDateStr(t) === dateStr;
}

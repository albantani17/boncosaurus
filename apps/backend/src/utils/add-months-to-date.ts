const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

const daysInMonth = (year: number, monthIndex: number) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

/** Adds months to a `YYYY-MM-DD` date, clamping the day to the target month (Jan 31 + 1 → Feb 28). */
export function addMonthsToDate(date: string, months: number): string {
  const match = CALENDAR_DATE.exec(date);
  if (!match) throw new RangeError(`Invalid calendar date: ${date}`);
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const monthIndex = month - 1 + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(targetDay)}`;
}

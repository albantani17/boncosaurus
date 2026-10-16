const pad = (value: number) => String(value).padStart(2, '0');

/** The `YYYY-MM-DD` of an instant in the process time zone (`TZ`). */
export const toCalendarDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

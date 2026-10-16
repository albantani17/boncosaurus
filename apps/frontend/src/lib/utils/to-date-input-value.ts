const pad = (value: number) => String(value).padStart(2, '0');

/** `YYYY-MM-DD` of a date in the local time zone, for `<input type="date">`. */
export const toDateInputValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

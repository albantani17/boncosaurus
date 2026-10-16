const MS_PER_DAY = 86_400_000;

const toUtcDay = (date: string) => Date.parse(`${date}T00:00:00Z`);

/** Whole days from one `YYYY-MM-DD` to another; negative when `to` comes first. */
export const daysBetweenDates = (from: string, to: string): number => Math.round((toUtcDay(to) - toUtcDay(from)) / MS_PER_DAY);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const daysBetween = (earlier: Date, later: Date) =>
	Math.round((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / MS_PER_DAY);

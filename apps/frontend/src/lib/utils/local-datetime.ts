const MS_PER_MINUTE = 60_000;
const DATETIME_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

// `offsetMinutes` follows Date#getTimezoneOffset: UTC minus local time (WIB is -420).
export function parseLocalDatetime(value: string, offsetMinutes: number): Date | null {
	const match = DATETIME_INPUT.exec(value);
	if (!match) return null;
	const [, year, month, day, hour, minute] = match.map(Number);
	const utc = Date.UTC(year!, month! - 1, day!, hour!, minute!) + offsetMinutes * MS_PER_MINUTE;
	const date = new Date(utc);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function toDatetimeInputValue(date: Date, offsetMinutes: number): string {
	const local = new Date(date.getTime() - offsetMinutes * MS_PER_MINUTE);
	return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(
		local.getUTCHours()
	)}:${pad(local.getUTCMinutes())}`;
}

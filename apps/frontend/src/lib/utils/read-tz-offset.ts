import { readFormText } from './read-form-text';

/** The browser's `tzOffset` field (Date#getTimezoneOffset), or the fallback when it is missing. */
export function readTzOffset(data: FormData, fallbackOffsetMinutes: number): number {
	const raw = readFormText(data, 'tzOffset');
	const offset = Number(raw);
	return raw !== '' && Number.isFinite(offset) ? offset : fallbackOffsetMinutes;
}

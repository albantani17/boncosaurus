const MONTH_NAMES = [
  ['jan', 'januari', 'january'],
  ['feb', 'februari', 'february', 'peb'],
  ['mar', 'maret', 'march'],
  ['apr', 'april'],
  ['mei', 'may'],
  ['jun', 'juni', 'june'],
  ['jul', 'juli', 'july'],
  ['agu', 'agustus', 'aug', 'august', 'ags'],
  ['sep', 'september', 'sept'],
  ['okt', 'oktober', 'oct', 'october'],
  ['nov', 'november', 'nop'],
  ['des', 'desember', 'dec', 'december']
];

const DEFAULT_HOUR = 12;
const TOKEN_PATTERN = /yyyy|yy|MMMM|MMM|MM|M|dd|d|HH|H|mm|ss/g;
const TOKEN_REGEX: Record<string, string> = {
  yyyy: '(\\d{4})',
  yy: '(\\d{2})',
  MMMM: '([A-Za-z]+)',
  MMM: '([A-Za-z]+)',
  MM: '(\\d{1,2})',
  M: '(\\d{1,2})',
  dd: '(\\d{1,2})',
  d: '(\\d{1,2})',
  HH: '(\\d{1,2})',
  H: '(\\d{1,2})',
  mm: '(\\d{2})',
  ss: '(\\d{2})'
};

type DateParts = { year?: number; month?: number; day?: number; hour?: number; minute?: number };

export function parseDateWithFormat(
  text: string,
  format: string,
  utcOffsetMinutes: number
): Date | null {
  const tokens = format.match(TOKEN_PATTERN) ?? [];
  const source = format
    .split(TOKEN_PATTERN)
    .map(escapeRegex)
    .reduce((pattern, literal, index) => pattern + literal + (TOKEN_REGEX[tokens[index]] ?? ''), '');
  const match = new RegExp(`^${source}$`).exec(text.trim());
  if (!match) return null;

  const parts: DateParts = {};
  for (const [index, token] of tokens.entries()) {
    if (!assignPart(parts, token, match[index + 1])) return null;
  }
  return buildDate(parts, utcOffsetMinutes);
}

function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assignPart(parts: DateParts, token: string, value: string): boolean {
  if (token.startsWith('y')) {
    const year = Number(value);
    parts.year = token === 'yy' ? 2000 + year : year;
  } else if (token === 'MMM' || token === 'MMMM') {
    const month = MONTH_NAMES.findIndex((names) => names.includes(value.toLowerCase()));
    if (month < 0) return false;
    parts.month = month + 1;
  } else if (token.startsWith('M')) parts.month = Number(value);
  else if (token.startsWith('d')) parts.day = Number(value);
  else if (token.startsWith('H')) parts.hour = Number(value);
  else if (token === 'mm') parts.minute = Number(value);
  return true;
}

function buildDate({ year, month, day, hour = DEFAULT_HOUR, minute = 0 }: DateParts, utcOffsetMinutes: number): Date | null {
  if (year === undefined || month === undefined || day === undefined) return null;
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const isRealDate = utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
  if (!isRealDate || hour > 23 || minute > 59) return null;
  return new Date(utc.getTime() - utcOffsetMinutes * 60_000);
}

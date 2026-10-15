export type DecimalSeparator = ',' | '.';

export function parseAmount(raw: string, decimalSeparator: DecimalSeparator): number | null {
  const text = raw.trim();
  const thousandSeparator = decimalSeparator === ',' ? '.' : ',';
  const isNegative = text.startsWith('-') || text.endsWith('-') || /^\(.*\)$/.test(text);

  const digits = text
    .replaceAll(thousandSeparator, '')
    .replace(decimalSeparator, '.')
    .replace(/[^0-9.]/g, '');
  if (!/\d/.test(digits)) return null;

  const magnitude = Math.round(Number(digits));
  if (!Number.isFinite(magnitude)) return null;
  return isNegative ? -magnitude : magnitude;
}

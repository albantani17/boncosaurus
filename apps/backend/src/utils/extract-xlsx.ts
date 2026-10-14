import { readSheet } from 'read-excel-file/universal';
import { BadRequestError } from '../errors/app-error';
import type { ExtractedContent } from '../types/import.types';

export async function extractXlsx(bytes: Uint8Array): Promise<ExtractedContent> {
  const rows = await readSheetRows(bytes);
  if (rows.length === 0) {
    throw new BadRequestError('IMPORT_UNREADABLE', 'The spreadsheet has no rows');
  }
  return { kind: 'table', rows };
}

async function readSheetRows(bytes: Uint8Array): Promise<string[][]> {
  try {
    const sheet = await readSheet(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    return sheet.map((row) => row.map(formatCell)).filter((row) => row.some((cell) => cell !== ''));
  } catch {
    throw new BadRequestError('IMPORT_UNREADABLE', 'The file is not a readable .xlsx spreadsheet');
  }
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

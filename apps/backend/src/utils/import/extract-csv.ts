import Papa from 'papaparse';
import { BadRequestError } from '../../errors/app-error';
import type { ExtractedContent } from '../../types/import.types';

export async function extractCsv(bytes: Uint8Array): Promise<ExtractedContent> {
  const text = new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');
  const { data } = Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' });
  if (data.length === 0) {
    throw new BadRequestError('IMPORT_UNREADABLE', 'The file has no rows');
  }
  return { kind: 'table', rows: data };
}

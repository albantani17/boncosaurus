import { BadRequestError } from '../../errors/app-error';
import type { ExtractedContent } from '../../types/import.types';

export function extractText(bytes: Uint8Array): ExtractedContent {
  const text = new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');
  if (text.trim() === '') {
    throw new BadRequestError('IMPORT_UNREADABLE', 'The file is empty');
  }
  return { kind: 'text', text: prettyPrintJson(text) };
}

function prettyPrintJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

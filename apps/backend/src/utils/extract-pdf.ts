import { extractText, getDocumentProxy } from 'unpdf';
import { BadRequestError } from '../errors/app-error';
import type { ExtractedContent } from '../types/import.types';

export async function extractPdf(bytes: Uint8Array): Promise<ExtractedContent> {
  const text = await readPdfText(bytes);
  if (text.trim() === '') {
    throw new BadRequestError('IMPORT_NO_TEXT', 'The PDF has no readable text (scanned PDFs are not supported)');
  }
  return { kind: 'text', text };
}

async function readPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const document = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(document, { mergePages: true });
    return text;
  } catch {
    throw new BadRequestError('IMPORT_UNREADABLE', 'The file is not a readable PDF');
  }
}

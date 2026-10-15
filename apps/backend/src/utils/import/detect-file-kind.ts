export type FileKind = 'csv' | 'xlsx' | 'pdf' | 'text';

const KIND_BY_EXTENSION: Record<string, FileKind> = {
  csv: 'csv',
  tsv: 'csv',
  xlsx: 'xlsx',
  pdf: 'pdf',
  json: 'text',
  txt: 'text'
};

export function detectFileKind(fileName: string): FileKind | null {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0) return null;
  return KIND_BY_EXTENSION[fileName.slice(dotIndex + 1).toLowerCase()] ?? null;
}

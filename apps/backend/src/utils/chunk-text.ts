export function chunkText(text: string, maxChars: number): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const line of text.split('\n').filter((candidate) => candidate.trim() !== '')) {
    for (const piece of splitLongLine(line, maxChars)) {
      const joined = current ? `${current}\n${piece}` : piece;
      if (joined.length <= maxChars) {
        current = joined;
        continue;
      }
      chunks.push(current);
      current = piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function splitLongLine(line: string, maxChars: number): string[] {
  const pieces: string[] = [];
  for (let start = 0; start < line.length; start += maxChars) {
    pieces.push(line.slice(start, start + maxChars));
  }
  return pieces;
}

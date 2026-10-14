export type ChatSpan = { text: string; bold: boolean };
export type ChatBlock =
	| { type: 'paragraph'; spans: ChatSpan[] }
	| { type: 'list'; ordered: boolean; items: ChatSpan[][] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

// Splits on **bold** markers; an unmatched marker stays as plain text.
export function parseChatSpans(text: string): ChatSpan[] {
	const pieces = text.split('**');
	if (pieces.length % 2 === 0) return [{ text: text.replace(/^#+\s*/, ''), bold: false }];
	return pieces
		.map((piece, index) => ({ text: index === 0 ? piece.replace(/^#+\s*/, '') : piece, bold: index % 2 === 1 }))
		.filter((span) => span.text.length > 0);
}

// A small, HTML-free subset of Markdown that models commonly produce: paragraphs, lists and bold text.
export function parseChatMarkdown(text: string): ChatBlock[] {
	const blocks: ChatBlock[] = [];
	let paragraph: string[] = [];

	const flushParagraph = () => {
		if (paragraph.length > 0) blocks.push({ type: 'paragraph', spans: parseChatSpans(paragraph.join('\n')) });
		paragraph = [];
	};

	for (const line of text.split('\n')) {
		const bullet = BULLET.exec(line);
		const numbered = bullet ? null : NUMBERED.exec(line);
		const item = bullet?.[1] ?? numbered?.[1];

		if (item !== undefined) {
			flushParagraph();
			const ordered = numbered !== null;
			const last = blocks.at(-1);
			if (last?.type === 'list' && last.ordered === ordered) last.items.push(parseChatSpans(item));
			else blocks.push({ type: 'list', ordered, items: [parseChatSpans(item)] });
		} else if (line.trim() === '') {
			flushParagraph();
		} else {
			paragraph.push(line);
		}
	}
	flushParagraph();
	return blocks;
}

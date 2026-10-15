import { describe, expect, test } from 'bun:test';
import { parseChatMarkdown, parseChatSpans } from './parse-chat-markdown';

describe('parseChatSpans', () => {
	test('marks bold text', () => {
		expect(parseChatSpans('Total **Rp25.000** bulan ini')).toEqual([
			{ text: 'Total ', bold: false },
			{ text: 'Rp25.000', bold: true },
			{ text: ' bulan ini', bold: false }
		]);
	});

	test('keeps an unmatched marker as plain text', () => {
		expect(parseChatSpans('a ** b')).toEqual([{ text: 'a ** b', bold: false }]);
	});

	test('drops heading markers', () => {
		expect(parseChatSpans('## Ringkasan')).toEqual([{ text: 'Ringkasan', bold: false }]);
	});
});

describe('parseChatMarkdown', () => {
	test('splits paragraphs on blank lines and keeps line breaks inside them', () => {
		expect(parseChatMarkdown('Halo\nDino\n\nSiap')).toEqual([
			{ type: 'paragraph', spans: [{ text: 'Halo\nDino', bold: false }] },
			{ type: 'paragraph', spans: [{ text: 'Siap', bold: false }] }
		]);
	});

	test('groups bullet and numbered lists', () => {
		expect(parseChatMarkdown('Rincian:\n- Makan\n* Kopi\n1. Satu\n2) Dua')).toEqual([
			{ type: 'paragraph', spans: [{ text: 'Rincian:', bold: false }] },
			{
				type: 'list',
				ordered: false,
				items: [[{ text: 'Makan', bold: false }], [{ text: 'Kopi', bold: false }]]
			},
			{
				type: 'list',
				ordered: true,
				items: [[{ text: 'Satu', bold: false }], [{ text: 'Dua', bold: false }]]
			}
		]);
	});

	test('treats html as plain text', () => {
		expect(parseChatMarkdown('<img src=x onerror=alert(1)>')).toEqual([
			{ type: 'paragraph', spans: [{ text: '<img src=x onerror=alert(1)>', bold: false }] }
		]);
	});
});

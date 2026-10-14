import { describe, expect, test } from 'bun:test';
import { getToolPartName } from './get-tool-part-name';

describe('getToolPartName', () => {
	test('returns the tool name of a tool part', () => {
		expect(getToolPartName({ type: 'tool-getSummary' })).toBe('getSummary');
	});

	test('returns null for other parts', () => {
		expect(getToolPartName({ type: 'text' })).toBeNull();
		expect(getToolPartName({ type: 'step-start' })).toBeNull();
	});
});

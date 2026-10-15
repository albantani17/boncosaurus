const TOOL_PREFIX = 'tool-';

export const getToolPartName = (part: { type: string }): string | null =>
	part.type.startsWith(TOOL_PREFIX) ? part.type.slice(TOOL_PREFIX.length) : null;

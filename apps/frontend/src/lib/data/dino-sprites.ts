import type { MascotState } from '../types/api.types';

export const DINO_GRID = { width: 16, height: 14 } as const;

export const DINO_PALETTE: Record<string, string> = {
	g: '#7dd3a7',
	d: '#24483c',
	e: '#081b1c',
	b: '#e9ebdd',
	a: '#f2b36d',
	c: '#f47777'
};

const idle = [
	'................',
	'..........ggggg.',
	'.........gggggg.',
	'..........gegggg',
	'..........gggggg',
	'..........ggg...',
	'........gggggg..',
	'..g....ggggggg..',
	'.ggg.gggggggg...',
	'ggggggggggggg...',
	'.ggggbbbbbggg...',
	'..gggbbbbbgg....',
	'....gg..gg......',
	'....dd..dd......'
];

const happy = [
	'.a..........a...',
	'...a......ggggg.',
	'.........gggggg.',
	'..........gegggg',
	'..........ggcggg',
	'..........ggg...',
	'........gggggg..',
	'..g....ggggggg..',
	'.ggg.gggggggg...',
	'ggggggggggggg...',
	'.ggggbbbbbggg...',
	'..gggbbbbbgg....',
	'....gg..gg......',
	'....dd..dd......'
];

const warning = [
	'.aaaa...........',
	'.aeea.....ggggg.',
	'.aeea....gggggg.',
	'.aaaa.....gegggg',
	'.aeea.....gggggg',
	'.aaaa.....ggg...',
	'........gggggg..',
	'..g....ggggggg..',
	'.ggg.gggggggg...',
	'ggggggggggggg...',
	'.ggggbbbbbggg...',
	'..gggbbbbbgg....',
	'....gg..gg......',
	'....dd..dd......'
];

export const DINO_SPRITES: Record<MascotState, string[]> = { idle, happy, warning };

export const DINO_DESCRIPTIONS: Record<MascotState, string> = {
	idle: 'Dino hijau kecil berdiri tenang',
	happy: 'Dino hijau kecil tampak senang',
	warning: 'Dino hijau kecil membawa papan peringatan'
};

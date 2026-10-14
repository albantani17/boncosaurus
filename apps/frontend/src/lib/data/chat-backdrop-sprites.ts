import { DINO_PALETTE } from './dino-sprites';

export const BACKDROP_PALETTE: Record<string, string> = DINO_PALETTE;

export const BACKDROP_SPRITES = {
	footprint: ['g..g..g', '.g.g.g.', '..ggg..', '.ggggg.', '.ggggg.', '..ggg..'],
	fern: [
		'....g....',
		'...ggg...',
		'.g..g..g.',
		'..g.g.g..',
		'...ggg...',
		'g...g...g',
		'.g..g..g.',
		'..g.g.g..',
		'...ggg...',
		'....g....',
		'....d....'
	],
	egg: ['..bb..', '.bbbb.', '.bgbb.', 'bbbbgb', 'bbbbbb', 'bgbbbb', '.bbbb.', '..bb..'],
	bone: ['bb......bb', '.bbbbbbbb.', '.bbbbbbbb.', 'bb......bb'],
	star: ['..a..', '..a..', 'aaaaa', '..a..', '..a..'],
	sparkle: ['.b.', 'bbb', '.b.'],
	cloud: ['...bbbb.....', '..bbbbbbbb..', '.bbbbbbbbbb.', 'bbbbbbbbbbbb'],
	meteor: ['........aa', '......aaa.', '....aaa...', '..cca.....', '.ccc......', '.cc.......'],
	volcano: [
		'.....c..c.....',
		'......cc......',
		'.....dccd.....',
		'....dddddd....',
		'...dddddddd...',
		'..dddddddddd..',
		'.dddddddddddd.',
		'dddddddddddddd'
	]
} satisfies Record<string, string[]>;

export type BackdropSpriteName = keyof typeof BACKDROP_SPRITES;

export type BackdropPlacement = {
	sprite: BackdropSpriteName;
	position: string;
	width: string;
	opacity: number;
	rotate?: number;
	desktopOnly?: boolean;
	twinkle?: boolean;
};

// Positions are percentages of the chat area so the scene scales with any screen size.
export const BACKDROP_PLACEMENTS: BackdropPlacement[] = [
	{ sprite: 'cloud', position: 'top:6%;left:8%', width: '3.5rem', opacity: 0.13 },
	{ sprite: 'cloud', position: 'top:14%;right:12%', width: '2.5rem', opacity: 0.1, desktopOnly: true },
	{ sprite: 'star', position: 'top:9%;left:42%', width: '0.9rem', opacity: 0.35, twinkle: true },
	{ sprite: 'sparkle', position: 'top:22%;left:20%', width: '0.6rem', opacity: 0.32, twinkle: true },
	{ sprite: 'sparkle', position: 'top:5%;right:30%', width: '0.6rem', opacity: 0.29, twinkle: true },
	{ sprite: 'star', position: 'top:30%;right:6%', width: '0.8rem', opacity: 0.32, twinkle: true, desktopOnly: true },
	{ sprite: 'meteor', position: 'top:18%;right:22%', width: '2.5rem', opacity: 0.19, desktopOnly: true },
	{ sprite: 'fern', position: 'top:48%;left:3%', width: '2rem', opacity: 0.13 },
	{ sprite: 'fern', position: 'top:62%;right:4%', width: '2.4rem', opacity: 0.11, desktopOnly: true },
	{ sprite: 'egg', position: 'top:40%;right:9%', width: '1.4rem', opacity: 0.16 },
	{ sprite: 'bone', position: 'top:72%;left:12%', width: '2.2rem', opacity: 0.11, rotate: -18, desktopOnly: true },
	{ sprite: 'volcano', position: 'top:34%;left:10%', width: '3rem', opacity: 0.1, desktopOnly: true },
	{ sprite: 'footprint', position: 'top:58%;left:22%', width: '1rem', opacity: 0.13, rotate: 20, desktopOnly: true },
	{ sprite: 'footprint', position: 'top:63%;left:26%', width: '1rem', opacity: 0.11, rotate: 28, desktopOnly: true },
	{ sprite: 'footprint', position: 'top:68%;left:31%', width: '1rem', opacity: 0.1, rotate: 35, desktopOnly: true },
	{ sprite: 'sparkle', position: 'top:52%;right:18%', width: '0.5rem', opacity: 0.29, twinkle: true }
];

import { createContext } from 'svelte';

const STORAGE_KEY = 'bs-chat-panel';

export type ChatPanel = {
	desktopOpen: boolean;
	mobileOpen: boolean;
	restore: () => void;
	toggleDesktop: () => void;
};

export const [getChatPanel, setChatPanel] = createContext<ChatPanel>();

// The desktop panel remembers its state per browser; the mobile drawer always starts closed.
export function createChatPanel(): ChatPanel {
	const panel = $state<ChatPanel>({
		desktopOpen: true,
		mobileOpen: false,
		restore() {
			try {
				panel.desktopOpen = localStorage.getItem(STORAGE_KEY) !== 'closed';
			} catch {
				// Storage can be blocked; keep the default.
			}
		},
		toggleDesktop() {
			panel.desktopOpen = !panel.desktopOpen;
			try {
				localStorage.setItem(STORAGE_KEY, panel.desktopOpen ? 'open' : 'closed');
			} catch {
				// Storage can be blocked; the toggle still works for this visit.
			}
		}
	});
	return panel;
}

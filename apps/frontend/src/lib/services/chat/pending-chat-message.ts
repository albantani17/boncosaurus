let pending: string | null = null;

// Holds the first message of a new conversation across the redirect to /asisten/[id], which sends it once.
export function setPendingChatMessage(text: string | null): void {
	pending = text;
}

export function takePendingChatMessage(): string | null {
	const text = pending;
	pending = null;
	return text;
}

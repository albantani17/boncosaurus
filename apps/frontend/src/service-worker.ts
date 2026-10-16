/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Only handles debt reminder pushes; there is no fetch handler, so nothing is cached offline.
const sw = self as unknown as ServiceWorkerGlobalScope;

type ReminderPayload = { title?: string; body?: string; url?: string };

const DEFAULT_URL = '/hutang';

sw.addEventListener('install', () => sw.skipWaiting());
sw.addEventListener('activate', (event) => event.waitUntil(sw.clients.claim()));

sw.addEventListener('push', (event) => {
	const payload = (event.data?.json() ?? {}) as ReminderPayload;
	event.waitUntil(
		sw.registration.showNotification(payload.title ?? 'Boncosaurus', {
			body: payload.body,
			tag: 'debt-reminder',
			data: { url: payload.url ?? DEFAULT_URL }
		})
	);
});

sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = new URL((event.notification.data as { url?: string } | null)?.url ?? DEFAULT_URL, sw.location.origin).href;
	event.waitUntil(
		sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
			const open = windows.find((client) => client.url.startsWith(sw.location.origin));
			return open ? open.navigate(url).then((client) => client?.focus()) : sw.clients.openWindow(url);
		})
	);
});

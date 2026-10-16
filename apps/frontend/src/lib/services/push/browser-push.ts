import { decodeBase64Url } from '../../utils/decode-base64-url';
import { callPushEndpoint, type PushCallResult } from './call-push-endpoint';

export type BrowserPushState = 'unsupported' | 'denied' | 'off' | 'on';

const ENDPOINT = '/profil/notifikasi';
const TEST_ENDPOINT = '/profil/notifikasi/tes';

const isSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const currentSubscription = async () => (await navigator.serviceWorker.ready).pushManager.getSubscription();

export async function readBrowserPushState(): Promise<BrowserPushState> {
	if (!isSupported()) return 'unsupported';
	if (Notification.permission === 'denied') return 'denied';
	return (await currentSubscription()) ? 'on' : 'off';
}

/** Asks for permission, subscribes this browser and registers it with the app. */
export async function enableBrowserPush(publicKey: string): Promise<PushCallResult> {
	if ((await Notification.requestPermission()) !== 'granted') {
		return { ok: false, message: 'Izin notifikasi ditolak. Aktifkan lewat pengaturan situs di browser.' };
	}
	const registration = await navigator.serviceWorker.ready;
	const subscription =
		(await registration.pushManager.getSubscription()) ??
		(await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeBase64Url(publicKey) }));
	return callPushEndpoint(ENDPOINT, 'POST', subscription.toJSON());
}

export async function disableBrowserPush(): Promise<PushCallResult> {
	const subscription = await currentSubscription();
	if (!subscription) return { ok: true };
	const result = await callPushEndpoint(ENDPOINT, 'DELETE', subscription.toJSON());
	await subscription.unsubscribe();
	return result;
}

export const sendTestPush = () => callPushEndpoint(TEST_ENDPOINT, 'POST');

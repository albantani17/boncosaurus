import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Tags from '@lucide/svelte/icons/tags';
import Wallet from '@lucide/svelte/icons/wallet';

export const ASSISTANT_HREF = '/asisten';

export const NAV_ITEMS = [
	{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ label: 'Transaksi', href: '/transaksi', icon: ArrowLeftRight },
	{ label: 'Akun', href: '/akun', icon: Wallet },
	{ label: 'Kategori', href: '/kategori', icon: Tags },
	{ label: 'Asisten', href: ASSISTANT_HREF, icon: Sparkles }
];

// The mobile bar keeps two items on each side of the add button; the assistant lives in the mobile header.
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.href !== ASSISTANT_HREF);

export const NEW_TRANSACTION_HREF = '/transaksi?baru=1';

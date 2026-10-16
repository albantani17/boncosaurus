import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
import HandCoins from '@lucide/svelte/icons/hand-coins';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Tags from '@lucide/svelte/icons/tags';
import Wallet from '@lucide/svelte/icons/wallet';

export const ASSISTANT_HREF = '/asisten';
export const DEBTS_HREF = '/hutang';

export const NAV_ITEMS = [
	{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ label: 'Asisten', href: ASSISTANT_HREF, icon: Sparkles },
	{ label: 'Transaksi', href: '/transaksi', icon: ArrowLeftRight },
	{ label: 'Hutang', href: DEBTS_HREF, icon: HandCoins },
	{ label: 'Akun', href: '/akun', icon: Wallet },
	{ label: 'Kategori', href: '/kategori', icon: Tags }
];

// The mobile bar keeps two items on each side of the add button; the assistant lives in the mobile
// header and debts are reached from the dashboard card.
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.href !== ASSISTANT_HREF && item.href !== DEBTS_HREF);

export const NEW_TRANSACTION_HREF = '/transaksi?baru=1';

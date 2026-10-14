import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import Tags from '@lucide/svelte/icons/tags';
import Wallet from '@lucide/svelte/icons/wallet';

export const NAV_ITEMS = [
	{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ label: 'Transaksi', href: '/transaksi', icon: ArrowLeftRight },
	{ label: 'Akun', href: '/akun', icon: Wallet },
	{ label: 'Kategori', href: '/kategori', icon: Tags }
];

export const NEW_TRANSACTION_HREF = '/transaksi?baru=1';

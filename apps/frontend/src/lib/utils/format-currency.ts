const IDR = 'IDR';

export function formatCurrency(amount: number, currency: string = IDR): string {
	const sign = amount < 0 ? '-' : '';
	const digits = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.abs(amount));
	const prefix = currency === IDR ? 'Rp' : `${currency} `;
	return `${sign}${prefix}${digits}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function formatTransactionDate(value: Date, now: Date): string {
	const dayDifference = Math.round(
		(startOfDay(now).getTime() - startOfDay(value).getTime()) / (24 * 60 * 60 * 1000)
	);
	if (dayDifference === 0) return 'Hari ini';
	if (dayDifference === 1) return 'Kemarin';
	return `${value.getDate()} ${MONTHS[value.getMonth()]}`;
}

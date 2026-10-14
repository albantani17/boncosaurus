type Options = { allowZero?: boolean; allowNegative?: boolean };

const CURRENCY_NOISE = /rp|\s|\./gi;
const WHOLE_NUMBER = /^-?\d+$/;

export function parseAmountInput(raw: string, { allowZero = false, allowNegative = false }: Options = {}) {
	const cleaned = raw.replace(CURRENCY_NOISE, '');
	if (!WHOLE_NUMBER.test(cleaned)) return null;

	const amount = Number(cleaned);
	if (!Number.isSafeInteger(amount)) return null;
	if (amount < 0 && !allowNegative) return null;
	if (amount === 0 && !allowZero) return null;
	return amount;
}

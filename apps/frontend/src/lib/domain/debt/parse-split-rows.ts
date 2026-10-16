import type { TransactionSplitBody } from '@boncosaurus/shared';
import type { FormResult } from '../../types/form.types';
import { parseAmountInput } from '../../utils/parse-amount-input';

const MAX_SPLITS = 20;

const readAll = (data: FormData, key: string) => data.getAll(key).map((value) => String(value).trim());

/** Reads the "others owe me part of this" rows of an expense; fully empty rows are ignored. */
export function parseSplitRows(data: FormData, expenseAmount: number): FormResult<TransactionSplitBody[]> {
	const names = readAll(data, 'splitName');
	const amounts = readAll(data, 'splitAmount');
	const splits: TransactionSplitBody[] = [];

	for (const [index, name] of names.entries()) {
		const rawAmount = amounts[index] ?? '';
		if (!name && !rawAmount) continue;
		const amount = parseAmountInput(rawAmount);
		if (!name) return { ok: false, message: 'Isi nama untuk setiap bagian orang lain.' };
		if (amount === null) return { ok: false, message: `Bagian ${name} harus angka bulat lebih dari 0.` };
		splits.push({ counterpartyName: name, amount });
	}

	if (splits.length > MAX_SPLITS) return { ok: false, message: `Maksimal ${MAX_SPLITS} orang per transaksi.` };
	const total = splits.reduce((sum, split) => sum + split.amount, 0);
	if (total > expenseAmount) return { ok: false, message: 'Bagian orang lain melebihi jumlah transaksinya.' };
	return { ok: true, value: splits };
}

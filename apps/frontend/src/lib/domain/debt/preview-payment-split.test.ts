import { describe, expect, test } from 'bun:test';
import { previewPaymentSplit } from './preview-payment-split';

describe('previewPaymentSplit', () => {
	test('keeps a partial payment on the principal', () => {
		expect(previewPaymentSplit(14_000, 18_500)).toEqual({ principalAmount: 14_000, extraAmount: 0 });
	});

	test('shows the part above the principal as extra', () => {
		expect(previewPaymentSplit(25_000, 22_000)).toEqual({ principalAmount: 22_000, extraAmount: 3_000 });
	});

	test('treats everything as extra once the principal is repaid', () => {
		expect(previewPaymentSplit(15_000, 0)).toEqual({ principalAmount: 0, extraAmount: 15_000 });
	});
});

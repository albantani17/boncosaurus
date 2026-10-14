const MESSAGES: Record<string, string> = {
	ACCOUNT_NAME_TAKEN: 'Nama akun sudah dipakai.',
	ACCOUNT_HAS_TRANSACTIONS: 'Akun ini sudah punya transaksi.',
	CATEGORY_NAME_TAKEN: 'Nama kategori sudah dipakai di tempat yang sama.',
	CATEGORY_IN_USE: 'Kategori ini masih punya subkategori atau transaksi. Arsipkan saja.',
	CATEGORY_TYPE_MISMATCH: 'Jenis kategori tidak cocok dengan jenis transaksi.',
	PARENT_NOT_ROOT: 'Subkategori hanya bisa dibuat di bawah kategori utama.',
	TO_AMOUNT_REQUIRED: 'Isi jumlah yang diterima karena mata uang kedua akun berbeda.',
	INVALID_TRANSFER_FIELDS: 'Data transfer tidak lengkap atau tidak valid.',
	ARCHIVED_REFERENCE: 'Akun atau kategori yang dipilih sudah diarsipkan.',
	NOT_FOUND: 'Data tidak ditemukan. Mungkin sudah dihapus.',
	EMAIL_TAKEN: 'Email ini sudah dipakai akun lain.',
	INVALID_CREDENTIALS: 'Kata sandi saat ini salah.',
	PASSWORD_REQUIRED: 'Masukkan kata sandi saat ini untuk mengganti email.',
	SAME_PASSWORD: 'Kata sandi baru harus berbeda dari yang lama.',
	VALIDATION_ERROR: 'Data yang dikirim tidak valid. Periksa lagi isian formulir.'
};

const FALLBACK_MESSAGE = 'Terjadi kesalahan. Coba lagi sebentar lagi.';

export type ErrorMessages = Record<string, string>;

export const describeApiError = (code: string | undefined, overrides: ErrorMessages = {}) =>
	(code ? (overrides[code] ?? MESSAGES[code]) : undefined) ?? FALLBACK_MESSAGE;

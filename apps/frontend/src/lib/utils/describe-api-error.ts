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
	AI_NOT_CONFIGURED: 'Fitur AI belum aktif. Isi AI_SECRET_KEY di server lalu mulai ulang backend.',
	AI_PROVIDER_MISSING: 'Tambahkan provider AI dulu di Pengaturan AI.',
	AI_PROVIDER_FAILED: 'Provider AI tidak merespons. Periksa API key, model, dan base URL.',
	AI_PROVIDER_NAME_TAKEN: 'Nama provider sudah dipakai.',
	BASE_URL_REQUIRED: 'Base URL wajib diisi untuk provider OpenAI-compatible.',
	INVALID_BASE_URL: 'Base URL harus berupa alamat http(s) yang valid.',
	FORBIDDEN_ROLE: 'Hanya pemilik atau admin workspace yang bisa mengubah pengaturan AI.',
	DRAFT_NOT_PENDING: 'Draf transaksi ini sudah diproses.',
	EMPTY_MESSAGE: 'Pesan tidak boleh kosong.',
	IMPORT_UNSUPPORTED_FILE: 'Format file tidak didukung. Pakai CSV, TSV, XLSX, PDF, JSON, atau TXT.',
	IMPORT_NO_TEXT: 'PDF ini tidak berisi teks (mungkin hasil scan). Pakai PDF yang teksnya bisa dipilih.',
	IMPORT_TOO_LARGE: 'File terlalu besar. Maksimal 5 MB.',
	IMPORT_TOO_MANY_ROWS: 'Terlalu banyak transaksi dalam satu file. Maksimal 2.000.',
	IMPORT_UNREADABLE: 'File tidak bisa dibaca. Pastikan isinya tidak rusak atau kosong.',
	IMPORT_EMPTY: 'Tidak ada transaksi yang ditemukan untuk diimpor.',
	IMPORT_INVALID_ROW: 'Ada transaksi yang tidak valid. Periksa pemetaan akun dan kategori lalu coba lagi.',
	AI_REQUEST_FAILED: 'AI gagal membaca file. Periksa provider di Pengaturan AI lalu coba lagi.',
	VALIDATION_ERROR: 'Data yang dikirim tidak valid. Periksa lagi isian formulir.'
};

const FALLBACK_MESSAGE = 'Terjadi kesalahan. Coba lagi sebentar lagi.';

export type ErrorMessages = Record<string, string>;

export const describeApiError = (code: string | undefined, overrides: ErrorMessages = {}) =>
	(code ? (overrides[code] ?? MESSAGES[code]) : undefined) ?? FALLBACK_MESSAGE;

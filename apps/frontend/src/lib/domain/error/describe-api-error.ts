import type { ApiErrorCode, ErrorCode } from '@boncosaurus/shared';

const SESSION_EXPIRED = 'Sesi berakhir. Silakan masuk lagi.';

const MESSAGES: Record<ErrorCode, string> = {
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
	VALIDATION_ERROR: 'Data yang dikirim tidak valid. Periksa lagi isian formulir.',
	INTERNAL_ERROR: 'Terjadi kesalahan di server. Coba lagi nanti.',
	UNAUTHENTICATED: SESSION_EXPIRED,
	INVALID_REFRESH_TOKEN: SESSION_EXPIRED,
	REFRESH_TOKEN_EXPIRED: SESSION_EXPIRED,
	REFRESH_TOKEN_REUSED: SESSION_EXPIRED,
	INVALID_WORKSPACE_ID: 'Workspace tidak valid.',
	NOT_A_MEMBER: 'Kamu bukan anggota workspace ini.',
	NO_WORKSPACE: 'Akun ini belum punya workspace.',
	INVALID_RANGE: 'Rentang tanggal tidak valid.',
	COUNTERPARTY_NAME_TAKEN: 'Nama orang atau penyedia ini sudah ada.',
	COUNTERPARTY_IN_USE: 'Orang atau penyedia ini masih punya catatan hutang/piutang. Arsipkan saja.',
	COUNTERPARTY_REQUIRED: 'Isi nama orang atau penyedia pinjamannya.',
	INVALID_DEBT_ORIGIN: 'Asal hutang tidak cocok. Periksa akun, kategori, atau transaksi asalnya.',
	INVALID_SCHEDULE: 'Jadwal cicilan tidak valid. Total cicilan minimal sebesar pokok.',
	DEBT_ALREADY_CLOSED: 'Hutang/piutang ini sudah selesai.',
	DEBT_HAS_PAYMENTS: 'Pokok tidak bisa diubah karena sudah ada pembayaran.',
	DEBT_SPLIT_EXCEEDS_TRANSACTION: 'Bagian orang lain melebihi jumlah transaksinya.',
	DEBT_TRANSACTION_LOCKED: 'Transaksi ini terhubung ke hutang/piutang. Ubah atau hapus lewat halaman Hutang.',
	CURRENCY_MISMATCH: 'Mata uang akun harus sama dengan mata uang hutang/piutangnya.',
	PUSH_NOT_CONFIGURED: 'Notifikasi browser belum aktif di server. Isi VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY lalu mulai ulang backend.',
	PUSH_SEND_FAILED: 'Notifikasi gagal dikirim ke perangkat ini. Coba nonaktifkan lalu aktifkan lagi.'
};

const FALLBACK_MESSAGE = 'Terjadi kesalahan. Coba lagi sebentar lagi.';

export type ErrorMessages = Partial<Record<ErrorCode, string>>;

const isKnownCode = (code: ApiErrorCode | undefined): code is ErrorCode => code !== undefined && Object.hasOwn(MESSAGES, code);

export const describeApiError = (code: ApiErrorCode | undefined, overrides: ErrorMessages = {}) =>
	isKnownCode(code) ? (overrides[code] ?? MESSAGES[code]) : FALLBACK_MESSAGE;

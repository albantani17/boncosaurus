export const CHAT_TOOL_LABELS: Record<string, { running: string; done: string }> = {
	getSummary: { running: 'Menghitung ringkasan…', done: 'Ringkasan dihitung' },
	listAccounts: { running: 'Membaca akun…', done: 'Akun dibaca' },
	listCategories: { running: 'Membaca kategori…', done: 'Kategori dibaca' },
	searchTransactions: { running: 'Mencari transaksi…', done: 'Transaksi dicari' },
	proposeTransaction: { running: 'Menyiapkan transaksi…', done: 'Transaksi disiapkan' },
	listDebts: { running: 'Membaca hutang & piutang…', done: 'Hutang & piutang dibaca' },
	getDebtSummary: { running: 'Menghitung sisa hutang…', done: 'Sisa hutang dihitung' },
	getDebt: { running: 'Membaca detail hutang…', done: 'Detail hutang dibaca' },
	proposeDebt: { running: 'Menyiapkan catatan hutang…', done: 'Catatan hutang disiapkan' },
	proposeDebtPayment: { running: 'Menyiapkan pembayaran…', done: 'Pembayaran disiapkan' },
	proposeDebtWriteOff: { running: 'Menyiapkan ikhlaskan…', done: 'Ikhlaskan disiapkan' }
};

export const CHAT_SUGGESTIONS = [
	'Berapa total pengeluaranku bulan ini?',
	'Kategori apa yang paling boros bulan ini?',
	'Catat: tadi beli kopi 25rb pakai cash',
	'Berapa saldo semua akunku sekarang?',
	'Siapa saja yang masih punya utang ke aku?'
];

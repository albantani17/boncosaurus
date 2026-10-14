export type HttpErrorView = { title: string; description: string; retryable: boolean };

const VIEWS: Record<number, Omit<HttpErrorView, 'retryable'>> = {
	400: { title: 'Permintaan tidak valid', description: 'Data yang dikirim tidak bisa diproses. Periksa lagi lalu coba kembali.' },
	401: { title: 'Sesi berakhir', description: 'Masuk lagi untuk melanjutkan.' },
	403: { title: 'Akses ditolak', description: 'Kamu tidak punya izin untuk membuka halaman ini.' },
	404: { title: 'Halaman tidak ditemukan', description: 'Alamat yang kamu buka tidak ada atau sudah dipindahkan.' },
	405: { title: 'Aksi tidak diizinkan', description: 'Halaman ini tidak menerima aksi tersebut.' },
	408: { title: 'Waktu habis', description: 'Permintaan terlalu lama. Coba lagi sebentar lagi.' },
	413: { title: 'File terlalu besar', description: 'Ukuran data melebihi batas yang diizinkan server.' },
	429: { title: 'Terlalu banyak permintaan', description: 'Tunggu sebentar lalu coba lagi.' },
	500: { title: 'Terjadi kesalahan di server', description: 'Ini bukan salahmu. Coba muat ulang, atau kembali lagi nanti.' },
	502: { title: 'Server tidak merespons', description: 'Layanan backend sedang tidak bisa dihubungi. Coba lagi sebentar lagi.' },
	503: { title: 'Layanan sedang tidak tersedia', description: 'Server sedang sibuk atau dalam perawatan. Coba lagi sebentar lagi.' },
	504: { title: 'Server terlalu lama merespons', description: 'Coba lagi sebentar lagi.' }
};

const GENERIC_CLIENT: Omit<HttpErrorView, 'retryable'> = {
	title: 'Permintaan gagal',
	description: 'Halaman ini tidak bisa dibuka. Coba lagi atau kembali ke beranda.'
};
const GENERIC_SERVER: Omit<HttpErrorView, 'retryable'> = VIEWS[500]!;

export function describeHttpError(status: number): HttpErrorView {
	const view = VIEWS[status] ?? (status >= 500 ? GENERIC_SERVER : GENERIC_CLIENT);
	return { ...view, retryable: status >= 500 || status === 408 || status === 429 };
}

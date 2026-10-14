import type { MascotState } from '../types/api.types';

export const MASCOT_MESSAGES: Record<MascotState, string> = {
	idle: 'Belum ada pemasukan atau pengeluaran bulan ini. Catat transaksi pertamamu.',
	happy: 'Pemasukan bulan ini lebih besar dari pengeluaran. Pertahankan!',
	warning: 'Pengeluaran bulan ini sudah melebihi pemasukan. Yuk cek lagi pengeluaranmu.'
};

import type { DefaultCategory } from '../types/bootstrap.types';

export const defaultCategories: DefaultCategory[] = [
  { name: 'Makanan', type: 'expense', children: ['Makan di luar', 'Belanja dapur'] },
  { name: 'Transportasi', type: 'expense' },
  { name: 'Tagihan', type: 'expense' },
  { name: 'Belanja', type: 'expense' },
  { name: 'Kesehatan', type: 'expense' },
  { name: 'Hiburan', type: 'expense' },
  { name: 'Pendidikan', type: 'expense' },
  { name: 'Lainnya', type: 'expense' },
  { name: 'Gaji', type: 'income' },
  { name: 'Bonus', type: 'income' },
  { name: 'Investasi', type: 'income' },
  { name: 'Pemasukan lain', type: 'income' }
];

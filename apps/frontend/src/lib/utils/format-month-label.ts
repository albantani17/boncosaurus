import { MONTH_NAMES } from '../data/indonesian-calendar';

export const formatMonthLabel = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

const pad = (value: number) => String(value).padStart(2, '0');

export const formatTime = (date: Date) => `${pad(date.getHours())}.${pad(date.getMinutes())}`;

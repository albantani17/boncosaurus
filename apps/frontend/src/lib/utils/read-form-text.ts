export const readFormText = (data: FormData, key: string) => String(data.get(key) ?? '').trim();

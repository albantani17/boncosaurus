export const pickRequestLogLevel = (status: number) => (status >= 500 ? 'error' : 'info');

export type ReadCookie = { value: string; maxAge?: number };

export function readSetCookie(setCookieHeaders: string[], name: string): ReadCookie | undefined {
	for (const header of setCookieHeaders) {
		const [pair = '', ...attributes] = header.split(';').map((part) => part.trim());
		const separator = pair.indexOf('=');
		if (separator === -1 || pair.slice(0, separator) !== name) continue;

		const maxAgeAttribute = attributes.find((attribute) => attribute.toLowerCase().startsWith('max-age='));
		const maxAge = maxAgeAttribute ? Number(maxAgeAttribute.slice('max-age='.length)) : undefined;
		return {
			value: decodeURIComponent(pair.slice(separator + 1)),
			maxAge: Number.isFinite(maxAge) ? maxAge : undefined
		};
	}
	return undefined;
}

export type SecretKey = Uint8Array<ArrayBuffer>;

const VERSION = 'v1';
const IV_BYTES = 12;

const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
const fromBase64 = (value: string) => Uint8Array.from(Buffer.from(value, 'base64'));

const importKey = (key: SecretKey) =>
  crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt', 'decrypt']);

export async function encryptSecret(key: SecretKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await importKey(key),
    new TextEncoder().encode(plaintext)
  );
  return `${VERSION}:${toBase64(iv)}:${toBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptSecret(key: SecretKey, sealed: string): Promise<string> {
  const [version, iv, ciphertext] = sealed.split(':');
  if (version !== VERSION || !iv || !ciphertext) throw new Error('Unsupported secret format');

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    await importKey(key),
    fromBase64(ciphertext)
  );
  return new TextDecoder().decode(plaintext);
}

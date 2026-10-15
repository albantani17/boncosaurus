export const MIN_PASSWORD_LENGTH = 8;

export const hashPassword = (password: string) => Bun.password.hash(password);

export const verifyPassword = (password: string, hash: string) =>
  Bun.password.verify(password, hash);

// Verified against when the user does not exist, so login timing does not reveal valid emails.
export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=2,p=1$6h48LWjW3ej1lhY9IBmAnomTovfQVBIcgDDn5xFbrYE$GEj1NwLEn64rXdwGMiuQQBplHJvs8IQ1u8iotyKwMiY';

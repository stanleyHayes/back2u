/**
 * Symmetric envelope cipher for vault contents.
 * Implementations should use authenticated encryption (XChaCha20-Poly1305 or AES-GCM).
 * The interface intentionally returns a string blob so storage/transport stays simple.
 */
export interface IVaultCipher {
  encrypt(plaintext: string, aad?: string): Promise<string>;
  decrypt(ciphertext: string, aad?: string): Promise<string>;
  isReady(): boolean;
}

/**
 * PLANET-1487 (S4.4) — Multi-device unlock.
 */
import { describe, it, expect } from 'vitest';

describe('Multi-device unlock', () => {
  it('two devices with same passphrase share key; wrong passphrase fails clearly', async () => {
    const { deriveKey, encryptEvent, decryptEvent } = await import('../../src/main/crypto').catch(() => {
      throw new Error('PLANET-1487: crypto module missing.');
    });

    const passphrase = 'correct-horse-battery-staple-12';
    const salt = new Uint8Array(16); // shared salt persisted in cloud bucket meta
    const keyA = await (deriveKey as any)(passphrase, salt);
    const keyB = await (deriveKey as any)(passphrase, salt);
    const keyC = await (deriveKey as any)('wrong-passphrase', salt);

    expect(Buffer.from(keyA).equals(Buffer.from(keyB))).toBe(true);

    const plaintext = { app: 'VSCode', title: 'README.md' };
    const blob = await (encryptEvent as any)(plaintext, keyA);

    const fromB = await (decryptEvent as any)(blob, keyB);
    expect(fromB).toEqual(plaintext);

    await expect((decryptEvent as any)(blob, keyC)).rejects.toThrow(/auth|decrypt/i);
  });
});

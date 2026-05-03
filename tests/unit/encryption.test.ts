/**
 * PLANET-1485 (S4.2) — Event encryption.
 *
 * XChaCha20-Poly1305, key derived via Argon2id.
 * Cloud must NEVER see plaintext.
 */
import { describe, it, expect } from 'vitest';

describe('crypto.encryptEvent', () => {
  it('round-trips, fails on wrong key, hides plaintext from ciphertext', async () => {
    const { deriveKey, encryptEvent, decryptEvent } = await import('../../src/main/crypto').catch(
      () => { throw new Error('PLANET-1485: src/main/crypto module missing.'); },
    );

    const salt = new Uint8Array(16);
    const key = await (deriveKey as any)('correct-horse-battery-staple-12', salt);
    const wrong = await (deriveKey as any)('wrong-passphrase----', salt);

    const plaintexts = Array.from({ length: 100 }, (_, i) => ({
      app: `App-${i}`,
      title: `secret-title-${i}-${Math.random()}`,
    }));

    const blobs = await Promise.all(plaintexts.map((p) => (encryptEvent as any)(p, key)));

    // Determinism: same input + same nonce + same key → same ciphertext
    const blobA = await (encryptEvent as any)(plaintexts[0], key, blobs[0].nonce);
    expect(Buffer.from(blobA.ciphertext).equals(Buffer.from(blobs[0].ciphertext))).toBe(true);

    // Different nonces → different ciphertexts (even same plaintext)
    const blobB = await (encryptEvent as any)(plaintexts[0], key);
    expect(Buffer.from(blobB.ciphertext).equals(Buffer.from(blobs[0].ciphertext))).toBe(false);

    // Round-trip
    for (let i = 0; i < plaintexts.length; i++) {
      const got = await (decryptEvent as any)(blobs[i], key);
      expect(got).toEqual(plaintexts[i]);
    }

    // Wrong key fails
    await expect((decryptEvent as any)(blobs[0], wrong)).rejects.toThrow(/auth|decrypt/i);

    // No plaintext field appears as substring of any ciphertext (statistical)
    for (let i = 0; i < plaintexts.length; i++) {
      const ctHex = Buffer.from(blobs[i].ciphertext).toString('hex');
      expect(ctHex.includes(Buffer.from(plaintexts[i].title).toString('hex'))).toBe(false);
      expect(ctHex.includes(Buffer.from(plaintexts[i].app).toString('hex'))).toBe(false);
    }
  });
});

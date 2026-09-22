import { describe, expect, test } from 'bun:test';
import { generateRandomHex, hashToken } from '@/lib/hash';

describe('Hash Utilities', () => {
  test('generateRandomHex creates hex strings of correct length', () => {
    const hex16 = generateRandomHex(16);
    expect(hex16).toHaveLength(32);

    const hex32 = generateRandomHex(32);
    expect(hex32).toHaveLength(64);
  });

  test('hashToken computes deterministic SHA-256 hash', () => {
    const input = 'unsareport_pat_test12345';
    const hash1 = hashToken(input);
    const hash2 = hashToken(input);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(input);
  });

  test('generateRandomHex produces unique values across calls', () => {
    const first = generateRandomHex(32);
    const second = generateRandomHex(32);
    expect(first).not.toBe(second);
  });

  test('generateRandomHex output contains only hex characters', () => {
    const hex = generateRandomHex(32);
    expect(hex).toHaveLength(64);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  test('hashToken produces distinct hashes for distinct inputs', () => {
    const hashA = hashToken('unsareport_pat_alpha');
    const hashB = hashToken('unsareport_pat_beta');
    expect(hashA).not.toBe(hashB);
    expect(hashA).toHaveLength(64);
    expect(hashB).toHaveLength(64);
    expect(hashA).toMatch(/^[0-9a-f]+$/);
    expect(hashB).toMatch(/^[0-9a-f]+$/);
  });
});

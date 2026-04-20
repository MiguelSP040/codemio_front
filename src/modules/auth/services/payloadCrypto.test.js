import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { encryptProfilePayload } from './payloadCrypto';

const VALID_ALG = 'RSA-OAEP-256+AES-256-GCM';

describe('encryptProfilePayload', () => {
  it('throws when the public key payload is missing', async () => {
    await expect(encryptProfilePayload({ foo: 'bar' }, null)).rejects.toThrow(
      'Invalid public key payload',
    );
  });

  it('throws when the pem is missing', async () => {
    await expect(
      encryptProfilePayload({}, { key_id: 'k', alg: VALID_ALG }),
    ).rejects.toThrow('Invalid public key payload');
  });

  it('throws when the key id is missing', async () => {
    await expect(
      encryptProfilePayload({}, { public_key_pem: 'pem', alg: VALID_ALG }),
    ).rejects.toThrow('Invalid public key payload');
  });

  it('throws when the algorithm is unsupported', async () => {
    await expect(
      encryptProfilePayload({}, { public_key_pem: 'pem', key_id: 'k', alg: 'RSA-OTHER' }),
    ).rejects.toThrow('Invalid public key payload');
  });
});

describe('encryptProfilePayload with mocked WebCrypto', () => {
  beforeEach(() => {
    const publicKey = { type: 'public' };
    const aesKey = { type: 'aes' };
    const subtle = {
      importKey: vi.fn(async () => publicKey),
      generateKey: vi.fn(async () => aesKey),
      exportKey: vi.fn(async () => new Uint8Array([1, 2, 3, 4]).buffer),
      encrypt: vi.fn(async (algorithm) => {
        if (algorithm.name === 'AES-GCM') {
          return new Uint8Array(32).fill(9).buffer;
        }
        return new Uint8Array(16).fill(7).buffer;
      }),
    };
    globalThis.window = {
      crypto: {
        subtle,
        getRandomValues: (buf) => {
          for (let i = 0; i < buf.length; i += 1) buf[i] = i;
          return buf;
        },
      },
    };
  });

  afterEach(() => {
    delete globalThis.window;
  });

  it('returns a payload with all encrypted fields as base64', async () => {
    const pem = `-----BEGIN PUBLIC KEY-----\n${btoa('key')}\n-----END PUBLIC KEY-----`;
    const result = await encryptProfilePayload(
      { nombre: 'Ana', edad: 30 },
      { public_key_pem: pem, key_id: 'kid-1', alg: VALID_ALG },
    );

    expect(result.alg).toBe(VALID_ALG);
    expect(result.key_id).toBe('kid-1');
    expect(typeof result.iv).toBe('string');
    expect(typeof result.tag).toBe('string');
    expect(typeof result.encrypted_key).toBe('string');
    expect(typeof result.encrypted_data).toBe('string');
  });
});

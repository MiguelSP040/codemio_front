const ALGORITHM = 'RSA-OAEP-256+AES-256-GCM';

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '');
  const bytes = Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));
  return bytes.buffer;
}

function toBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function encryptProfilePayload(payload, publicKeyPayload) {
  const { public_key_pem: publicKeyPem, key_id: keyId, alg } = publicKeyPayload || {};
  if (!publicKeyPem || !keyId || alg !== ALGORITHM) {
    throw new Error('Invalid public key payload');
  }

  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );

  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt'],
  );
  const rawAesKey = new Uint8Array(await window.crypto.subtle.exportKey('raw', aesKey));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
  const cipherAndTag = new Uint8Array(
    await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encodedPayload,
    ),
  );
  const tag = cipherAndTag.slice(cipherAndTag.length - 16);
  const encryptedData = cipherAndTag.slice(0, cipherAndTag.length - 16);

  const encryptedKey = new Uint8Array(
    await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAesKey),
  );

  return {
    key_id: keyId,
    alg: ALGORITHM,
    encrypted_key: toBase64(encryptedKey),
    iv: toBase64(iv),
    tag: toBase64(tag),
    encrypted_data: toBase64(encryptedData),
  };
}

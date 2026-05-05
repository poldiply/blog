// ─── Shared hex helpers ────────────────────────────────────────────────────
export function hexToBytes(hex) {
  hex = (hex || '').replace(/\s+/g, '');
  if (hex.length % 2 !== 0) throw new Error('홀수 길이의 hex 문자열');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function randomBytes(n) {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return arr;
}

export function pkcs7Pad(data, blockSize = 16) {
  const pad = blockSize - (data.length % blockSize);
  const out = new Uint8Array(data.length + pad);
  out.set(data);
  out.fill(pad, data.length);
  return out;
}

export function pkcs7Unpad(data) {
  const pad = data[data.length - 1];
  if (pad < 1 || pad > 16) return data; // Not padded
  return data.slice(0, data.length - pad);
}


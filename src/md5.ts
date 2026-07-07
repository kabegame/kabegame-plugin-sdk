const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const TABLE = Array.from({ length: 64 }, (_, i) =>
  Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000),
);

const leftRotate = (value: number, bits: number) =>
  ((value << bits) | (value >>> (32 - bits))) >>> 0;

const toUtf8Bytes = (value: string) => {
  const bytes: number[] = [];
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
};

const toHexLe = (value: number) =>
  [value, value >>> 8, value >>> 16, value >>> 24]
    .map((byte) => (byte & 0xff).toString(16).padStart(2, "0"))
    .join("");

/**
 * Calculate the lowercase MD5 hex digest of a string.
 *
 * This implementation is dependency-free and UTF-8 encodes the input before
 * hashing. Use it when a site requires legacy MD5 request signatures.
 *
 * @example
 * ```ts
 * const sign = md5(`${path}:${secret}`);
 * const response = await fetch(`${apiUrl}?sign=${sign}`);
 * ```
 */
export const md5 = (value: string) => {
  const input = toUtf8Bytes(value);
  const bitLength = input.length * 8;
  const paddedLength = (((input.length + 8) >>> 6) + 1) << 6;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(input);
  bytes[input.length] = 0x80;
  const view = new DataView(bytes.buffer);
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < bytes.length; offset += 64) {
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const word = view.getUint32(offset + g * 4, true);
      const next = d;
      d = c;
      c = b;
      b = (b + leftRotate((a + f + TABLE[i] + word) >>> 0, SHIFT_AMOUNTS[i])) >>> 0;
      a = next;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return `${toHexLe(a0)}${toHexLe(b0)}${toHexLe(c0)}${toHexLe(d0)}`;
};

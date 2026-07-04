import { md5 } from "./md5";

const CHARSET = "AB45STUVWZEFGJ6CH01D237IXYPQRKLMN89";

const mapStringWithCharset = (value: string, charsetLength: number) => {
  const pool = Array.from(CHARSET.slice(0, charsetLength));
  return Array.from(value)
    .map((char) => pool[char.charCodeAt(0) % pool.length])
    .join("");
};

const normalizePath = (urlOrPath: string) => {
  const trimmed = urlOrPath.trim();
  const pathOnly = trimmed.includes("://")
    ? trimmed.slice(trimmed.indexOf("://") + 3).replace(/^[^/]*/, "") || "/"
    : trimmed;
  const withoutQuery = pathOnly.split("?", 1)[0] || "/";
  const segments = withoutQuery.split("/").filter(Boolean);
  return `/${segments.join("/")}/`;
};

const interleaveColumnMajor = (parts: string[]) => {
  const chars = parts.map((part) => Array.from(part));
  const maxLength = Math.max(...chars.map((part) => part.length), 0);
  let out = "";
  for (let row = 0; row < maxLength; row += 1) {
    for (const part of chars) {
      if (row < part.length) {
        out += part[row];
      }
    }
  }
  return out;
};

const gfVm = (value: number) =>
  value & 128 ? 255 & ((value << 1) ^ 27) : value << 1;
const gfQm = (value: number) => gfVm(value) ^ value;
const gfSm = (value: number) => gfQm(gfVm(value));
const gfYm = (value: number) => gfSm(gfQm(gfVm(value)));
const gfGm = (value: number) => gfYm(value) ^ gfSm(value) ^ gfQm(value);

const mixFourBytesInPlace = (values: number[]) => {
  const t0 = gfGm(values[0]) ^ gfYm(values[1]) ^ gfSm(values[2]) ^ gfQm(values[3]);
  const t1 = gfQm(values[0]) ^ gfGm(values[1]) ^ gfYm(values[2]) ^ gfSm(values[3]);
  const t2 = gfSm(values[0]) ^ gfQm(values[1]) ^ gfGm(values[2]) ^ gfYm(values[3]);
  const t3 = gfYm(values[0]) ^ gfSm(values[1]) ^ gfQm(values[2]) ^ gfGm(values[3]);
  values[0] = t0;
  values[1] = t1;
  values[2] = t2;
  values[3] = t3;
};

export const xhhNonce = (t: number) => {
  const pseudoRandom = Math.random().toString();
  return md5(`${Math.trunc(t)}${pseudoRandom}`).toUpperCase();
};

export const xhhHkey = (path: string, t: number, nonce: string) => {
  const pathNorm = normalizePath(path);
  const tInner = Math.trunc(t) + 1;
  const partA = mapStringWithCharset(String(tInner), CHARSET.length - 2);
  const partB = mapStringWithCharset(pathNorm, CHARSET.length);
  const partC = mapStringWithCharset(nonce, CHARSET.length);
  const interleaved = interleaveColumnMajor([partA, partB, partC]).slice(0, 20);
  const md5Hex = md5(interleaved);
  const last6Codes = Array.from(md5Hex.slice(-6)).map((char) => char.charCodeAt(0));
  mixFourBytesInPlace(last6Codes);
  const twoDigit = String(last6Codes.reduce((sum, value) => sum + value, 0) % 100).padStart(2, "0");
  const prefix = mapStringWithCharset(md5Hex.slice(0, 5), CHARSET.length - 4);
  return `${prefix}${twoDigit}`;
};

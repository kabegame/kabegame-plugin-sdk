import { currentUrl } from "./host";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "bmp"]);
const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "m4v",
  "mov",
  "3gp",
  "3g2",
  "mkv",
  "webm",
  "wmv",
  "asf",
]);

const stripFragmentAndQuery = (value: string) => value.split("#", 1)[0].split("?", 1)[0] ?? "";

const extensionFromUrl = (value: string) => {
  const clean = stripFragmentAndQuery(value).toLowerCase();
  const index = clean.lastIndexOf(".");
  return index >= 0 ? clean.slice(index + 1).trim() : "";
};

const hasScheme = (value: string) => /^[a-z][a-z0-9+.-]*:/i.test(value);

const resolvePath = (basePath: string, relativePath: string) => {
  if (relativePath.startsWith("/")) {
    return relativePath;
  }
  const prefix = basePath.endsWith("/") ? basePath : basePath.replace(/\/[^/]*$/, "/");
  const parts = `${prefix}${relativePath}`.split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") {
      continue;
    }
    if (part === "..") {
      out.pop();
    } else {
      out.push(part);
    }
  }
  return `/${out.join("/")}`;
};

const resolveWithFallback = (relative: string, base: string) => {
  const globalUrl = globalThis.URL;
  if (typeof globalUrl === "function") {
    return new globalUrl(relative, base).toString();
  }

  if (hasScheme(relative)) {
    return relative;
  }

  const baseMatch = /^([a-z][a-z0-9+.-]*:)\/\/([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i.exec(base);
  if (!baseMatch) {
    return relative;
  }
  const [, scheme, authority, basePath] = baseMatch;
  if (relative.startsWith("//")) {
    return `${scheme}${relative}`;
  }
  const [pathAndQuery, fragment = ""] = relative.split("#", 2);
  const [path, query = ""] = pathAndQuery.split("?", 2);
  return `${scheme}//${authority}${resolvePath(basePath || "/", path)}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`;
};

export const urlEncode = (value: string) => encodeURIComponent(value);

export function resolveUrl(relative: string, base: string): string;
export function resolveUrl(relative: string): Promise<string>;
export function resolveUrl(relative: string, base?: string) {
  if (base !== undefined) {
    return resolveWithFallback(relative, base);
  }
  return currentUrl()
    .then((current) => resolveWithFallback(relative, current))
    .catch(() => relative);
}

export const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);
export const isHttpsUrl = (value: string) => /^https:\/\//i.test(value);
export const isImageUrl = (value: string) => IMAGE_EXTENSIONS.has(extensionFromUrl(value));
export const isVideoUrl = (value: string) => VIDEO_EXTENSIONS.has(extensionFromUrl(value));
export const isMediaUrl = (value: string) => isImageUrl(value) || isVideoUrl(value);

const resolveWithUrl = (relative: string, base: string) => new URL(relative, base).toString();

/**
 * Resolve a relative URL against an explicit base URL.
 *
 * @example
 * ```ts
 * const imageUrl = resolveUrl("/images/original.jpg", "https://example.test/post/1");
 * // "https://example.test/images/original.jpg"
 * ```
 */
export function resolveUrl(relative: string, base: string): string;

/**
 * Resolve a relative URL against `Kabegame.currentUrl()`.
 *
 * This overload is asynchronous because the current page URL is stored by the
 * Kabegame host runtime. If the current URL is unavailable, the original input
 * is returned.
 *
 * @example
 * ```ts
 * const downloadUrl = await resolveUrl(document.querySelector("a")!.getAttribute("href")!);
 * await Kabegame.downloadImage(downloadUrl);
 * ```
 */
export function resolveUrl(relative: string): Promise<string>;
export function resolveUrl(relative: string, base?: string) {
  if (base !== undefined) {
    return resolveWithUrl(relative, base);
  }
  return Kabegame.currentUrl()
    .then((current) => resolveWithUrl(relative, current))
    .catch(() => relative);
}

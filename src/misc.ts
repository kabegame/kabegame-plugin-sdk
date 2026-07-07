/**
 * Current Unix timestamp in milliseconds.
 *
 * @example
 * ```ts
 * const startedAt = unixTimeMs();
 * await Kabegame.to(url);
 * console.log(`navigation took ${unixTimeMs() - startedAt}ms`);
 * ```
 */
export const unixTimeMs = () => Date.now();

/**
 * Random floating-point number in the half-open range `[min, max)`.
 *
 * @example
 * ```ts
 * await sleep(randF64(500, 1500));
 * ```
 */
export const randF64 = (min = 0, max = 1) => min + Math.random() * (max - min);

/**
 * Wait for at least `ms` milliseconds.
 *
 * The Kabegame V8 runtime provides Web timers, so this helper works in bundled
 * crawler plugins without Node.js APIs.
 *
 * @example
 * ```ts
 * await sleep(2000);
 * await Kabegame.to(nextUrl);
 * ```
 */
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), Math.max(0, ms)));

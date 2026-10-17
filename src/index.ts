/**
 * Public TypeScript SDK for Kabegame V8 crawler plugins.
 *
 * Import helpers from this package in plugin source, then bundle them into the
 * final `crawl.v8.js` file. The Kabegame runtime provides the global
 * `Kabegame` host API and Web platform globals.
 *
 * @example
 * ```ts
 * import { type kbCrawlFn, resolveUrl, sleep } from "@kabegame/plugin-sdk";
 *
 * export const crawl = (async () => {
 *   await Kabegame.to("https://example.test/posts");
 *   await sleep(1000);
 *   await Kabegame.downloadImage(await resolveUrl("/image.jpg"));
 * }) satisfies kbCrawlFn;
 * ```
 */
export * from "./md5.js";
export * from "./i18n.js";
export * from "./misc.js";
export * from "./regex.js";
export * from "./types.js";
export * from "./url.js";

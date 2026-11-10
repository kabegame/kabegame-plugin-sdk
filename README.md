# @kabegame/plugin-sdk

TypeScript SDK for [Kabegame](https://github.com/kabegame/kabegame) JavaScript crawler plugins.

## Typed crawler entry

```ts
import {
  type KbCommonCfg,
  type kbCfgField,
  type kbCfgInt,
  type kbCfgStr,
  type kbCustomCfg,
  type kbCrawlFn,
  resolveUrl,
} from "@kabegame/plugin-sdk";

type MyCfg = kbCustomCfg<[
  kbCfgField<"start_page", kbCfgInt>,
  kbCfgField<"tag", kbCfgStr>,
]>;

export const crawl = (async (common: KbCommonCfg, custom: MyCfg) => {
  await Kabegame.to(`${common.baseUrl}/post?page=${custom.start_page ?? 1}`);
  await Kabegame.downloadImage(resolveUrl("/sample.jpg", common.baseUrl));
}) satisfies kbCrawlFn<MyCfg>;
```

The package is intended to be bundled into the final `crawl.v8.js` file by the plugin author's bundler. Kabegame runtime provides Web platform globals plus the `Kabegame.*` host API.

## i18n

Keep each language's flat message table in `src/i18n/<lang>.json`, then register the tables with
`defineI18n`. The base language table defines the valid keys and is also the fallback for missing
translations. On older Kabegame versions without `getLang`, the base language is used.

```ts
import { defineI18n } from "@kabegame/plugin-sdk";
import en from "./i18n/en.json";
import ja from "./i18n/ja.json";
import ko from "./i18n/ko.json";
import zh from "./i18n/zh.json";
import zhtw from "./i18n/zhtw.json";

const t = defineI18n("zh", { zh, en, ja, ko, zhtw });
console.log(t("openPage", { page: 1, total: 5, url: "https://example.test" }));
```

Enable `resolveJsonModule` in the plugin's `tsconfig.json`; the bundler will inline the JSON tables
into the final plugin script.

## DOM parsing and metadata

```ts
import { sleep, type kbCrawlFn } from "@kabegame/plugin-sdk";

export const crawl = (async (common) => {
  const baseUrl = common.baseUrl ?? "https://example.test";
  await Kabegame.to(`${baseUrl}/posts`);

  const list = await Kabegame.currentDocument();
  const postUrls = Array.from(list?.querySelectorAll(".post > a") ?? [])
    .map((a) => a.getAttribute("href"))
    .filter((href): href is string => !!href)
    .map((href) => new URL(href, baseUrl).href);

  for (const postUrl of postUrls) {
    await sleep(1000);
    await Kabegame.to(postUrl);

    const doc = await Kabegame.currentDocument();
    const title = doc?.querySelector("h1")?.textContent?.trim() ?? "";
    const imageHref = doc?.querySelector(".download")?.getAttribute("href");
    if (!imageHref) continue;

    await Kabegame.downloadImage(new URL(imageHref, postUrl).href, {
      name: title,
      url: postUrl,
      metadata: { schema: 1, title },
      metadata_version: 1,
    });
    Kabegame.addProgress(100 / postUrls.length);
    await Kabegame.back();
  }
}) satisfies kbCrawlFn;
```

## Fetch with task headers

```ts
Kabegame.setHeader("Cookie", "session=...");

const response = await fetch("https://example.test/api/posts");
if (!response.ok) {
  Kabegame.warn(`request failed: ${response.status}`);
}

const data = await response.json();
console.log(data);
```

## Utility helpers

```ts
import { md5, randF64, reFindAll, resolveUrl, sleep, urlEncode } from "@kabegame/plugin-sdk";

const tag = urlEncode("blue archive");
await Kabegame.to(`/posts?tag=${tag}`);
await sleep(randF64(500, 1500));

const html = await Kabegame.currentHtml();
const ids = reFindAll(/data-id="(\d+)"/, html).map((match) => match.captures[0]);
const absolute = await resolveUrl(`/posts/${ids[0]}`);
const signature = md5(`${absolute}:secret`);

console.log({ absolute, signature });
```

## Wallpaper Engine wallpapers

A Wallpaper Engine wallpaper is a folder (`project.json` plus its video, web page or scene files)
that Kabegame stores as a single item. `downloadWpeWallpaper` downloads the folder file by file into
the task VFS and hands it over with `Kabegame.downloadImage(dir, { relocate: true })`: the host
moves the folder into the output directory, or deletes it when the same wallpaper is already in the
library. Requires Kabegame 4.7.0 or later (desktop); works in both the V8 and WebView backends.

```ts
import { downloadWpeWallpaper, type kbCrawlFn } from "@kabegame/plugin-sdk";

export const crawl = (async (common) => {
  // `rootUrl` is the directory; each file is fetched from `${rootUrl}/${path}`.
  const rootUrl = "https://example.test/wallpapers/1234";
  const listing = (await (await fetch(rootUrl)).json()) as {
    files: { path: string; size?: number }[];
  };

  await downloadWpeWallpaper({
    rootUrl,
    files: listing.files, // must contain project.json
    name: "My wallpaper", // display name, also the folder name
    dryRun: common.isDryRun,
    downloadOptions: { url: "https://example.test/post/1234" },
    onFileDone: (file, index, total) => console.log(`${index + 1}/${total} ${file.path}`),
  });
}) satisfies kbCrawlFn;
```

- File paths are relative to the wallpaper folder and `/`-separated; paths with `..`, a leading `/`,
  a backslash or a drive letter are rejected.
- A file counts as downloaded when the response status is 200 and, if `size` is given, the size
  matches. Each file is retried `retries` times (default 2).
- Files are downloaded to `workDir` (default `${Kabegame.fs.getRoot()}/tmp/wpe`). Nothing is left
  there on success; if a step throws, the partial folder is removed, and leftovers older than 12
  hours are cleaned up on the next call.
- Metadata cannot be set: Kabegame stores the wallpaper's `project.json` as its metadata. Only the
  post URL and labels can be passed through `downloadOptions`.

## Links

- Kabegame: https://github.com/kabegame/kabegame
- Runtime types: [@kabegame/types](https://www.npmjs.com/package/@kabegame/types)
- Official plugins: https://github.com/kabegame/crawler-plugins

## License

MIT

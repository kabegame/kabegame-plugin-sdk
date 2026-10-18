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

## Links

- Kabegame: https://github.com/kabegame/kabegame
- Runtime types: [@kabegame/types](https://www.npmjs.com/package/@kabegame/types)
- Official plugins: https://github.com/kabegame/crawler-plugins

## License

MIT

# @kabegame/plugin-sdk

TypeScript SDK for Kabegame JavaScript crawler plugins.

```ts
import {
  type KbCommonCfg,
  type kbCfgField,
  type kbCfgInt,
  type kbCfgStr,
  type kbCustomCfg,
  type kbCrawlFn,
  downloadImage,
  resolveUrl,
  to,
} from "@kabegame/plugin-sdk";

type MyCfg = kbCustomCfg<[
  kbCfgField<"start_page", kbCfgInt>,
  kbCfgField<"tag", kbCfgStr>,
]>;

export const crawl = (async (common: KbCommonCfg, custom: MyCfg) => {
  await to(`${common.base_url}/post?page=${custom.start_page ?? 1}`);
  await downloadImage(resolveUrl("/sample.jpg", common.base_url));
}) satisfies kbCrawlFn<MyCfg>;
```

The package is intended to be bundled into the final `crawl.v8.js` file by the plugin author's bundler. Kabegame runtime only provides the `globalThis.__kabegame_*` ABI.

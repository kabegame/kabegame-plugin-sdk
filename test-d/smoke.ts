import {
  type KbCommonCfg,
  type kbCfgField,
  type kbCfgInt,
  type kbCfgStr,
  type kbCrawlFn,
  type kbCustomCfg,
  downloadImage,
  resolveUrl,
  to,
} from "../src/index";

type MyCfg = kbCustomCfg<[
  kbCfgField<"start_page", kbCfgInt>,
  kbCfgField<"tag", kbCfgStr>,
]>;

export const crawl = (async (common: KbCommonCfg, custom: MyCfg) => {
  const page = custom.start_page ?? 1;
  const tag = custom.tag ?? "";
  await to(`${common.base_url ?? ""}/post?page=${page}&tags=${tag}`);
  await downloadImage(resolveUrl("/sample.jpg", common.base_url ?? "https://example.test"));
}) satisfies kbCrawlFn<MyCfg>;

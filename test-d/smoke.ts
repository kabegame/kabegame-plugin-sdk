import {
  type KbCommonCfg,
  type kbCfgField,
  type kbCfgInt,
  type kbCfgStr,
  type kbCrawlFn,
  type kbCustomCfg,
  resolveUrl,
} from "../src/index";

type MyCfg = kbCustomCfg<[
  kbCfgField<"start_page", kbCfgInt>,
  kbCfgField<"tag", kbCfgStr>,
]>;

export const crawl = (async (common: KbCommonCfg, custom: MyCfg) => {
  const page = custom.start_page ?? 1;
  const tag = custom.tag ?? "";
  await Kabegame.to(`${common.base_url ?? ""}/post?page=${page}&tags=${tag}`);
  await Kabegame.downloadImage(resolveUrl("/sample.jpg", common.base_url ?? "https://example.test"));
  await Kabegame.downloadImage(resolveUrl("/labeled.jpg", common.base_url ?? "https://example.test"), {
    labels: [
      { key: "hatsune", category: "character", name: "Hatsune Miku" },
      { key: "vocaloid" },
    ],
  });
}) satisfies kbCrawlFn<MyCfg>;

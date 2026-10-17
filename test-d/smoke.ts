import {
  type KbCommonCfg,
  type kbCfgField,
  type kbCfgInt,
  type kbCfgStr,
  type kbCrawlFn,
  type kbCustomCfg,
  defineI18n,
  resolveUrl,
} from "../src/index";
import enMessages from "./messages.en.json";
import zhMessages from "./messages.zh.json";

const t = defineI18n("zh", { zh: zhMessages, en: enMessages });
t("done");
t("openPage", { page: 1 });
// @ts-expect-error 基准语言表中不存在的 key 必须在编译期报错。
t("unknownKey");

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

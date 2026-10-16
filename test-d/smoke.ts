import {
  type KbCommonCfg,
  type kbCfgField,
  type kbCfgBool,
  type kbCfgCheckbox,
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

type ModifierCfg = kbCustomCfg<[
  kbCfgField<"required_text", kbCfgStr, { required: true }>,
  kbCfgField<"conditional_text", kbCfgStr, { when: true }>,
  kbCfgField<"enabled", kbCfgBool>,
  kbCfgField<"checks", kbCfgCheckbox<"images" | "videos">, { required: true }>,
]>;

const validModifierCfg: ModifierCfg = {
  required_text: "value",
  enabled: false,
  checks: { images: true, videos: false },
};
validModifierCfg.required_text.toUpperCase();
validModifierCfg.conditional_text?.toUpperCase();

// @ts-expect-error required 字段不接受 null
validModifierCfg.required_text = null;
// @ts-expect-error boolean 字段不接受 null
validModifierCfg.enabled = null;
// @ts-expect-error checkbox 必须包含声明过的全部 variable
validModifierCfg.checks = { images: true };

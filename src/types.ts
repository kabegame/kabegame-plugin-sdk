/**
 * JSON scalar values accepted by Kabegame plugin host APIs.
 *
 * @example
 * ```ts
 * const title: JsonPrimitive = "sample";
 * const count: JsonPrimitive = 3;
 * const missing: JsonPrimitive = null;
 * ```
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * JSON-compatible value that can cross the Kabegame host boundary.
 *
 * Use this for plugin metadata, plugin private data, and custom config values.
 *
 * @example
 * ```ts
 * const metadata: JsonValue = {
 *   title: "Artwork title",
 *   tags: ["blue archive", "wallpaper"],
 *   rating: null,
 * };
 * ```
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

/**
 * JSON object shape used by plugin metadata and persisted plugin data.
 *
 * @example
 * ```ts
 * const cache: JsonObject = {
 *   lastCursor: "abc",
 *   page: 2,
 * };
 * ```
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * Host-provided common crawler config.
 *
 * `base_url` comes from the plugin package metadata. It may be `null` when the
 * package does not define a base URL, so plugins should keep a fallback.
 *
 * @example
 * ```ts
 * const baseUrl = common.base_url ?? "https://example.test";
 * await Kabegame.to(`${baseUrl}/posts`);
 * ```
 */
export interface KbCommonCfg {
  base_url: string | null;
}

declare const kbCfgKey: unique symbol;
declare const kbCfgValue: unique symbol;
declare const kbCfgModifier: unique symbol;

/**
 * Integer custom config field value.
 *
 * @example
 * ```ts
 * type StartPage = kbCfgField<"startPage", kbCfgInt>;
 * ```
 */
export type kbCfgInt = number;

/**
 * String custom config field value.
 *
 * @example
 * ```ts
 * type Tag = kbCfgField<"tag", kbCfgStr>;
 * ```
 */
export type kbCfgStr = string;

/**
 * Boolean custom config field value.
 *
 * @example
 * ```ts
 * type IncludeR18 = kbCfgField<"includeR18", kbCfgBool>;
 * ```
 */
export type kbCfgBool = boolean;

/**
 * Alias for {@link kbCfgBool}.
 *
 * @example
 * ```ts
 * type Enabled = kbCfgField<"enabled", kbCfgBoolean>;
 * ```
 */
export type kbCfgBoolean = boolean;

/**
 * Checkbox custom config field value.
 *
 * @example
 * ```ts
 * type MediaKinds = kbCfgField<"mediaKinds", kbCfgCheckbox<"image" | "video">>;
 * ```
 */
export type kbCfgCheckbox<V extends string = string> = Record<V, boolean>;

/**
 * Date custom config value encoded as a string.
 *
 * @example
 * ```ts
 * type RankingDate = kbCfgField<"rankingDate", kbCfgDate>;
 * ```
 */
export type kbCfgDate = string;

/**
 * List custom config value.
 *
 * @example
 * ```ts
 * type Tags = kbCfgField<"tags", kbCfgList<string>>;
 * ```
 */
export type kbCfgList<T extends JsonValue = JsonValue> = T[];

/**
 * Option/select custom config value.
 *
 * @example
 * ```ts
 * type SortMode = kbCfgField<"sort", kbCfgOption<"new" | "popular">>;
 * ```
 */
export type kbCfgOption<T extends string | number | boolean = string> = T;

/**
 * Describes one custom config field for {@link kbCustomCfg}.
 *
 * This is a type-level helper only; it is not a runtime value.
 *
 * @example
 * ```ts
 * type StartPageField = kbCfgField<"startPage", kbCfgInt>;
 * ```
 */
/** Type-level modifiers mirroring `kbConfig.required` and `kbConfig.when`. */
export type kbCfgFieldMod = { required?: true; when?: true };

export type kbCfgField<K extends string, T, M extends kbCfgFieldMod = {}> = {
  readonly [kbCfgKey]: K;
  readonly [kbCfgValue]: T;
  readonly [kbCfgModifier]: M;
};

type FieldEntry<F, PreserveNull extends boolean> =
  F extends kbCfgField<infer K, infer T, infer M>
    ? M extends { required: true }
      ? M extends { when: true }
        ? { [P in K]?: T }
        : { [P in K]: T }
      : // 用元组包裹避免分配：否则 boolean 会拆成 true | false，交叉后坍缩为 never
        [T] extends [boolean]
        ? M extends { when: true }
          ? { [P in K]?: T }
          : { [P in K]: T }
        : M extends { when: true }
          ? { [P in K]?: PreserveNull extends true ? T | null : T }
          : { [P in K]: PreserveNull extends true ? T | null : T }
    : unknown;

type UnionToIntersection<U> = (
  U extends unknown ? (value: U) => void : never
) extends (value: infer I) => void
  ? I
  : never;

/**
 * Builds the typed `custom` argument for a plugin `crawl` function.
 *
 * By default each field also accepts `null`, matching Kabegame's JSON config
 * boundary. Pass `false` as the second generic parameter when your code has
 * already normalized nullable values.
 *
 * @example
 * ```ts
 * type AnimeCfg = kbCustomCfg<[
 *   kbCfgField<"startPage", kbCfgInt>,
 *   kbCfgField<"tag", kbCfgStr>,
 * ]>;
 *
 * export async function crawl(common: KbCommonCfg, custom: AnimeCfg) {
 *   const startPage = custom.startPage ?? 0;
 *   const tag = custom.tag ?? "";
 * }
 * ```
 */
export type kbCustomCfg<
  Fields extends readonly kbCfgField<string, unknown>[],
  PreserveNull extends boolean = true,
> = UnionToIntersection<FieldEntry<Fields[number], PreserveNull>>;

/**
 * Signature for a Kabegame V8 crawler entrypoint.
 *
 * The plugin bundle must export `crawl`. It may finish synchronously or return a
 * promise. Effects are produced through `Kabegame.*` host APIs.
 *
 * @example
 * ```ts
 * type CustomCfg = kbCustomCfg<[kbCfgField<"tag", kbCfgStr>]>;
 *
 * export const crawl = (async (common, custom) => {
 *   const url = new URL("/posts", common.base_url ?? "https://example.test");
 *   if (custom.tag) url.searchParams.set("tag", custom.tag);
 *   await Kabegame.to(url.href);
 * }) satisfies kbCrawlFn<CustomCfg>;
 * ```
 */
export type kbCrawlFn<CustomCfg = Record<string, JsonValue>> = (
  common: KbCommonCfg,
  custom: CustomCfg,
) => void | Promise<void>;

/**
 * App-level image label, shown as a label album in Kabegame.
 * - `key`: required, `[a-zA-Z0-9_\-() ]` (spaces not leading/trailing/consecutive), at most 64 bytes.
 * - `category`: `/`-separated parent keys (same charset each); defaults to the plugin id.
 * - `name`: display name, used only when the label is created; defaults to `key`.
 *   Existing labels are never renamed by plugins.
 * Invalid labels are skipped with a warning, never auto-corrected. Labels are only ever added.
 */
export interface KbLabelInput {
  key: string;
  category?: string | null;
  name?: string | null;
}

/**
 * Options for `Kabegame.downloadImage`.
 *
 * @example
 * ```ts
 * await Kabegame.downloadImage(imageUrl, {
 *   name: "artist / character",
 *   url: postUrl,
 *   metadata: { schema: 1, title: "Post title" },
 * });
 * ```
 */
export interface KbDownloadImageOptions {
  /** Optional display filename/title shown in Kabegame. */
  name?: string | null;
  /** Existing metadata row id returned by `Kabegame.createImageMetadata`. */
  metadata_id?: number | null;
  /** Source/post URL associated with the downloaded file. */
  url?: string | null;
  /**
   * JSON metadata to store with the image. Ignored when `metadata_id` is set.
   * The stored row is stamped with the running plugin's version by the app;
   * keep a `schema` marker inside the metadata itself for your migration script.
   */
  metadata?: JsonValue;
  /** Labels attached to the image; on a dedup hit, applied only if "update metadata on dedup" is on. */
  labels?: KbLabelInput[] | null;
}

/**
 * Options for `Kabegame.createImageMetadata`.
 *
 * The stored row is stamped with the running plugin's version by the app;
 * keep a `schema` marker inside the metadata itself for your migration script.
 *
 * @example
 * ```ts
 * const metadataId = Kabegame.createImageMetadata({ schema: 1, title: "Post title" });
 * await Kabegame.downloadImage(imageUrl, { metadata_id: Number(metadataId) });
 * ```
 */
export interface KbCreateImageMetadataOptions {}

/**
 * Lightweight text match result used by SDK helpers that extract text from HTML.
 *
 * @example
 * ```ts
 * const match: KbTextMatchElement = {
 *   text: "Download",
 *   tag: "a",
 *   attrs: { href: "/file.jpg" },
 *   class: "button",
 * };
 * ```
 */
export interface KbTextMatchElement {
  /** Normalized text content. */
  text: string;
  /** Lowercase tag name. */
  tag: string;
  /** Raw element attributes keyed by attribute name. */
  attrs: Record<string, string>;
  /** Shortcut for `attrs.id` when present. */
  id?: string;
  /** Shortcut for `attrs.class` when present. */
  class?: string;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface KbCommonCfg {
  base_url: string | null;
}

declare const kbCfgKey: unique symbol;
declare const kbCfgValue: unique symbol;

export type kbCfgInt = number;
export type kbCfgStr = string;
export type kbCfgBool = boolean;
export type kbCfgBoolean = boolean;
export type kbCfgCheckbox = boolean;
export type kbCfgDate = string;
export type kbCfgList<T extends JsonValue = JsonValue> = T[];
export type kbCfgOption<T extends string | number | boolean = string> = T;

export type kbCfgField<K extends string, T> = {
  readonly [kbCfgKey]: K;
  readonly [kbCfgValue]: T;
};

type FieldEntry<F, PreserveNull extends boolean> =
  F extends kbCfgField<infer K, infer T>
    ? { [P in K]: PreserveNull extends true ? T | null : T }
    : unknown;

type UnionToIntersection<U> = (
  U extends unknown ? (value: U) => void : never
) extends (value: infer I) => void
  ? I
  : never;

export type kbCustomCfg<
  Fields extends readonly kbCfgField<string, unknown>[],
  PreserveNull extends boolean = true,
> = UnionToIntersection<FieldEntry<Fields[number], PreserveNull>>;

export type kbCrawlFn<CustomCfg = Record<string, JsonValue>> = (
  common: KbCommonCfg,
  custom: CustomCfg,
) => void | Promise<void>;

export interface KbDownloadImageOptions {
  name?: string | null;
  metadata_id?: number | null;
  metadata?: JsonValue;
  metadata_version?: number | null;
}

export interface KbCreateImageMetadataOptions {
  version?: number | null;
}

export interface KbTextMatchElement {
  text: string;
  tag: string;
  attrs: Record<string, string>;
  id?: string;
  class?: string;
}

import "./globals";
import type {
  JsonObject,
  JsonValue,
  KbCreateImageMetadataOptions,
  KbDownloadImageOptions,
} from "./types";

export const to = (url: string) => globalThis.__kabegame_to(url);
export const back = () => globalThis.__kabegame_back();
export const fetchJson = <T extends JsonValue = JsonValue>(url: string) =>
  globalThis.__kabegame_fetch_json(url) as Promise<T>;
export const currentUrl = () => globalThis.__kabegame_current_url();
export const currentHtml = () => globalThis.__kabegame_current_html();
export const currentHeaders = () => globalThis.__kabegame_current_headers();
export const pluginData = <T extends JsonObject = JsonObject>() =>
  globalThis.__kabegame_plugin_data() as T;
export const setPluginData = (value: JsonObject) =>
  globalThis.__kabegame_set_plugin_data(value);
export const setHeader = (key: string, value: string) =>
  globalThis.__kabegame_set_header(key, value);
export const delHeader = (key: string) => globalThis.__kabegame_del_header(key);
export const warn = (message: string) => globalThis.__kabegame_warn(message);
export const addProgress = (percentage: number) =>
  globalThis.__kabegame_add_progress(percentage);
export const downloadImage = (
  url: string,
  opts?: KbDownloadImageOptions | null,
) => globalThis.__kabegame_download_image(url, opts ?? null);
export const createImageMetadata = (
  value: JsonValue,
  opts?: KbCreateImageMetadataOptions | null,
) => globalThis.__kabegame_create_image_metadata(value, opts ?? null);

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));

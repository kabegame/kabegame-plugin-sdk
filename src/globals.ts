import type {
  JsonObject,
  JsonValue,
  KbCreateImageMetadataOptions,
  KbDownloadImageOptions,
} from "./types";

declare global {
  var __kabegame_to: (url: string) => Promise<string>;
  var __kabegame_back: () => Promise<void>;
  var __kabegame_fetch_json: (url: string) => Promise<JsonValue>;
  var __kabegame_current_url: () => Promise<string>;
  var __kabegame_current_html: () => Promise<string>;
  var __kabegame_current_headers: () => Promise<Record<string, string>>;
  var __kabegame_plugin_data: () => JsonObject;
  var __kabegame_set_plugin_data: (value: JsonObject) => void;
  var __kabegame_set_header: (key: string, value: string) => void;
  var __kabegame_del_header: (key: string) => void;
  var __kabegame_warn: (message: string) => void;
  var __kabegame_add_progress: (percentage: number) => number;
  var __kabegame_download_image: (
    url: string,
    opts?: KbDownloadImageOptions | null,
  ) => Promise<void>;
  var __kabegame_create_image_metadata: (
    value: JsonValue,
    opts?: KbCreateImageMetadataOptions | null,
  ) => bigint;
}

export {};

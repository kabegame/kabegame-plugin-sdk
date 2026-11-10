/**
 * Download a Wallpaper Engine wallpaper directory file by file and hand it to Kabegame as one
 * wallpaper.
 *
 * A Wallpaper Engine wallpaper is a folder (`project.json` plus its video / web page / scene
 * files), stored in Kabegame as a single item. This helper downloads every file into the task VFS
 * and then calls `Kabegame.downloadImage(dir, { relocate: true })`, which moves the folder into the
 * output directory — or deletes it when the same wallpaper is already in the library.
 *
 * Requires Kabegame 4.7.0 or later (desktop). The helper works in both the V8 and WebView backends.
 */

/** One file of a wallpaper directory. */
export interface WpeWallpaperFile {
  /** Path relative to the wallpaper directory, `/`-separated, e.g. `materials/a.tex`. */
  path: string;
  /** Expected size in bytes. When given, a download of a different size counts as failed. */
  size?: number | null;
}

/** Options for {@link downloadWpeWallpaper}. */
export interface DownloadWpeWallpaperOptions {
  /**
   * URL of the wallpaper directory. Each file is fetched from `rootUrl + "/" + path`, with every
   * path segment passed through `encodeURIComponent`.
   */
  rootUrl: string;
  /** Files to download. Must contain `project.json`. */
  files: readonly WpeWallpaperFile[];
  /** Display name; also used as the name of the folder in the output directory. */
  name?: string | null;
  /** VFS directory to download into. Defaults to `${Kabegame.fs.getRoot()}/tmp/wpe`. */
  workDir?: string;
  /** Extra request headers for every file. */
  headers?: Record<string, string>;
  /** Retries per file after the first attempt. Defaults to 2. */
  retries?: number;
  /** Called after each file has been downloaded, typically to log progress. */
  onFileDone?: (file: WpeWallpaperFile, index: number, total: number) => void;
  /**
   * Post URL and labels for the wallpaper. Metadata cannot be set: Kabegame stores the wallpaper's
   * `project.json` as its metadata.
   */
  downloadOptions?: Pick<KabegameDownloadImageOptions, "url" | "labels">;
  /**
   * Pass the task's dry-run flag (`common.isDryRun`). When true nothing is downloaded; the host
   * only records one skipped download.
   */
  dryRun?: boolean;
}

/** Leftover download folders older than this are removed on the first call. */
const STALE_MS = 12 * 60 * 60 * 1000;
const DEFAULT_RETRIES = 2;
const PROJECT_FILE = "project.json";
/** Download folders are named `<unix ms>-<random>`; only folders of this shape are cleaned up. */
const WORK_ENTRY = /^(\d{10,})-[0-9a-z]+$/;

const cleanedWorkDirs = new Set<string>();

function errorText(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (message != null) return String(message);
  }
  return String(error);
}

/** Reject anything that could leave the wallpaper directory. */
function checkRelativePath(path: unknown): string {
  const text = typeof path === "string" ? path : "";
  const valid =
    text.length > 0 &&
    !text.startsWith("/") &&
    !text.includes("\\") &&
    !/^[a-zA-Z]:/.test(text) &&
    text.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
  if (!valid) throw new Error(`Invalid wallpaper file path: ${JSON.stringify(path)}`);
  return text;
}

function fileUrl(rootUrl: string, path: string): string {
  return `${rootUrl}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

async function removeQuietly(path: string): Promise<void> {
  try {
    await Kabegame.fs.remove(path, { recursive: true });
  } catch {
    // Already gone, or the task is being cancelled: nothing more to do.
  }
}

/**
 * Remove download folders left behind by interrupted runs. Recent folders are kept: a concurrent
 * task of the same plugin may still be downloading into one, or have one queued for import.
 */
async function removeStaleEntries(workDir: string): Promise<void> {
  if (cleanedWorkDirs.has(workDir)) return;
  cleanedWorkDirs.add(workDir);
  const stale: string[] = [];
  try {
    for await (const entry of Kabegame.fs.readDir(workDir)) {
      const match = entry.isDirectory ? WORK_ENTRY.exec(entry.name) : null;
      if (match && Date.now() - Number(match[1]) > STALE_MS) stale.push(entry.name);
    }
  } catch {
    // The work directory does not exist yet.
    return;
  }
  for (const name of stale) await removeQuietly(`${workDir}/${name}`);
}

async function downloadFile(
  url: string,
  dest: string,
  file: WpeWallpaperFile,
  headers: Record<string, string> | undefined,
  retries: number,
): Promise<void> {
  let lastError = "";
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await Kabegame.fetchToFile(url, dest, headers ? { headers } : undefined);
      if (response.status !== 200) {
        lastError = `HTTP ${response.status}`;
      } else if (file.size != null && response.bytesWritten !== file.size) {
        lastError = `size mismatch: expected ${file.size}, got ${response.bytesWritten}`;
      } else {
        return;
      }
    } catch (error) {
      lastError = errorText(error);
    }
    await removeQuietly(dest);
  }
  throw new Error(`Failed to download ${file.path}: ${lastError}`);
}

/**
 * Download a Wallpaper Engine wallpaper directory and import it as one wallpaper.
 *
 * The promise resolves once the downloaded folder has been handed to Kabegame's download queue;
 * Kabegame then moves it out of the task VFS, so nothing is left behind on success. If any step
 * throws, the partially downloaded folder is removed.
 *
 * @example
 * ```ts
 * import { downloadWpeWallpaper } from "@kabegame/plugin-sdk";
 *
 * const rootUrl = `${server}/file/${encodedDirectoryPath}`;
 * const listing = await (await fetch(rootUrl)).json();
 * await downloadWpeWallpaper({
 *   rootUrl,
 *   files: listing.files,
 *   name: title,
 *   dryRun: common.isDryRun,
 *   onFileDone: (file, index, total) => console.log(`${index + 1}/${total} ${file.path}`),
 * });
 * ```
 */
export async function downloadWpeWallpaper(opts: DownloadWpeWallpaperOptions): Promise<void> {
  const rootUrl = String(opts.rootUrl ?? "").replace(/\/+$/, "");
  if (!rootUrl) throw new Error("downloadWpeWallpaper: rootUrl is required");
  const files = (opts.files ?? []).map((file) => ({ ...file, path: checkRelativePath(file?.path) }));
  if (!files.some((file) => file.path === PROJECT_FILE)) {
    throw new Error(`downloadWpeWallpaper: files must contain ${PROJECT_FILE}`);
  }
  const name = opts.name ?? undefined;

  if (opts.dryRun) {
    // Let the host record one skipped download; nothing is fetched.
    await Kabegame.downloadImage(rootUrl, { name, ...opts.downloadOptions });
    return;
  }

  const workDir = (opts.workDir ?? `${Kabegame.fs.getRoot()}/tmp/wpe`).replace(/\/+$/, "");
  await removeStaleEntries(workDir);

  const retries = Math.max(0, Math.floor(opts.retries ?? DEFAULT_RETRIES));
  // The folder name only has to be unique; the final name comes from `name` / project.json.
  const dir = `${workDir}/${Date.now()}-${Math.random().toString(36).slice(2, 10) || "0"}`;
  try {
    await Kabegame.fs.mkdir(dir, { recursive: true });
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const dest = `${dir}/${file.path}`;
      const slash = dest.lastIndexOf("/");
      if (slash > dir.length) await Kabegame.fs.mkdir(dest.slice(0, slash), { recursive: true });
      await downloadFile(fileUrl(rootUrl, file.path), dest, file, opts.headers, retries);
      opts.onFileDone?.(file, index, files.length);
    }
    await Kabegame.downloadImage(dir, { name, ...opts.downloadOptions, relocate: true });
  } catch (error) {
    await removeQuietly(dir);
    throw error;
  }
}

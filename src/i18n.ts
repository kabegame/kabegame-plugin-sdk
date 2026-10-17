/** Translate a message key, filling `{name}` placeholders from `params`. */
export type KbTranslate<K extends string> = (key: K, params?: Record<string, unknown>) => string;

/**
 * Register per-language message tables and get a translator for the app's UI language.
 * `base` is the plugin's source language (its table must be complete); it is used when the
 * host has no `Kabegame.getLang` (older apps) and as the fallback for missing keys.
 */
export function defineI18n<
  B extends KabegameLang,
  T extends Partial<Record<KabegameLang, Record<string, string>>>,
>(
  base: B,
  messages: T &
    Record<NoInfer<B>, Record<string, string>> &
    { [L in Exclude<keyof T, B>]: Partial<T[B]> },
): KbTranslate<keyof T[B] & string> {
  const lang = Kabegame.getLang?.() ?? base;
  const tables = [messages[lang], messages[base]] as Array<Partial<T[B]> | undefined>;
  return (key, params = {}) => {
    const tpl = (tables.find((table) => table?.[key] != null)?.[key] ?? key) as string;
    return tpl.replace(/\{(\w+)\}/g, (matched, name) =>
      params[name] != null ? String(params[name]) : matched,
    );
  };
}

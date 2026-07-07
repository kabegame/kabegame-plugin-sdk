/**
 * One regex match returned by {@link reFindAll}.
 *
 * @example
 * ```ts
 * const [first] = reFindAll(/id=(\d+)/, "id=42");
 * console.log(first.match); // "id=42"
 * console.log(first.captures[0]); // "42"
 * ```
 */
export interface KbRegexMatch {
  /** Full matched text. */
  match: string;
  /** Positional capture groups. Missing captures are normalized to empty strings. */
  captures: string[];
  /** Named capture groups keyed by group name. */
  groups: Record<string, string>;
  /** Zero-based index of the match in the input text. */
  index: number;
}

const toRegex = (pattern: string | RegExp, flags = "") => {
  if (pattern instanceof RegExp) {
    return pattern;
  }
  return new RegExp(pattern, flags);
};

/**
 * Safely test whether text matches a regex pattern.
 *
 * Invalid string patterns return `false` instead of throwing, which is useful
 * when a pattern comes from plugin config.
 *
 * @example
 * ```ts
 * if (reIsMatch("\\.(jpg|png)$", imageUrl)) {
 *   await Kabegame.downloadImage(imageUrl);
 * }
 * ```
 */
export const reIsMatch = (pattern: string | RegExp, text: string) => {
  try {
    return toRegex(pattern).test(text);
  } catch {
    return false;
  }
};

/**
 * Safely replace all occurrences of a regex pattern.
 *
 * String patterns are compiled with the `g` flag. Non-global `RegExp` values
 * are cloned with `g` added. Invalid patterns return the original text.
 *
 * @example
 * ```ts
 * const compact = reReplaceAll("\\s+", " ", title).trim();
 * ```
 */
export const reReplaceAll = (
  pattern: string | RegExp,
  replacement: string,
  text: string,
) => {
  try {
    const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, "g");
    const globalRe = re.global ? re : new RegExp(re.source, `${re.flags}g`);
    return text.replace(globalRe, replacement);
  } catch {
    return text;
  }
};

/**
 * Find all regex matches in text.
 *
 * Non-global patterns are cloned with the `g` flag so every match is returned.
 *
 * @example
 * ```ts
 * const ids = reFindAll(/data-id="(\d+)"/, html)
 *   .map((match) => match.captures[0]);
 * ```
 */
export const reFindAll = (pattern: string | RegExp, text: string): KbRegexMatch[] => {
  const re = toRegex(pattern);
  const globalRe = re.global ? re : new RegExp(re.source, `${re.flags}g`);
  const results: KbRegexMatch[] = [];
  for (const match of text.matchAll(globalRe)) {
    results.push({
      match: match[0],
      captures: match.slice(1).map((value) => value ?? ""),
      groups: match.groups ? { ...match.groups } : {},
      index: match.index,
    });
  }
  return results;
};

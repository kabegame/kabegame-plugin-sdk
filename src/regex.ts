export interface KbRegexMatch {
  match: string;
  captures: string[];
  groups: Record<string, string>;
  index: number;
}

const toRegex = (pattern: string | RegExp, flags = "") => {
  if (pattern instanceof RegExp) {
    return pattern;
  }
  return new RegExp(pattern, flags);
};

export const reIsMatch = (pattern: string | RegExp, text: string) => {
  try {
    return toRegex(pattern).test(text);
  } catch {
    return false;
  }
};

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

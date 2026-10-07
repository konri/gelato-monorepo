/**
 * Picks the app language from a `{ pl, en, ua }` JSON value (titleLocal,
 * descriptionLocal, nameLocal). Accepts a JSON string too. Returns '' when
 * nothing fits, so callers can fall back to the plain field.
 */
export const localizedText = (value: unknown, lang: string): string => {
  let v = value;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed.startsWith('{')) return trimmed;
    try {
      v = JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  if (!v || typeof v !== 'object') return '';
  const map = v as Record<string, unknown>;
  const code = (lang || 'en').split('-')[0].toLowerCase();
  const pick = (k: string) => (typeof map[k] === 'string' && (map[k] as string).trim() ? (map[k] as string) : '');
  return pick(code) || pick(code === 'ua' ? 'uk' : '') || pick('en') || pick('pl') || '';
};

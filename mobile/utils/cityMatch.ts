/**
 * The app stores the chosen city twice (BRANDS_SPEC §5.1 F6): a NAME in
 * AsyncStorage `selectedCity` (Spots, Tastes, News read it) and
 * `me.preferredCityId` on the server. These helpers match one to the other.
 */
type CityLike = {
  id: string;
  name: string;
  nameLocal?: { pl?: string; en?: string; ua?: string } | string | null;
};

const localNames = (city: CityLike): string[] => {
  const local = city.nameLocal && typeof city.nameLocal === 'object' ? city.nameLocal : {};
  return [city.name, local.pl, local.en, local.ua].filter((n): n is string => !!n);
};

/** True when `name` is the city's name in any language (case-insensitive). */
export const matchesCity = (city: CityLike, name: string | null | undefined): boolean => {
  const target = name?.trim().toLowerCase();
  if (!target) return false;
  return localNames(city).some((n) => n.trim().toLowerCase() === target);
};

export const findCityByName = <C extends CityLike>(
  cities: readonly C[] | null | undefined,
  name: string | null | undefined,
): C | null => (cities ?? []).find((c) => matchesCity(c, name)) ?? null;

/** The city name in the app language (`ua`, `pl`, `en`), else its default name. */
export const localizedCityName = (city: CityLike | null | undefined, lang: string): string => {
  if (!city) return '';
  const local = city.nameLocal && typeof city.nameLocal === 'object' ? city.nameLocal : null;
  const code = (lang || 'en').split('-')[0] as 'pl' | 'en' | 'ua';
  return (local && (local[code] || local.en)) || city.name;
};

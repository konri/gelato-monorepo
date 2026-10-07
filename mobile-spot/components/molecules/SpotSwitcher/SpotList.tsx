import { Typography } from '@/components/atoms/Typography';
import { spotCityName } from '@/hooks/useActiveSpot';
import type { StaffKindVM } from '@/shared/api-client/src/api/types';
import type { StaffSpotVM } from '@/stores/spotStore';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, TextInput, View } from 'react-native';
import { SpotRow } from './SpotRow';

/** More spots than this get a search field. */
const SEARCH_THRESHOLD = 8;

type Section = { key: string; title: string | null; data: StaffSpotVM[] };

// Case- and diacritic-insensitive (incl. Polish ł).
const fold = (s: string | null | undefined) =>
  (s ?? '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const byName = (a: StaffSpotVM, b: StaffSpotVM) => a.name.localeCompare(b.name);

type Props = {
  spots: StaffSpotVM[];
  activeSpotId: string | null;
  /** The server's / device's last-used spot ("Last used" tag). */
  lastUsedId?: string | null;
  /** Pre-highlighted row (choose screen). */
  highlightedId?: string | null;
  staffKind: StaffKindVM | null;
  onSelect: (spot: StaffSpotVM) => void;
  ListHeaderComponent?: ReactElement | null;
  contentPaddingBottom?: number;
  /** Fill the parent (full screen) instead of shrinking inside a sheet. */
  fill?: boolean;
};

/**
 * The spot list shared by the switcher sheet and the choose screen: search
 * when there are more than 8 spots; the active spot pinned first; grouped by
 * brand for the Loodly team, by city when the brand has several cities,
 * otherwise a flat list by name; inactive spots last under "Not open yet".
 */
export function SpotList({
  spots,
  activeSpotId,
  lastUsedId,
  highlightedId,
  staffKind,
  onSelect,
  ListHeaderComponent,
  contentPaddingBottom = 24,
  fill = false,
}: Props) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const showSearch = spots.length > SEARCH_THRESHOLD;

  const sections = useMemo<Section[]>(() => {
    const q = fold(query.trim());
    const matches = q
      ? spots.filter((s) =>
          [s.name, spotCityName(s, i18n.language), s.address, s.brandName].some((v) => fold(v).includes(q)),
        )
      : spots;

    const out: Section[] = [];
    const pinned = matches.find((s) => s.spotId === activeSpotId);
    if (pinned) out.push({ key: 'active', title: null, data: [pinned] });

    const rest = matches.filter((s) => s.spotId !== activeSpotId);
    const open = rest.filter((s) => s.isActive);
    const notOpen = rest.filter((s) => !s.isActive).sort(byName);

    const cityOf = (s: StaffSpotVM) => spotCityName(s, i18n.language) ?? '';
    const multiCity = new Set(spots.map((s) => `${s.brandId}|${s.cityId ?? ''}`)).size > new Set(spots.map((s) => s.brandId)).size;

    if (staffKind === 'PLATFORM') {
      const byBrand = new Map<string, StaffSpotVM[]>();
      for (const s of open) {
        const k = s.brandName || s.brandId;
        byBrand.set(k, [...(byBrand.get(k) ?? []), s]);
      }
      [...byBrand.keys()]
        .sort((a, b) => a.localeCompare(b))
        .forEach((brand) =>
          out.push({
            key: `brand:${brand}`,
            title: brand,
            data: (byBrand.get(brand) ?? []).sort((a, b) => cityOf(a).localeCompare(cityOf(b)) || byName(a, b)),
          }),
        );
    } else if (multiCity) {
      const byCity = new Map<string, StaffSpotVM[]>();
      for (const s of open) {
        const k = cityOf(s);
        byCity.set(k, [...(byCity.get(k) ?? []), s]);
      }
      [...byCity.keys()]
        .sort((a, b) => a.localeCompare(b))
        .forEach((city) =>
          out.push({ key: `city:${city}`, title: city || null, data: (byCity.get(city) ?? []).sort(byName) }),
        );
    } else if (open.length) {
      out.push({ key: 'open', title: null, data: [...open].sort(byName) });
    }

    if (notOpen.length) out.push({ key: 'notOpen', title: t('SpotSwitcher.notOpenYet'), data: notOpen });
    return out;
  }, [spots, activeSpotId, staffKind, query, i18n.language, t]);

  const header = (
    <View>
      {ListHeaderComponent}
      {showSearch && (
        <View className="mb-3 flex-row items-center rounded-xl border border-gray-300 bg-white px-3" style={{ minHeight: 52 }}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('SpotSwitcher.search')}
            placeholderTextColor="#6B7280"
            accessibilityLabel={t('SpotSwitcher.search')}
            autoCapitalize="none"
            autoCorrect={false}
            className="ml-2 flex-1 text-base"
            style={{ minHeight: 48, fontSize: 16 }}
          />
        </View>
      )}
    </View>
  );

  return (
    <SectionList
      style={fill ? { flex: 1 } : { flexGrow: 0, flexShrink: 1 }}
      sections={sections}
      keyExtractor={(item) => item.spotId}
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Typography variant="body-base-regular" className="py-8 text-center text-gray-500">
          {t('SpotSwitcher.noResults')}
        </Typography>
      }
      renderSectionHeader={({ section }) =>
        section.title ? (
          <Typography
            variant="body-base-bold"
            className="mb-2 mt-3"
            style={{ color: '#4B5563', letterSpacing: 0.5, fontSize: 16 }}
            accessibilityRole="header"
          >
            {section.title.toUpperCase()}
          </Typography>
        ) : null
      }
      renderItem={({ item }) => (
        <View className="mb-2">
          <SpotRow
            spot={item}
            active={item.spotId === activeSpotId}
            lastUsed={!!lastUsedId && item.spotId === lastUsedId}
            highlighted={!!highlightedId && item.spotId === highlightedId}
            onPress={onSelect}
          />
        </View>
      )}
    />
  );
}

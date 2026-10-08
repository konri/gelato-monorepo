import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cityName } from '../lib/format';
import { hasOpeningHours } from '../graphql/spots';
import type { PickerSpot } from './SpotPicker';

/**
 * Spots grouped by city as checkboxes (`multiple`) or radio buttons (one
 * spot). For staff assignment: a spot admin covers one or more spots, an
 * employee exactly one.
 */
export function SpotChecklist({
  spots,
  value,
  onChange,
  multiple = true,
  disabled = false,
  name = 'spots',
}: {
  spots: PickerSpot[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  /** Radio group name (single mode). */
  name?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const selected = new Set(value);
  const other = t('SpotPicker.other');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? spots.filter((s) => [s.name, s.address].some((f) => f.toLowerCase().includes(q)))
      : spots;
    const byCity = new Map<string, PickerSpot[]>();
    for (const s of filtered) {
      const key = s.city ? cityName(s.city) : other;
      byCity.set(key, [...(byCity.get(key) ?? []), s]);
    }
    return [...byCity.keys()]
      .sort((a, b) => a.localeCompare(b))
      .map((city) => ({ city, spots: (byCity.get(city) ?? []).sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [spots, query, other]);

  const toggle = (id: string, on: boolean) => {
    if (!multiple) onChange([id]);
    else onChange(on ? [...value.filter((v) => v !== id), id] : value.filter((v) => v !== id));
  };

  return (
    <div className="rounded-lg border border-gray-200">
      {spots.length > 6 && (
        <div className="border-b border-gray-100 p-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('SpotPicker.searchPlaceholder')}
            className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-brand"
          />
        </div>
      )}
      <div className="max-h-64 overflow-y-auto py-1">
        {groups.length === 0 && (
          <p className="px-4 py-4 text-center text-sm text-gray-400">{t('SpotPicker.noSpotsFound')}</p>
        )}
        {groups.map((group) => (
          <div key={group.city}>
            <p className="bg-gray-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {group.city}
            </p>
            {group.spots.map((s) => (
              <label
                key={s.id}
                className={`flex items-start gap-3 px-4 py-2 text-sm ${disabled ? 'opacity-60' : 'cursor-pointer hover:bg-gray-50'}`}
              >
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name={multiple ? undefined : name}
                  className="mt-0.5 accent-brand"
                  checked={selected.has(s.id)}
                  disabled={disabled}
                  onChange={(e) => toggle(s.id, e.target.checked)}
                />
                <span className="min-w-0">
                  <span className="block font-medium text-gray-900">
                    {s.name}
                    {s.isActive === false && (
                      <span className="ml-2 text-xs font-normal text-gray-400">{t(s.openingHours !== undefined && !hasOpeningHours(s.openingHours) ? 'SpotPicker.draft' : 'SpotPicker.notActive')}</span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-gray-500">{s.address}</span>
                </span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

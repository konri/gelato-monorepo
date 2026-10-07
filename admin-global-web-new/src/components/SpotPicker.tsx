import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cityName } from '../lib/format';

/** What the picker needs from a spot (AdminSpot fits). */
export type PickerSpot = {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  isActive?: boolean;
  city?: { id: string; name: string; nameLocal?: unknown } | null;
  brand?: { id: string; name: string } | null;
};

/**
 * Searchable spot selector. Filters by name / address / phone and groups by
 * city (brand scope) or by brand (platform-wide lists). `allLabel` adds an
 * "all spots" entry with the value ''.
 */
export function SpotPicker({
  spots,
  value,
  onChange,
  placeholder,
  groupBy = 'city',
  allLabel,
}: {
  spots: PickerSpot[];
  value: string;
  onChange: (spotId: string) => void;
  placeholder?: string;
  groupBy?: 'city' | 'brand';
  allLabel?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside the picker (autofocusing the search input
  // steals focus, so a button onBlur would close it immediately — use this instead).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = spots.find((s) => s.id === value) ?? null;
  const other = t('SpotPicker.other');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? spots.filter((s) => [s.name, s.address, s.phone ?? ''].some((f) => f.toLowerCase().includes(q)))
      : spots;

    const byGroup = new Map<string, PickerSpot[]>();
    for (const s of filtered) {
      const key = groupBy === 'brand' ? s.brand?.name ?? other : s.city ? cityName(s.city) : other;
      const list = byGroup.get(key) ?? [];
      list.push(s);
      byGroup.set(key, list);
    }
    return [...byGroup.keys()]
      .sort((a, b) => a.localeCompare(b))
      .map((group) => ({
        group,
        spots: [...(byGroup.get(group) ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [spots, query, groupBy, other]);

  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const secondary = (s: PickerSpot) =>
    groupBy === 'brand' && s.city ? `${cityName(s.city)} · ${s.address}` : s.address;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      >
        <span className={selected || (allLabel && !value) ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? (
            <>
              {selected.name}
              <span className="text-gray-400">
                {' · '}
                {groupBy === 'brand' ? selected.brand?.name : cityName(selected.city)}
              </span>
            </>
          ) : allLabel && !value ? (
            allLabel
          ) : (
            placeholder ?? t('SpotPicker.selectSpot')
          )}
        </span>
        <svg width="14" height="14" viewBox="0 0 12 12" className={open ? 'rotate-180' : ''} aria-hidden>
          <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('SpotPicker.searchPlaceholder')}
              className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {allLabel && !query && (
              <button
                type="button"
                onClick={() => choose('')}
                className={`flex w-full px-4 py-2 text-left text-sm font-medium hover:bg-brand-light ${
                  value === '' ? 'bg-brand-light' : ''
                }`}
              >
                {allLabel}
              </button>
            )}
            {groups.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">{t('SpotPicker.noSpotsFound')}</p>
            )}
            {groups.map((group) => (
              <div key={group.group}>
                <p className="sticky top-0 bg-gray-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {group.group}
                </p>
                {group.spots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => choose(s.id)}
                    className={`flex w-full flex-col px-4 py-2 text-left hover:bg-brand-light ${
                      s.id === value ? 'bg-brand-light' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {s.name}
                      {s.isActive === false && (
                        <span className="ml-2 text-xs font-normal text-gray-400">{t('SpotPicker.notActive')}</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">{secondary(s)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AdminSpot } from '../graphql/spots';

/**
 * Searchable, city-grouped spot selector. Filters by name / address / phone
 * and groups results under city headers (section list).
 */
export function SpotPicker({
  spots,
  value,
  onChange,
  placeholder = 'Select a spot…',
}: {
  spots: AdminSpot[];
  value: string;
  onChange: (spotId: string) => void;
  placeholder?: string;
}) {
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

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? spots.filter((s) =>
          [s.name, s.address, s.phone ?? '']
            .some((f) => f.toLowerCase().includes(q)),
        )
      : spots;

    // Group by city name; spots without a city go under "Other".
    const byCity: Record<string, AdminSpot[]> = {};
    for (const s of filtered) {
      const city = s.city?.name ?? 'Other';
      (byCity[city] ??= []).push(s);
    }
    return Object.keys(byCity)
      .sort((a, b) => a.localeCompare(b))
      .map((city) => ({
        city,
        spots: byCity[city].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [spots, query]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-4 py-2.5 text-left text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? (
            <>
              {selected.name}
              {selected.city && <span className="text-gray-400"> · {selected.city.name}</span>}
            </>
          ) : (
            placeholder
          )}
        </span>
        <svg width="14" height="14" viewBox="0 0 12 12" className={open ? 'rotate-180' : ''}>
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
              placeholder="Search name, address, phone…"
              className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {groups.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No spots found.</p>
            )}
            {groups.map((group) => (
              <div key={group.city}>
                <p className="sticky top-0 bg-gray-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {group.city}
                </p>
                {group.spots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onChange(s.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex w-full flex-col px-4 py-2 text-left hover:bg-brand-light ${
                      s.id === value ? 'bg-brand-light' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                    <span className="text-xs text-gray-500">{s.address}</span>
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

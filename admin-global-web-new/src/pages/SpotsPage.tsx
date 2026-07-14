import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import { MY_ADMIN_SPOTS, type AdminSpot } from '../graphql/spots';

export function SpotsPage() {
  const { data, loading, error } = useQuery<{ myAdminSpots: AdminSpot[] }>(MY_ADMIN_SPOTS);
  const spots = data?.myAdminSpots ?? [];

  const [cityId, setCityId] = useState<string>('');
  const [query, setQuery] = useState('');

  // Distinct cities present among the spots, for the filter chips.
  const cities = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of spots) if (s.city) map.set(s.city.id, s.city.name);
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [spots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return spots.filter((s) => {
      if (cityId && s.city?.id !== cityId) return false;
      if (!q) return true;
      return [s.name, s.address, s.phone ?? ''].some((f) => f.toLowerCase().includes(q));
    });
  }, [spots, cityId, query]);

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spots</h1>
          <p className="text-sm text-gray-500">Ice cream spots you manage</p>
        </div>
        <Link
          to="/spots/new"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Create spot
        </Link>
      </div>

      {/* Search + city filter */}
      <div className="mb-5 space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, address, or phone…"
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <FilterChip active={cityId === ''} onClick={() => setCityId('')}>
              All cities
            </FilterChip>
            {cities.map((c) => (
              <FilterChip key={c.id} active={cityId === c.id} onClick={() => setCityId(c.id)}>
                {c.name}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</div>
      )}

      {!loading && spots.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-500">No spots yet.</p>
          <Link to="/spots/new" className="mt-2 inline-block text-sm font-semibold text-brand">
            Create your first spot
          </Link>
        </div>
      )}

      {!loading && spots.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No spots match your search.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((spot) => (
          <div key={spot.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900">{spot.name}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  spot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {spot.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {spot.city && <p className="mt-0.5 text-xs font-medium text-brand">{spot.city.name}</p>}
            <p className="mt-1 text-sm text-gray-500">{spot.address}</p>
            {spot.phone && <p className="mt-1 text-xs text-gray-400">{spot.phone}</p>}
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
              <Link to={`/spots/${spot.id}/edit`} className="text-brand hover:text-brand-dark">
                Edit
              </Link>
              <Link to={`/spots/${spot.id}/invite`} className="text-brand hover:text-brand-dark">
                Invite admin
              </Link>
              <Link to={`/orders?spot=${spot.id}`} className="text-brand hover:text-brand-dark">
                Order history
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-brand text-white'
          : 'border border-gray-300 text-gray-600 hover:border-gray-400'
      }`}
    >
      {children}
    </button>
  );
}

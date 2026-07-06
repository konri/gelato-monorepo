import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import { MY_ADMIN_SPOTS, type AdminSpot } from '../graphql/spots';

export function SpotsPage() {
  const { data, loading, error } = useQuery<{ myAdminSpots: AdminSpot[] }>(
    MY_ADMIN_SPOTS,
  );
  const spots = data?.myAdminSpots ?? [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spots</h1>
          <p className="text-sm text-gray-500">
            Ice cream spots you manage
          </p>
        </div>
        <Link
          to="/spots/new"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Create spot
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {!loading && spots.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-500">No spots yet.</p>
          <Link to="/spots/new" className="mt-2 inline-block text-sm font-semibold text-brand">
            Create your first spot
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spots.map((spot) => (
          <div key={spot.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900">{spot.name}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  spot.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {spot.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{spot.address}</p>
            {spot.phone && (
              <p className="mt-1 text-xs text-gray-400">{spot.phone}</p>
            )}
            <Link
              to={`/spots/${spot.id}/invite`}
              className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Invite spot admin →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

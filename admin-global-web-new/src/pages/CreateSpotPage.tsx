import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { CITIES, CREATE_SPOT, MY_ADMIN_SPOTS, type City } from '../graphql/spots';

// Slug + short random suffix → a stable, human-ish spot id.
function makeSpotId(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || 'spot';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slug}-${suffix}`;
}

const input =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand';
const label = 'block text-sm font-medium text-gray-700 mb-1';

export function CreateSpotPage() {
  const navigate = useNavigate();
  const { data: citiesData } = useQuery<{ cities: City[] }>(CITIES);
  const [createSpot, { loading }] = useMutation(CREATE_SPOT, {
    refetchQueries: [{ query: MY_ADMIN_SPOTS }],
  });

  const [form, setForm] = useState({
    name: '',
    address: '',
    cityId: '',
    latitude: '',
    longitude: '',
    phone: '',
    description: '',
    deliveryRadiusKm: '5',
  });
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createSpot({
        variables: {
          id: makeSpotId(form.name),
          name: form.name,
          address: form.address,
          cityId: form.cityId,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          phone: form.phone,
          description: form.description || null,
          deliveryRadiusKm: parseFloat(form.deliveryRadiusKm) || 5,
        },
      });
      navigate('/spots');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create spot');
    }
  };

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/spots')}
        className="mb-4 text-sm text-gray-500 hover:text-brand"
      >
        ← Back to spots
      </button>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create spot</h1>

      {error && (
        <div className="mb-4 max-w-lg rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="max-w-lg space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className={label}>Name</label>
          <input className={input} value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className={label}>City</label>
          <select className={input} value={form.cityId} onChange={set('cityId')} required>
            <option value="">Select a city…</option>
            {citiesData?.cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Address</label>
          <input className={input} value={form.address} onChange={set('address')} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Latitude</label>
            <input className={input} type="number" step="any" value={form.latitude} onChange={set('latitude')} required />
          </div>
          <div>
            <label className={label}>Longitude</label>
            <input className={input} type="number" step="any" value={form.longitude} onChange={set('longitude')} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Phone</label>
            <input className={input} value={form.phone} onChange={set('phone')} required />
          </div>
          <div>
            <label className={label}>Delivery radius (km)</label>
            <input className={input} type="number" step="any" value={form.deliveryRadiusKm} onChange={set('deliveryRadiusKm')} />
          </div>
        </div>
        <div>
          <label className={label}>Description (optional)</label>
          <textarea className={input} rows={3} value={form.description} onChange={set('description')} />
        </div>
        <button
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Create spot'}
        </button>
      </form>
    </div>
  );
}

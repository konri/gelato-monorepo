import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CITIES,
  CREATE_SPOT,
  CREATE_CITY,
  MY_ADMIN_SPOTS,
  type City,
} from '../graphql/spots';

// Slug + short random suffix → a stable, human-ish spot id.
function makeSpotId(name: string) {
  const slug =
    name
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: citiesData, refetch: refetchCities } = useQuery<{ cities: City[] }>(CITIES);
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
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Coordinates & radius are only required when the spot delivers.
    if (deliveryEnabled && (!form.latitude || !form.longitude)) {
      setError(t('CreateSpot.latLongRequired'));
      return;
    }
    try {
      await createSpot({
        variables: {
          id: makeSpotId(form.name),
          name: form.name,
          address: form.address,
          cityId: form.cityId,
          latitude: parseFloat(form.latitude || '0'),
          longitude: parseFloat(form.longitude || '0'),
          phone: form.phone,
          description: form.description || null,
          deliveryEnabled,
          deliveryRadiusKm: deliveryEnabled ? parseFloat(form.deliveryRadiusKm) || 5 : 0,
        },
      });
      navigate('/spots');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('CreateSpot.failedCreate'));
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-6 sm:p-8">
      <button
        onClick={() => navigate('/spots')}
        className="mb-4 text-sm text-gray-500 hover:text-brand"
      >
        {t('Common.backToSpots')}
      </button>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('CreateSpot.title')}</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className={label}>{t('Common.name')}</label>
          <input className={input} value={form.name} onChange={set('name')} required />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className={label + ' mb-0'}>{t('CreateSpot.city')}</label>
            <button
              type="button"
              onClick={() => setCityModalOpen(true)}
              className="text-xs font-semibold text-brand hover:underline"
            >
              {t('CreateSpot.addCity')}
            </button>
          </div>
          <select className={input} value={form.cityId} onChange={set('cityId')} required>
            <option value="">{t('CreateSpot.selectCity')}</option>
            {citiesData?.cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>{t('Common.address')}</label>
          <input className={input} value={form.address} onChange={set('address')} required />
        </div>

        <div>
          <label className={label}>{t('Common.phone')}</label>
          <input className={input} value={form.phone} onChange={set('phone')} required />
        </div>

        {/* Delivery toggle */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm font-medium text-gray-800">{t('CreateSpot.canDeliver')}</span>
            <input
              type="checkbox"
              checked={deliveryEnabled}
              onChange={(e) => setDeliveryEnabled(e.target.checked)}
              className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-gray-300 transition-colors checked:bg-brand relative before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
            />
          </label>

          {deliveryEnabled && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>{t('Common.latitude')}</label>
                  <input
                    className={input}
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={set('latitude')}
                  />
                </div>
                <div>
                  <label className={label}>{t('Common.longitude')}</label>
                  <input
                    className={input}
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={set('longitude')}
                  />
                </div>
              </div>
              <div>
                <label className={label}>{t('CreateSpot.deliveryRadius')}</label>
                <input
                  className={input}
                  type="number"
                  step="any"
                  value={form.deliveryRadiusKm}
                  onChange={set('deliveryRadiusKm')}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className={label}>{t('CreateSpot.descriptionOptional')}</label>
          <textarea className={input} rows={3} value={form.description} onChange={set('description')} />
        </div>

        <button
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          disabled={loading}
        >
          {loading ? t('Common.creating') : t('CreateSpot.createSpot')}
        </button>
      </form>

      {cityModalOpen && (
        <CreateCityModal
          onClose={() => setCityModalOpen(false)}
          onCreated={async (newCityId) => {
            await refetchCities();
            setForm((f) => ({ ...f, cityId: newCityId }));
            setCityModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CreateCityModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (cityId: string) => void;
}) {
  const { t } = useTranslation();
  const [createCity, { loading }] = useMutation<{ createCity: { id: string } }>(CREATE_CITY);
  const [form, setForm] = useState({
    name: '',
    pl: '',
    en: '',
    ua: '',
    latitude: '',
    longitude: '',
    country: 'Poland',
  });
  const [error, setError] = useState<string | null>(null);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await createCity({
        variables: {
          name: form.name,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          nameLocal: {
            pl: form.pl || form.name,
            en: form.en || form.name,
            ua: form.ua || form.name,
          },
          country: form.country,
        },
      });
      const id = res.data?.createCity.id;
      if (id) onCreated(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('City.failedCreate'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">{t('City.addCity')}</h2>
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className={label}>{t('City.nameCanonical')}</label>
            <input className={input} value={form.name} onChange={set('name')} required placeholder="Gdansk" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={label}>PL</label>
              <input className={input} value={form.pl} onChange={set('pl')} placeholder="Gdańsk" />
            </div>
            <div>
              <label className={label}>EN</label>
              <input className={input} value={form.en} onChange={set('en')} placeholder="Gdansk" />
            </div>
            <div>
              <label className={label}>UA</label>
              <input className={input} value={form.ua} onChange={set('ua')} placeholder="Ґданськ" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>{t('Common.latitude')}</label>
              <input className={input} type="number" step="any" value={form.latitude} onChange={set('latitude')} required />
            </div>
            <div>
              <label className={label}>{t('Common.longitude')}</label>
              <input className={input} type="number" step="any" value={form.longitude} onChange={set('longitude')} required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t('Common.cancel')}
            </button>
            <button
              disabled={loading}
              className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? t('City.adding') : t('City.addCity')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

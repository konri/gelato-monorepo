import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  SPOT_DETAIL,
  UPDATE_SPOT,
  MY_ADMIN_SPOTS,
  SPOT_ADMINS,
  SET_USER_LOGIN_DISABLED,
  RESEND_ADMIN_INVITE,
  type AdminSpot,
  type SpotAdmin,
} from '../graphql/spots';

const input =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand';
const label = 'block text-sm font-medium text-gray-700 mb-1';

export function EditSpotPage() {
  const { t } = useTranslation();
  const { spotId } = useParams<{ spotId: string }>();
  const navigate = useNavigate();
  const { data, loading } = useQuery<{ spot: AdminSpot | null }>(SPOT_DETAIL, {
    variables: { id: spotId },
    fetchPolicy: 'cache-and-network',
  });
  const [updateSpot, { loading: saving }] = useMutation(UPDATE_SPOT, {
    refetchQueries: [{ query: MY_ADMIN_SPOTS }, { query: SPOT_DETAIL, variables: { id: spotId } }],
  });

  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
    deliveryRadiusKm: '',
  });
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Hydrate the form once the spot loads.
  useEffect(() => {
    const s = data?.spot;
    if (s) {
      setForm({
        name: s.name ?? '',
        description: s.description ?? '',
        address: s.address ?? '',
        phone: s.phone ?? '',
        latitude: String(s.latitude ?? ''),
        longitude: String(s.longitude ?? ''),
        deliveryRadiusKm: String(s.deliveryRadiusKm ?? ''),
      });
      setIsActive(s.isActive ?? true);
    }
  }, [data?.spot]);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await updateSpot({
        variables: {
          id: spotId,
          name: form.name,
          description: form.description || null,
          address: form.address,
          phone: form.phone,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          deliveryRadiusKm: parseFloat(form.deliveryRadiusKm) || 0,
          isActive,
        },
      });
      setNotice(t('EditSpot.spotUpdated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('EditSpot.failedUpdate'));
    }
  };

  if (loading && !data) return <div className="p-8 text-sm text-gray-500">{t('Common.loading')}</div>;
  if (!data?.spot) return <div className="p-8 text-sm text-gray-500">{t('EditSpot.spotNotFound')}</div>;

  return (
    <div className="mx-auto w-full max-w-2xl p-6 sm:p-8 lg:max-w-4xl">
      {/* Keep the form narrow/readable; the admins table below spans the full
          (wider on lg) container so it isn't clipped. */}
      <div className="lg:max-w-2xl">
      <button onClick={() => navigate('/spots')} className="mb-4 text-sm text-gray-500 hover:text-brand">
        {t('Common.backToSpots')}
      </button>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('EditSpot.title')}</h1>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      <form onSubmit={save} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className={label}>{t('Common.name')}</label>
          <input className={input} value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className={label}>{t('Common.address')}</label>
          <input className={input} value={form.address} onChange={set('address')} required />
        </div>
        <div>
          <label className={label}>{t('Common.phone')}</label>
          <input className={input} value={form.phone} onChange={set('phone')} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>{t('Common.latitude')}</label>
            <input className={input} type="number" step="any" value={form.latitude} onChange={set('latitude')} />
          </div>
          <div>
            <label className={label}>{t('Common.longitude')}</label>
            <input className={input} type="number" step="any" value={form.longitude} onChange={set('longitude')} />
          </div>
          <div>
            <label className={label}>{t('EditSpot.radius')}</label>
            <input className={input} type="number" step="any" value={form.deliveryRadiusKm} onChange={set('deliveryRadiusKm')} />
          </div>
        </div>
        <div>
          <label className={label}>{t('Common.description')}</label>
          <textarea className={input} rows={3} value={form.description} onChange={set('description')} />
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
          <span>
            <span className="block text-sm font-medium text-gray-800">{t('EditSpot.spotIsActive')}</span>
            <span className="block text-xs text-gray-500">
              {t('EditSpot.disableToHide')}
            </span>
          </span>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-gray-300 transition-colors checked:bg-brand relative before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
          />
        </label>

        <button
          disabled={saving}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? t('Common.saving') : t('EditSpot.saveChanges')}
        </button>
      </form>
      </div>

      {/* Spot admins */}
      <SpotAdminsSection spotId={spotId!} />
    </div>
  );
}

function SpotAdminsSection({ spotId }: { spotId: string }) {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ spotAdmins: SpotAdmin[] }>(SPOT_ADMINS, {
    variables: { spotId },
    fetchPolicy: 'cache-and-network',
  });
  const [setDisabled] = useMutation(SET_USER_LOGIN_DISABLED, {
    refetchQueries: [{ query: SPOT_ADMINS, variables: { spotId } }],
  });
  const [resendInvite] = useMutation(RESEND_ADMIN_INVITE);
  const [resent, setResent] = useState<Record<string, 'sending' | 'sent' | 'error'>>({});

  const resend = async (userId: string) => {
    setResent((r) => ({ ...r, [userId]: 'sending' }));
    try {
      await resendInvite({ variables: { userId } });
      setResent((r) => ({ ...r, [userId]: 'sent' }));
    } catch {
      setResent((r) => ({ ...r, [userId]: 'error' }));
    }
  };

  const admins = data?.spotAdmins ?? [];

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('EditSpot.spotAdmins')}</h2>
      <p className="mb-4 text-sm text-gray-500">
        {t('EditSpot.spotAdminsHint')}
      </p>
      {/* overflow-x-auto lets the table scroll horizontally on narrow viewports
          instead of clipping the Actions column; min-w keeps columns legible. */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3">{t('Common.name')}</th>
              <th className="px-5 py-3">{t('Common.email')}</th>
              <th className="px-5 py-3">{t('Orders.status')}</th>
              <th className="px-5 py-3 text-right">{t('EditSpot.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-gray-500">{t('Common.loading')}</td>
              </tr>
            )}
            {!loading && admins.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-gray-500">
                  {t('EditSpot.noAdminsAssigned')}
                </td>
              </tr>
            )}
            {admins.map((a) => {
              const state = resent[a.id];
              return (
                <tr key={a.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{a.name || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{a.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        a.loginDisabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {a.loginDisabled ? t('Common.disabled') : t('Common.active')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => resend(a.id)}
                        disabled={state === 'sending'}
                        className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {state === 'sending'
                          ? t('Common.sending')
                          : state === 'sent'
                            ? t('Common.codeSent')
                            : state === 'error'
                              ? t('Common.failedRetry')
                              : t('Common.resendCode')}
                      </button>
                      <button
                        onClick={() => setDisabled({ variables: { userId: a.id, disabled: !a.loginDisabled } })}
                        className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          a.loginDisabled
                            ? 'bg-brand text-white hover:bg-brand-dark'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {a.loginDisabled ? t('EditSpot.enableLogin') : t('EditSpot.disableLogin')}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

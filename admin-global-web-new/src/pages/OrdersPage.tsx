import { Fragment, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MY_ADMIN_SPOTS, type AdminSpot } from '../graphql/spots';
import { SPOT_ORDERS, type SpotOrder } from '../graphql/orders';
import { SpotPicker } from '../components/SpotPicker';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PREPARING: 'bg-amber-100 text-amber-700',
  READY: 'bg-blue-100 text-blue-700',
  COURIER_ASSIGNED: 'bg-indigo-100 text-indigo-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v);

export function OrdersPage() {
  const { t } = useTranslation();
  const { data: spotsData } = useQuery<{ myAdminSpots: AdminSpot[] }>(MY_ADMIN_SPOTS);
  const spots = spotsData?.myAdminSpots ?? [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [spotId, setSpotId] = useState<string>(searchParams.get('spot') ?? '');

  // If arriving with ?spot=id (from the Spots page), preselect it.
  useEffect(() => {
    const param = searchParams.get('spot');
    if (param && param !== spotId) setSpotId(param);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selectSpot = (id: string) => {
    setSpotId(id);
    setSearchParams(id ? { spot: id } : {}, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">{t('Orders.title')}</h1>
      <p className="mb-6 text-sm text-gray-500">{t('Orders.subtitle')}</p>

      <div className="mb-6 max-w-sm">
        <label className="mb-1 block text-sm font-medium text-gray-700">{t('Orders.spot')}</label>
        <SpotPicker spots={spots} value={spotId} onChange={selectSpot} />
      </div>

      {spotId ? <OrderList spotId={spotId} /> : (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          {t('Orders.selectSpotToView')}
        </div>
      )}
    </div>
  );
}

function OrderList({ spotId }: { spotId: string }) {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery<{ spotOrders: SpotOrder[] }>(SPOT_ORDERS, {
    variables: { spotId },
    fetchPolicy: 'cache-and-network',
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  // Fall back to the raw status if the backend ever sends one we don't map.
  const statusLabel = (status: string) =>
    t(`Orders.statuses.${status}`, { defaultValue: status });

  if (loading && !data) return <p className="text-sm text-gray-500">{t('Common.loading')}</p>;
  if (error)
    return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</div>;

  const orders = [...(data?.spotOrders ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (orders.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
        {t('Orders.noOrdersYet')}
      </div>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-5 py-3">{t('Orders.order')}</th>
            <th className="px-5 py-3">{t('Orders.customer')}</th>
            <th className="px-5 py-3">{t('Orders.status')}</th>
            <th className="px-5 py-3">{t('Orders.courier')}</th>
            <th className="px-5 py-3">{t('Orders.total')}</th>
            <th className="px-5 py-3">{t('Orders.placed')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((o) => (
            <Fragment key={o.id}>
              <tr
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              >
                <td className="px-5 py-3 font-medium text-gray-900">{o.orderNumber}</td>
                <td className="px-5 py-3 text-gray-600">
                  {o.customerName || '—'}
                  {o.customerPhone && (
                    <span className="block text-xs text-gray-400">{o.customerPhone}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLE[o.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {statusLabel(o.status)}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">{o.courierName || '—'}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{fmtMoney(o.total)}</td>
                <td className="px-5 py-3 text-gray-500">{fmtDate(o.createdAt)}</td>
              </tr>
              {expanded === o.id && (
                <tr className="bg-gray-50/60">
                  <td colSpan={6} className="px-5 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-gray-400">{t('Orders.delivery')}</p>
                        <p className="text-sm text-gray-700">{o.deliveryAddress}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {t('Orders.payment', { status: o.paymentStatus })}
                          {o.deliveredAt && ` · ${t('Orders.deliveredAt', { date: fmtDate(o.deliveredAt) })}`}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-gray-400">{t('Orders.items')}</p>
                        <ul className="space-y-1 text-sm text-gray-700">
                          {o.items.map((it) => (
                            <li key={it.id} className="flex justify-between">
                              <span>
                                {it.quantity}× {it.tasteId ? t('Orders.iceCream') : it.productId ? t('Orders.product') : t('Orders.item')}
                              </span>
                              <span className="text-gray-500">{fmtMoney(it.total)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-sm">
                          <span className="text-gray-500">
                            {t('Orders.breakdown', {
                              subtotal: fmtMoney(o.subtotal),
                              delivery: fmtMoney(o.deliveryFee),
                            })}
                          </span>
                          <span className="font-semibold text-gray-900">{fmtMoney(o.total)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import {
  SPOT_PAYOUT_SUMMARIES,
  SPOT_PAYOUT_HISTORY,
  CREATE_SPOT_PAYOUT,
  type SpotPayoutSummary,
  type SpotPayout,
} from '../graphql/payouts';

const currency = (n: number) => `${n.toFixed(2)} zł`;

export function PayoutsPage() {
  const { t } = useTranslation();
  const { data, loading, refetch } = useQuery<{ spotPayoutSummaries: SpotPayoutSummary[] }>(
    SPOT_PAYOUT_SUMMARIES,
  );
  const [createPayout, { loading: paying }] = useMutation(CREATE_SPOT_PAYOUT);
  const [historySpotId, setHistorySpotId] = useState<string | null>(null);
  const [confirmSpot, setConfirmSpot] = useState<SpotPayoutSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summaries = data?.spotPayoutSummaries ?? [];
  const totalOwed = summaries.reduce((sum, s) => sum + s.amountOwed, 0);

  const markPaid = async (spot: SpotPayoutSummary) => {
    setError(null);
    try {
      await createPayout({ variables: { spotId: spot.spotId } });
      setConfirmSpot(null);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Payouts.failed'));
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-6 sm:p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">{t('Payouts.title')}</h1>
      <p className="mb-6 text-sm text-gray-500">{t('Payouts.subtitle')}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">{t('Payouts.totalOwed')}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{currency(totalOwed)}</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t('Common.loading')}</p>
      ) : summaries.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          {t('Payouts.none')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">{t('Payouts.spot')}</th>
                <th className="px-4 py-3">{t('Payouts.orders')}</th>
                <th className="px-4 py-3">{t('Payouts.amountOwed')}</th>
                <th className="px-4 py-3">{t('Payouts.since')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaries.map((s) => (
                <tr key={s.spotId}>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.spotName}</td>
                  <td className="px-4 py-3 text-gray-600">{s.orderCount}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {currency(s.amountOwed)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.oldestUnpaidOrderAt
                      ? new Date(s.oldestUnpaidOrderAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setHistorySpotId(s.spotId)}
                      className="mr-3 text-xs font-semibold text-brand hover:underline"
                    >
                      {t('Payouts.history')}
                    </button>
                    <button
                      onClick={() => setConfirmSpot(s)}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      {t('Payouts.markPaid')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmSpot && (
        <ConfirmPayoutModal
          spot={confirmSpot}
          paying={paying}
          onCancel={() => setConfirmSpot(null)}
          onConfirm={() => markPaid(confirmSpot)}
        />
      )}

      {historySpotId && (
        <PayoutHistoryModal spotId={historySpotId} onClose={() => setHistorySpotId(null)} />
      )}
    </div>
  );
}

function ConfirmPayoutModal({
  spot,
  paying,
  onCancel,
  onConfirm,
}: {
  spot: SpotPayoutSummary;
  paying: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-bold text-gray-900">{t('Payouts.confirmTitle')}</h2>
        <p className="mb-6 text-sm text-gray-600">
          {t('Payouts.confirmBody', {
            spot: spot.spotName,
            amount: currency(spot.amountOwed),
            count: spot.orderCount,
          })}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {t('Common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={paying}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {paying ? t('Payouts.paying') : t('Payouts.markPaid')}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayoutHistoryModal({ spotId, onClose }: { spotId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ spotPayoutHistory: SpotPayout[] }>(SPOT_PAYOUT_HISTORY, {
    variables: { spotId },
  });
  const history = data?.spotPayoutHistory ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">{t('Payouts.historyTitle')}</h2>
        {loading ? (
          <p className="text-sm text-gray-500">{t('Common.loading')}</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500">{t('Payouts.noHistory')}</p>
        ) : (
          <ul className="max-h-80 space-y-3 overflow-y-auto">
            {history.map((p) => (
              <li key={p.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{currency(p.amount)}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(p.paidAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t('Payouts.ordersCount', { count: p.orderCount })}
                </p>
                {p.note && <p className="mt-1 text-xs text-gray-600">{p.note}</p>}
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          {t('Common.close')}
        </button>
      </div>
    </div>
  );
}

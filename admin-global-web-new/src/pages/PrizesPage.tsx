import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  PRIZES,
  CREATE_PRIZE,
  UPDATE_PRIZE,
  DELETE_PRIZE,
  type Prize,
} from '../graphql/prizes';
import { API_ORIGIN, ACCESS_TOKEN_KEY } from '../lib/config';

const input =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand';
const label = 'block text-sm font-medium text-gray-700 mb-1';

async function uploadPrizeImage(prizeId: string, file: File): Promise<string> {
  const body = new FormData();
  body.append('image', file);
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const res = await fetch(`${API_ORIGIN}/upload/prize/${prizeId}`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Image upload failed');
  }
  const data = await res.json();
  return data.imageUrl;
}

export function PrizesPage() {
  const { data, loading } = useQuery<{ prizes: Prize[] }>(PRIZES, {
    fetchPolicy: 'cache-and-network',
  });
  const [editing, setEditing] = useState<Prize | null>(null);
  const [creating, setCreating] = useState(false);

  const prizes = data?.prizes ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
          <p className="text-sm text-gray-500">Create and manage prizes clients redeem with points.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Create prize
        </button>
      </div>

      {loading && !data && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prizes.map((p) => (
          <PrizeCard key={p.id} prize={p} onEdit={() => setEditing(p)} />
        ))}
        {!loading && prizes.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            No prizes yet.
          </div>
        )}
      </div>

      {(creating || editing) && (
        <PrizeModal
          prize={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function PrizeCard({ prize, onEdit }: { prize: Prize; onEdit: () => void }) {
  const [updatePrize] = useMutation(UPDATE_PRIZE, { refetchQueries: [{ query: PRIZES }] });

  const toggle = () =>
    updatePrize({ variables: { id: prize.id, isActive: !prize.isActive } });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="relative h-36 bg-gray-100">
        {prize.imageUrl ? (
          <img src={prize.imageUrl} alt={prize.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">🎁</div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
            prize.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {prize.isActive ? 'Active' : 'Disabled'}
        </span>
      </div>
      <div className="p-4">
        <p className="font-semibold text-gray-900">{prize.title}</p>
        <p className="mt-0.5 text-sm text-brand">{prize.pointsCost} pts</p>
        <p className="mt-1 text-xs text-gray-500">
          {prize.quantity != null ? `${prize.claimed}/${prize.quantity} claimed` : `${prize.claimed} claimed`}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={toggle}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
              prize.isActive
                ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-brand text-white hover:bg-brand-dark'
            }`}
          >
            {prize.isActive ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PrizeModal({ prize, onClose }: { prize: Prize | null; onClose: () => void }) {
  const isEdit = !!prize;
  const [createPrize] = useMutation<{ createPrize: { id: string } }>(CREATE_PRIZE);
  const [updatePrize] = useMutation(UPDATE_PRIZE);
  const [deletePrize] = useMutation(DELETE_PRIZE, { refetchQueries: [{ query: PRIZES }] });
  const refetch = { refetchQueries: [{ query: PRIZES }] };

  const [form, setForm] = useState({
    title: prize?.title ?? '',
    description: prize?.description ?? '',
    pointsCost: String(prize?.pointsCost ?? ''),
    quantity: prize?.quantity != null ? String(prize.quantity) : '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const vars = {
        title: form.title,
        description: form.description || null,
        pointsCost: parseInt(form.pointsCost, 10),
        quantity: form.quantity ? parseInt(form.quantity, 10) : null,
      };
      let prizeId = prize?.id;
      if (isEdit) {
        await updatePrize({ variables: { id: prizeId, ...vars }, ...refetch });
      } else {
        const res = await createPrize({ variables: { ...vars, isActive: true }, ...refetch });
        prizeId = res.data?.createPrize.id;
      }
      // Upload image after we have a prize id.
      if (file && prizeId) {
        await uploadPrizeImage(prizeId, file);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prize');
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!prize) return;
    if (!confirm(`Delete "${prize.title}"?`)) return;
    setBusy(true);
    try {
      await deletePrize({ variables: { id: prize.id } });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {isEdit ? 'Edit prize' : 'Create prize'}
        </h2>
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className={label}>Title</label>
            <input
              className={input}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea
              className={input}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Points cost</label>
              <input
                className={input}
                type="number"
                value={form.pointsCost}
                onChange={(e) => setForm((f) => ({ ...f, pointsCost: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={label}>Quantity (blank = ∞)</label>
              <input
                className={input}
                type="number"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className={label}>Photo</label>
            {prize?.imageUrl && !file && (
              <img src={prize.imageUrl} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={busy}
              className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? 'Saving…' : isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  ADMIN_ACCOUNTS,
  CREATE_ADMIN_ACCOUNT,
  type AdminAccount,
} from '../graphql/admin';
import { RESEND_ADMIN_INVITE } from '../graphql/spots';

const input =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand';
const label = 'block text-sm font-medium text-gray-700 mb-1';

const ROLES = ['SUPER_ADMIN', 'SPOTS_ADMIN'];

export function AdminsPage() {
  const { data, loading } = useQuery<{ adminAccounts: AdminAccount[] }>(ADMIN_ACCOUNTS);
  const [createAdmin, { loading: creating }] = useMutation(CREATE_ADMIN_ACCOUNT, {
    refetchQueries: [{ query: ADMIN_ACCOUNTS }],
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

  const [form, setForm] = useState({ email: '', name: '', role: 'SUPER_ADMIN' });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await createAdmin({ variables: form });
      setNotice(`Admin account created for ${form.email}. An invite email was sent.`);
      setForm({ email: '', name: '', role: 'SUPER_ADMIN' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin');
    }
  };

  const admins = data?.adminAccounts ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl p-6 sm:p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Admins</h1>
      <p className="mb-6 text-sm text-gray-500">Manage admin accounts.</p>

      {/* Create form */}
      <form onSubmit={submit} className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Create admin account</h2>
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
        )}
        {notice && (
          <div className="mb-3 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">{notice}</div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>Name</label>
            <input
              className={input}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className={label}>Email</label>
            <input
              className={input}
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className={label}>Role</label>
            <select
              className={input}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          disabled={creating}
          className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create admin'}
        </button>
      </form>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Roles</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && admins.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-gray-500">
                  No admins yet.
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
                    <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand">
                      {a.roles.join(', ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => resend(a.id)}
                      disabled={state === 'sending'}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {state === 'sending'
                        ? 'Sending…'
                        : state === 'sent'
                          ? 'Code sent ✓'
                          : state === 'error'
                            ? 'Failed — retry'
                            : 'Resend code'}
                    </button>
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

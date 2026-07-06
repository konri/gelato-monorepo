import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useNavigate, useParams } from 'react-router-dom';
import { INVITE_SPOT_ADMIN } from '../graphql/spots';

const input =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand';
const label = 'block text-sm font-medium text-gray-700 mb-1';

export function InviteSpotAdminPage() {
  const { spotId } = useParams<{ spotId: string }>();
  const navigate = useNavigate();
  const [invite, { loading }] = useMutation(INVITE_SPOT_ADMIN);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await invite({ variables: { spotId, email, name } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite');
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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Invite spot admin</h1>

      {done ? (
        <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Invitation sent. {name} will receive an email with a code to set their password.
          </div>
          <button
            onClick={() => navigate('/spots')}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="max-w-lg space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className={label}>Full name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className={label}>Email</label>
            <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Sending…' : 'Send invitation'}
          </button>
        </form>
      )}
    </div>
  );
}

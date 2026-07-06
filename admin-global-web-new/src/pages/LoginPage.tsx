import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { adminForgotPassword, adminResetPassword } from '../lib/authApi';

type Mode = 'login' | 'forgot' | 'reset';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) return setError(res.error || 'Login failed');
    navigate('/spots', { replace: true });
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await adminForgotPassword(email);
    setLoading(false);
    setNotice('If the account exists, a reset code was emailed.');
    setMode('reset');
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await adminResetPassword(email, code, newPassword);
    setLoading(false);
    if (!res.ok) return setError(res.error || 'Reset failed');
    setNotice('Password updated. You can sign in now.');
    setMode('login');
    setPassword('');
  };

  const input =
    'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand';
  const btn =
    'w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            G
          </div>
          <h1 className="text-xl font-bold text-gray-900">Gelato Admin</h1>
          <p className="text-sm text-gray-500">
            {mode === 'login'
              ? 'Sign in to manage spots'
              : mode === 'forgot'
              ? 'Reset your password'
              : 'Enter the code from your email'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {notice}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={submitLogin} className="space-y-3">
            <input
              className={input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className={btn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-gray-500 hover:text-brand"
              onClick={() => {
                setMode('forgot');
                setError(null);
                setNotice(null);
              }}
            >
              Forgot password?
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={submitForgot} className="space-y-3">
            <input
              className={input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className={btn} disabled={loading}>
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-gray-500 hover:text-brand"
              onClick={() => setMode('login')}
            >
              Back to sign in
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={submitReset} className="space-y-3">
            <input
              className={input}
              type="text"
              placeholder="Reset code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <input
              className={input}
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button className={btn} disabled={loading}>
              {loading ? 'Updating…' : 'Set new password'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-gray-500 hover:text-brand"
              onClick={() => setMode('login')}
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

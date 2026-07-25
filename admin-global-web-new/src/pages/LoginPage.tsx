import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { adminForgotPassword, adminResetPassword } from '../lib/authApi';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

type Mode = 'login' | 'forgot' | 'reset';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // An invite email links here with ?mode=reset&email=… so the new admin
  // lands directly on the set-password form (they already have their code).
  const paramMode = searchParams.get('mode');
  const [mode, setMode] = useState<Mode>(paramMode === 'reset' ? 'reset' : 'login');

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
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
    if (!res.ok) return setError(res.error || t('Login.loginFailed'));
    navigate('/spots', { replace: true });
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await adminForgotPassword(email);
    setLoading(false);
    setNotice(t('Login.resetCodeEmailed'));
    setMode('reset');
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await adminResetPassword(email, code, newPassword);
    setLoading(false);
    if (!res.ok) return setError(res.error || t('Login.resetFailed'));
    setNotice(t('Login.passwordUpdated'));
    setMode('login');
    setPassword('');
  };

  const input =
    'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand';
  const btn =
    'w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            G
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t('Login.title')}</h1>
          <p className="text-sm text-gray-500">
            {mode === 'login'
              ? t('Login.signInToManage')
              : mode === 'forgot'
              ? t('Login.resetYourPassword')
              : t('Login.enterCodeSetPassword')}
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
              placeholder={t('Login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={input}
              type="password"
              placeholder={t('Login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className={btn} disabled={loading}>
              {loading ? t('Login.signingIn') : t('Login.signIn')}
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
              {t('Login.forgotPassword')}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={submitForgot} className="space-y-3">
            <input
              className={input}
              type="email"
              placeholder={t('Login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className={btn} disabled={loading}>
              {loading ? t('Common.sending') : t('Login.sendResetCode')}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-gray-500 hover:text-brand"
              onClick={() => setMode('login')}
            >
              {t('Login.backToSignIn')}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={submitReset} className="space-y-3">
            <input
              className={input}
              type="email"
              placeholder={t('Login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={input}
              type="text"
              placeholder={t('Login.codeFromEmail')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <input
              className={input}
              type="password"
              placeholder={t('Login.newPassword')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button className={btn} disabled={loading}>
              {loading ? t('Login.updating') : t('Login.setNewPassword')}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-gray-500 hover:text-brand"
              onClick={() => setMode('login')}
            >
              {t('Login.backToSignIn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

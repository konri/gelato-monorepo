import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { homeFor } from '../auth/scope';
import { adminForgotPassword, adminResetPassword, type AuthFailure } from '../lib/authApi';
import { passwordProblems } from '../lib/constants';
import { codeText } from '../lib/errors';
import { AuthShell } from '../components/AuthShell';
import { PasswordRules } from '../components/PasswordRules';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';

type Mode = 'login' | 'forgot' | 'reset';

export function LoginPage() {
  const { t } = useTranslation();
  const { login, status, user, scope } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // An invite email links here with ?mode=reset&email=… so the new admin
  // lands directly on the set-password form (they already have their code).
  const paramMode = searchParams.get('mode');
  const [mode, setMode] = useState<Mode>(paramMode === 'reset' ? 'reset' : 'login');

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(
    searchParams.get('reason') === 'no_membership' ? t('Errors.NO_MEMBERSHIP') : null,
  );
  // The session-ended note is informational; reset / update notes are successes.
  const [info, setInfo] = useState<string | null>(
    searchParams.get('expired') === '1' ? t('Errors.SESSION_EXPIRED') : null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated' && user) {
    return <Navigate to={homeFor(scope)} replace />;
  }

  const failureText = (failure: AuthFailure, fallbackKey: string) => {
    if (failure.code === 'RATE_LIMITED' && failure.retryAfter) {
      return t('Errors.RATE_LIMITED_WAIT', { minutes: Math.max(1, Math.ceil(failure.retryAfter / 60)) });
    }
    return codeText(failure.code) ?? failure.error ?? t(fallbackKey);
  };

  const resetMessages = () => {
    setError(null);
    setNotice(null);
    setInfo(null);
    setNeedsReload(false);
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (res.ok) {
      const from = (location.state as { from?: string } | null)?.from;
      const home = homeFor(res.user.staffKind);
      navigate(from && from !== '/login' && from !== '/' ? from : home, { replace: true });
      return;
    }
    if (res.code === 'USE_SPOT_APP') {
      navigate('/use-spot-app', { replace: true, state: { name: res.name ?? '' } });
      return;
    }
    if (res.code === 'UPGRADE_REQUIRED') setNeedsReload(true);
    setError(failureText(res, 'Login.loginFailed'));
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const res = await adminForgotPassword(email.trim());
    setLoading(false);
    if (!res.ok && (res.code === 'RATE_LIMITED' || res.code === 'NETWORK')) {
      setError(failureText(res, 'Login.resetFailed'));
      return;
    }
    setNotice(t('Login.resetCodeEmailed'));
    setMode('reset');
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (passwordProblems(newPassword).length > 0) {
      setError(t('Errors.PASSWORD_WEAK'));
      return;
    }
    setLoading(true);
    const res = await adminResetPassword(email.trim(), code.trim(), newPassword);
    setLoading(false);
    if (!res.ok) {
      if (res.code === 'UPGRADE_REQUIRED') setNeedsReload(true);
      setError(failureText(res, 'Login.resetFailed'));
      return;
    }
    setNotice(t('Login.passwordUpdated'));
    setMode('login');
    setPassword('');
    setCode('');
    setNewPassword('');
  };

  return (
    <AuthShell
      title={t('Login.title')}
      subtitle={
        mode === 'login'
          ? t('Login.signInToManage')
          : mode === 'forgot'
            ? t('Login.resetYourPassword')
            : t('Login.enterCodeSetPassword')
      }
    >
      {error && (
        <Alert
          tone="error"
          className="mb-4"
          action={
            needsReload ? (
              <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                {t('Upgrade.reload')}
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}
      {info && <Alert tone="info" className="mb-4">{info}</Alert>}
      {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}

      {mode === 'login' && (
        <form onSubmit={submitLogin} className="space-y-3">
          <Input
            type="email"
            autoComplete="username"
            placeholder={t('Login.emailPlaceholder')}
            aria-label={t('Login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            autoComplete="current-password"
            placeholder={t('Login.passwordPlaceholder')}
            aria-label={t('Login.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" loading={loading} loadingText={t('Login.signingIn')}>
            {t('Login.signIn')}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-gray-500 hover:text-brand"
            onClick={() => {
              setMode('forgot');
              resetMessages();
            }}
          >
            {t('Login.forgotPassword')}
          </button>
        </form>
      )}

      {mode === 'forgot' && (
        <form onSubmit={submitForgot} className="space-y-3">
          <Input
            type="email"
            autoComplete="username"
            placeholder={t('Login.emailPlaceholder')}
            aria-label={t('Login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" loading={loading} loadingText={t('Common.sending')}>
            {t('Login.sendResetCode')}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-gray-500 hover:text-brand"
            onClick={() => {
              setMode('login');
              resetMessages();
            }}
          >
            {t('Login.backToSignIn')}
          </button>
        </form>
      )}

      {mode === 'reset' && (
        <form onSubmit={submitReset} className="space-y-3">
          <Input
            type="email"
            autoComplete="username"
            placeholder={t('Login.emailPlaceholder')}
            aria-label={t('Login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t('Login.codeFromEmail')}
            aria-label={t('Login.codeFromEmail')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Input
            type="password"
            autoComplete="new-password"
            placeholder={t('Login.newPassword')}
            aria-label={t('Login.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <PasswordRules password={newPassword} />
          <Button type="submit" className="w-full" loading={loading} loadingText={t('Login.updating')}>
            {t('Login.setNewPassword')}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-gray-500 hover:text-brand"
            onClick={() => {
              setMode('login');
              resetMessages();
            }}
          >
            {t('Login.backToSignIn')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

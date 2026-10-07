import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { homeFor } from '../auth/scope';
import { passwordProblems } from '../lib/constants';
import { codeText } from '../lib/errors';
import { AuthShell } from '../components/AuthShell';
import { PasswordRules } from '../components/PasswordRules';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';

/**
 * Change password (BRANDS_SPEC §3.1). Required while the session is
 * restricted (mustChangePassword); the server then ends the old session, so
 * the console signs in again with the new password.
 */
export function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mustChangePassword, changePassword, logout, scope } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (passwordProblems(next).length > 0) {
      setError(t('Errors.PASSWORD_WEAK'));
      return;
    }
    if (next !== confirm) {
      setError(t('ChangePassword.mismatch'));
      return;
    }
    if (next === current) {
      setError(t('Errors.PASSWORD_SAME'));
      return;
    }
    setBusy(true);
    const result = await changePassword(current, next);
    setBusy(false);
    if (!result.ok) {
      if (result.code === 'INVALID_CREDENTIALS') setError(t('ChangePassword.currentIncorrect'));
      else setError(codeText(result.code) ?? result.error ?? t('Errors.UNKNOWN'));
      return;
    }
    navigate(homeFor(scope), { replace: true, state: { notice: t('ChangePassword.changed') } });
  };

  return (
    <AuthShell
      title={mustChangePassword ? t('ChangePassword.titleRequired') : t('ChangePassword.title')}
      subtitle={mustChangePassword ? t('ChangePassword.subtitleRequired') : undefined}
    >
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      <form onSubmit={submit} className="space-y-3">
        <Field label={t('ChangePassword.current')}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          )}
        </Field>
        <Field label={t('ChangePassword.new')}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
          )}
        </Field>
        <PasswordRules password={next} />
        <Field label={t('ChangePassword.confirm')}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          )}
        </Field>
        <Button type="submit" className="w-full" loading={busy} loadingText={t('Login.updating')}>
          {t('ChangePassword.submit')}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        {mustChangePassword ? (
          <button type="button" className="text-gray-500 hover:text-brand" onClick={() => logout()}>
            {t('Nav.signOut')}
          </button>
        ) : (
          <Link to={homeFor(scope)} className="text-gray-500 hover:text-brand">
            {t('Common.cancel')}
          </Link>
        )}
      </div>
    </AuthShell>
  );
}

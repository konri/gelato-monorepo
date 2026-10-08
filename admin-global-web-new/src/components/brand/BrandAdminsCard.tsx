import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { useBrandScope } from '../../brand/BrandScope';
import { INVITE_BRAND_ADMIN } from '../../graphql/brands';
import {
  BRAND_STAFF,
  REMOVE_STAFF_MEMBER,
  RESEND_ADMIN_INVITE,
  SET_STAFF_LOGIN_DISABLED,
  type StaffMember,
} from '../../graphql/staff';
import { errorCode, errorText } from '../../lib/errors';
import { STAFF_LANGUAGES, staffLanguageFor, type StaffLanguage } from '../../lib/constants';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { modalActionsClass } from '../ui/modalActions';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Field, Input, Select } from '../ui/Field';

/** PLATFORM only: the brand's admins, invites and access (BRANDS_SPEC §3.3). */
export function BrandAdminsCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { brandId, brand } = useBrandScope();
  const { data, loading, error } = useQuery<{ brandStaff: StaffMember[] }>(BRAND_STAFF, {
    variables: { brandId, kind: 'BRAND_ADMIN' },
    fetchPolicy: 'cache-and-network',
  });
  const refetch = { refetchQueries: ['BrandStaff', 'AdminBrand'] };
  const [resend] = useMutation(RESEND_ADMIN_INVITE);
  const [setDisabled] = useMutation(SET_STAFF_LOGIN_DISABLED, refetch);
  const [remove, { loading: removing }] = useMutation(REMOVE_STAFF_MEMBER, refetch);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [rowState, setRowState] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const admins = data?.brandStaff ?? [];

  const run = async (id: string, label: string, action: () => Promise<unknown>) => {
    setRowError(null);
    setRowState((s) => ({ ...s, [id]: label }));
    try {
      await action();
      setRowState((s) => ({ ...s, [id]: label === 'resend' ? 'sent' : '' }));
    } catch (err) {
      setRowState((s) => ({ ...s, [id]: '' }));
      setRowError(errorText(err));
    }
  };

  return (
    <Card
      title={t('BrandAdmins.title')}
      description={t('BrandAdmins.subtitle', { brand: brand.name })}
      actions={
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          {t('BrandAdmins.invite')}
        </Button>
      }
    >
      {error && <Alert tone="error" className="mb-3">{errorText(error)}</Alert>}
      {rowError && <Alert tone="error" className="mb-3">{rowError}</Alert>}
      {loading && !data ? (
        <p className="text-sm text-gray-500">{t('Common.loading')}</p>
      ) : admins.length === 0 ? (
        <p className="text-sm text-gray-500">{t('BrandAdmins.empty')}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {admins.map((a) => {
            const state = rowState[a.id];
            const self = a.id === user?.id;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{a.name || a.email}</p>
                  <p className="truncate text-xs text-gray-500">{a.email}</p>
                </div>
                {a.loginDisabled ? (
                  <Badge tone="red">{t('StaffStatus.disabled')}</Badge>
                ) : a.invitePending ? (
                  <Badge tone="amber">{t('StaffStatus.pending')}</Badge>
                ) : (
                  <Badge tone="green">{t('StaffStatus.active')}</Badge>
                )}
                {!self && (
                  <div className="flex flex-wrap gap-2">
                    {/* Resending only makes sense while the invite is still pending. */}
                    {a.invitePending && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!!state && state !== 'sent'}
                        onClick={() => void run(a.id, 'resend', () => resend({ variables: { userId: a.id } }))}
                      >
                        {state === 'resend' ? t('Common.sending') : state === 'sent' ? t('Common.codeSent') : t('Common.resendCode')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!!state && state !== 'sent'}
                      onClick={() =>
                        void run(a.id, 'disable', () =>
                          setDisabled({ variables: { userId: a.id, disabled: !a.loginDisabled } }),
                        )
                      }
                    >
                      {a.loginDisabled ? t('Staff.enableLogin') : t('Staff.disableLogin')}
                    </Button>
                    <Button
                      size="sm"
                      variant="dangerOutline"
                      onClick={() => {
                        setRemoveError(null);
                        setRemoveTarget(a);
                      }}
                    >
                      {t('Staff.remove')}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {inviteOpen && <InviteBrandAdminModal onClose={() => setInviteOpen(false)} />}
      {removeTarget && (
        <ConfirmDialog
          title={t('Staff.removeTitle', { name: removeTarget.name || removeTarget.email })}
          body={t('BrandAdmins.removeBody', { brand: brand.name })}
          confirmLabel={t('Staff.remove')}
          tone="danger"
          busy={removing}
          error={removeError}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={async () => {
            setRemoveError(null);
            try {
              await remove({ variables: { userId: removeTarget.id } });
              setRemoveTarget(null);
            } catch (err) {
              setRemoveError(errorText(err));
            }
          }}
        />
      )}
    </Card>
  );
}

function InviteBrandAdminModal({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { brandId, brand } = useBrandScope();
  const [invite, { loading }] = useMutation(INVITE_BRAND_ADMIN, { refetchQueries: ['BrandStaff', 'AdminBrand'] });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<StaffLanguage>(staffLanguageFor(i18n.language));
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailError(t('BrandForm.adminEmailInvalid'));
      return;
    }
    try {
      await invite({ variables: { brandId, name: name.trim(), email: email.trim().toLowerCase(), language } });
      setDone(email.trim().toLowerCase());
    } catch (err) {
      if (errorCode(err) === 'STAFF_CONFLICT') setEmailError(errorText(err));
      else setError(errorText(err));
    }
  };

  return (
    <Modal title={t('BrandAdmins.inviteTitle', { brand: brand.name })} onClose={onClose} busy={loading}>
      {done ? (
        <div className="space-y-4">
          <Alert tone="success">{t('BrandAdmins.invited', { email: done })}</Alert>
          <Button className="w-full" onClick={onClose}>
            {t('Common.done')}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {error && <Alert tone="error">{error}</Alert>}
          <Field label={t('Common.fullName')}>
            {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}
          </Field>
          <Field label={t('Common.email')} error={emailError}>
            {(id, invalid) => (
              <Input id={id} type="email" invalid={invalid} value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
          </Field>
          <Field label={t('BrandForm.adminLanguage')} hint={t('BrandForm.adminLanguageHint')}>
            {(id) => (
              <Select id={id} value={language} onChange={(e) => setLanguage(e.target.value as StaffLanguage)}>
                {STAFF_LANGUAGES.map((lng) => (
                  <option key={lng} value={lng}>
                    {t(`Language.${lng.toLowerCase()}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className={modalActionsClass}>
            <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
              {t('Common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" loading={loading} loadingText={t('Common.sending')}>
              {t('BrandAdmins.sendInvite')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

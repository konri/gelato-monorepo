import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { INVITE_STAFF, type StaffMember } from '../../graphql/staff';
import type { AdminSpot } from '../../graphql/spots';
import type { StaffKind } from '../../lib/authApi';
import { evictRoot } from '../../lib/cachePolicies';
import { errorCode, errorField, errorText } from '../../lib/errors';
import { STAFF_LANGUAGES, passwordProblems, staffLanguageFor, type StaffLanguage } from '../../lib/constants';
import { SpotChecklist } from '../SpotChecklist';
import { PasswordRules } from '../PasswordRules';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Field, Input, Select } from '../ui/Field';

type InviteKind = Extract<StaffKind, 'SPOT_ADMIN' | 'EMPLOYEE'>;
type Mode = 'code' | 'password';
type Errors = Partial<Record<'spots' | 'name' | 'email' | 'password', string>>;
type Outcome = { tone: 'success' | 'info'; title: string; body?: string };

/** An existing account is at least this old when inviteStaff re-attached it. */
const EXISTING_ACCOUNT_MS = 10 * 60 * 1000;
const NAME_MAX = 100;

/**
 * Invite a spot admin (one or more spots) or an employee (one spot)
 * (BRANDS_SPEC §3.3, §2.5): role cards, spots, name, email, email language,
 * and an emailed code (default) or a password handed over in person.
 */
export function InviteStaffModal({
  brandId,
  brandName,
  spots,
  members,
  initialSpotId,
  onClose,
}: {
  brandId: string;
  brandName: string;
  /** Every spot of the brand (drafts included). */
  spots: AdminSpot[];
  /** The brand's current staff, to tell "access added" from a new invite. */
  members: StaffMember[];
  initialSpotId?: string | null;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const preselected = initialSpotId && spots.some((s) => s.id === initialSpotId) ? [initialSpotId] : [];
  const [kind, setKind] = useState<InviteKind>('EMPLOYEE');
  const [spotIds, setSpotIds] = useState<string[]>(preselected);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<StaffLanguage>(staffLanguageFor(i18n.language));
  const [mode, setMode] = useState<Mode>('code');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [invite, { loading }] = useMutation<{ inviteStaff: StaffMember }>(INVITE_STAFF, {
    update: (cache) => evictRoot(cache, ['brandStaff']),
    refetchQueries: ['AdminBrand'],
  });

  const spotName = (id: string) => spots.find((s) => s.id === id)?.name ?? id;

  const chooseKind = (next: InviteKind) => {
    setKind(next);
    // An employee works at exactly one spot.
    if (next === 'EMPLOYEE' && spotIds.length > 1) setSpotIds(spotIds.slice(0, 1));
  };

  const validate = (): Errors => {
    const errs: Errors = {};
    if (kind === 'SPOT_ADMIN' && spotIds.length === 0) errs.spots = t('Staff.errSpotsMany');
    if (kind === 'EMPLOYEE' && spotIds.length !== 1) errs.spots = t('Staff.errSpotOne');
    if (!name.trim()) errs.name = t('Staff.errName');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = t('Staff.errEmail');
    if (mode === 'password' && passwordProblems(password).length > 0) errs.password = t('Errors.PASSWORD_WEAK');
    return errs;
  };

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrors({});
    setError(null);
    setOutcome(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const normalizedEmail = email.trim().toLowerCase();
    const before = members.find((m) => m.email.toLowerCase() === normalizedEmail) ?? null;
    const startedAt = Date.now();
    try {
      const res = await invite({
        variables: {
          input: {
            brandId,
            kind,
            spotIds,
            name: name.trim(),
            email: normalizedEmail,
            language,
            ...(mode === 'password' ? { password } : {}),
          },
        },
      });
      const member = res.data?.inviteStaff;
      if (before?.kind === 'SPOT_ADMIN' && kind === 'SPOT_ADMIN') {
        const added = spotIds.filter((id) => !before.spotIds.includes(id));
        setOutcome({
          tone: 'success',
          title: t('Staff.accessAddedTitle', { name: before.name || normalizedEmail }),
          body: added.length > 0 ? t('Staff.accessAddedBody', { spots: added.map(spotName).join(', ') }) : undefined,
        });
      } else if (member && Date.parse(member.createdAt) < startedAt - EXISTING_ACCOUNT_MS) {
        setOutcome({
          tone: 'info',
          title: t('Staff.reattachedTitle', { email: normalizedEmail, brand: brandName }),
          body: mode === 'password' ? t('Staff.reattachedPasswordIgnored') : undefined,
        });
      } else if (mode === 'password') {
        setOutcome({ tone: 'success', title: t('Staff.createdTitle', { email: normalizedEmail }), body: t('Staff.createdBody') });
      } else {
        setOutcome({ tone: 'success', title: t('Staff.invitedTitle', { email: normalizedEmail }), body: t('Staff.invitedBody') });
      }
    } catch (err) {
      const code = errorCode(err);
      const field = errorField(err);
      if (code === 'STAFF_CONFLICT') setErrors({ email: errorText(err) });
      else if (code === 'SPOT_REQUIRED') setErrors({ spots: errorText(err) });
      else if (field === 'email' || field === 'name' || field === 'password') setErrors({ [field]: errorText(err) });
      else setError(errorText(err, t('Staff.failedInvite')));
    }
  };

  return (
    <Modal title={t('Staff.inviteTitle', { brand: brandName })} onClose={onClose} size="lg" busy={loading}>
      {outcome ? (
        <div className="space-y-4">
          <Alert tone={outcome.tone} title={outcome.title}>
            {outcome.body}
          </Alert>
          <p className="text-xs text-gray-500">{t('Staff.appNote')}</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={reset}>
              {t('Staff.inviteAnother')}
            </Button>
            <Button className="flex-1" onClick={onClose}>
              {t('Common.done')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <Alert tone="error">{error}</Alert>}

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">{t('Staff.role')}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['SPOT_ADMIN', 'EMPLOYEE'] as InviteKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => chooseKind(k)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    kind === k ? 'border-brand bg-brand-light ring-1 ring-brand' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-gray-900">{t(`Roles.${k}`)}</span>
                  <span className="mt-1 block text-xs text-gray-600">{t(`Staff.roleCard_${k}`)}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">
              {kind === 'SPOT_ADMIN' ? t('Staff.spotsMany') : t('Staff.spotOne')}
            </p>
            {spots.length === 0 ? (
              <p className="text-sm text-gray-500">{t('Staff.noSpots')}</p>
            ) : (
              <SpotChecklist
                spots={spots}
                value={spotIds}
                onChange={setSpotIds}
                multiple={kind === 'SPOT_ADMIN'}
                disabled={loading}
                name="invite-spot"
              />
            )}
            {errors.spots && <p className="mt-1 text-xs text-red-600">{errors.spots}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Common.name')} error={errors.name}>
              {(id, invalid) => (
                <Input
                  id={id}
                  invalid={invalid}
                  maxLength={NAME_MAX}
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </Field>
            <Field label={t('Common.email')} error={errors.email}>
              {(id, invalid) => (
                <Input
                  id={id}
                  type="email"
                  invalid={invalid}
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>
          </div>

          <Field label={t('Staff.language')} hint={t('Staff.languageHint')}>
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

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">{t('Staff.access')}</legend>
            <div className="space-y-2 text-sm">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  className="mt-0.5 accent-brand"
                  checked={mode === 'code'}
                  onChange={() => setMode('code')}
                />
                <span>
                  <span className="block font-medium text-gray-800">{t('Staff.modeCode')}</span>
                  <span className="block text-xs text-gray-500">{t('Staff.modeCodeHint')}</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  className="mt-0.5 accent-brand"
                  checked={mode === 'password'}
                  onChange={() => setMode('password')}
                />
                <span>
                  <span className="block font-medium text-gray-800">{t('Staff.modePassword')}</span>
                  <span className="block text-xs text-gray-500">{t('Staff.modePasswordHint')}</span>
                </span>
              </label>
            </div>
            {mode === 'password' && (
              <div className="mt-3 space-y-2">
                <Field label={t('Staff.password')} error={errors.password}>
                  {(id, invalid) => (
                    <Input
                      id={id}
                      type="text"
                      autoComplete="new-password"
                      invalid={invalid}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  )}
                </Field>
                <PasswordRules password={password} />
              </div>
            )}
          </fieldset>

          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">{t('Staff.appNote')}</p>

          <div className="flex gap-3 border-t border-gray-100 pt-4">
            <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
              {t('Common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" loading={loading} loadingText={t('Common.sending')}>
              {mode === 'code' ? t('Staff.sendInvite') : t('Staff.createAccount')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { CREATE_BRAND, type CreateBrandInput, type CreateBrandResult } from '../graphql/brands';
import { CITIES, type City } from '../graphql/spots';
import { evictRoot } from '../lib/cachePolicies';
import { errorCode, errorField, errorText } from '../lib/errors';
import { cityName } from '../lib/format';
import { uploadBrandImage } from '../lib/upload';
import {
  BILLING_NOTE_MAX,
  BRAND_DESCRIPTION_MAX,
  BRAND_NAME_MAX,
  BRAND_NAME_MIN,
  MAX_SPOTS_LIMIT,
  SETTINGS_RANGES,
  STAFF_LANGUAGES,
  staffLanguageFor,
  type StaffLanguage,
} from '../lib/constants';
import { EMPTY_LOCALIZED, localizedToInput, type LocalizedValue } from '../lib/localizedText';
import { LocalizedTextFields } from '../components/LocalizedTextFields';
import { ChipMultiSelect } from '../components/ChipMultiSelect';
import { CreateCityModal } from '../components/CreateCityModal';
import { ImageInput } from '../components/ImageInput';
import { Card, PageHeader } from '../components/ui/Card';
import { stickyActionsClass } from '../components/ui/modalActions';
import { confirmLeave, guardLeave, useUnsavedChanges } from '../lib/unsaved';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import { Toggle } from '../components/ui/Toggle';

type FieldErrors = Partial<Record<'name' | 'cities' | 'maxSpots' | 'adminName' | 'adminEmail' | 'birthday' | 'referral', string>>;

function intOrNull(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : NaN;
}

/**
 * Prefill from a partnership request's "Create brand", passed as router
 * state (`navigate('/brands/new', { state: { prefill } })`) so the contact's
 * details never land in the URL or browser history.
 */
export interface CreateBrandPrefill {
  name: string;
  adminName: string;
  adminEmail: string;
  maxSpots: number;
  adminLanguage: string | null;
}

/** A whole number in 0..MAX_SPOTS_LIMIT as typed in the form, else ''. */
function maxSpotsValue(n: number | undefined): string {
  return n !== undefined && Number.isInteger(n) && n >= 0 && n <= MAX_SPOTS_LIMIT ? String(n) : '';
}

function languageValue(raw: string | null | undefined): StaffLanguage | null {
  const lng = raw?.toUpperCase();
  return (STAFF_LANGUAGES as readonly string[]).includes(lng ?? '') ? (lng as StaffLanguage) : null;
}

/**
 * PLATFORM: a new brand, its cities, its plan (maxSpots) and its first brand
 * admin, in one step; the logo is uploaded right after (BRANDS_SPEC §3.3).
 * Optionally prefilled from a partnership request (CreateBrandPrefill).
 */
export function CreateBrandPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as { prefill?: CreateBrandPrefill } | null)?.prefill;
  const { data: citiesData, refetch: refetchCities } = useQuery<{ cities: City[] }>(CITIES);
  const [createBrand] = useMutation<CreateBrandResult>(CREATE_BRAND, {
    update: (cache) => evictRoot(cache, ['adminBrands']),
  });

  const [name, setName] = useState(() => prefill?.name ?? '');
  const [description, setDescription] = useState<LocalizedValue>(EMPTY_LOCALIZED);
  const [cityIds, setCityIds] = useState<string[]>([]);
  const [maxSpots, setMaxSpots] = useState(() => maxSpotsValue(prefill?.maxSpots));
  const [birthdayEnabled, setBirthdayEnabled] = useState(false);
  const [birthdayPoints, setBirthdayPoints] = useState('');
  const [referralPoints, setReferralPoints] = useState('');
  const [billingNote, setBillingNote] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [adminName, setAdminName] = useState(() => prefill?.adminName ?? '');
  const [adminEmail, setAdminEmail] = useState(() => prefill?.adminEmail ?? '');
  const [adminLanguage, setAdminLanguage] = useState<StaffLanguage>(
    () => languageValue(prefill?.adminLanguage) ?? staffLanguageFor(i18n.language),
  );

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  // Any typed field, a chosen city or a logo: leaving asks first.
  const [touched, setTouched] = useState(false);
  useUnsavedChanges(touched || cityIds.length > 0 || !!logo);
  const unsavedMessage = t('Common.unsavedConfirm');

  const cityOptions = useMemo(
    () =>
      [...(citiesData?.cities ?? [])]
        .sort((a, b) => cityName(a).localeCompare(cityName(b)))
        .map((c) => ({ id: c.id, label: cityName(c) })),
    [citiesData],
  );

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    const len = Array.from(name.trim()).length;
    if (len < BRAND_NAME_MIN || len > BRAND_NAME_MAX) {
      errs.name = t('BrandForm.nameRule', { min: BRAND_NAME_MIN, max: BRAND_NAME_MAX });
    }
    if (cityIds.length === 0) errs.cities = t('BrandForm.citiesRequired');
    const max = intOrNull(maxSpots);
    if (max === null || Number.isNaN(max) || max < 0 || max > MAX_SPOTS_LIMIT) {
      errs.maxSpots = t('BrandForm.maxSpotsRule', { max: MAX_SPOTS_LIMIT });
    }
    const [bMin, bMax] = SETTINGS_RANGES.birthdayBonusPoints;
    const birthday = intOrNull(birthdayPoints);
    if (birthdayEnabled && (birthday === null || Number.isNaN(birthday) || birthday < 1 || birthday > bMax)) {
      errs.birthday = t('BrandForm.pointsRule', { min: Math.max(1, bMin), max: bMax });
    }
    const [rMin, rMax] = SETTINGS_RANGES.referralBonusPoints;
    const referral = intOrNull(referralPoints);
    if (referral !== null && (Number.isNaN(referral) || referral < rMin || referral > rMax)) {
      errs.referral = t('BrandForm.pointsRule', { min: rMin, max: rMax });
    }
    if (!adminName.trim()) errs.adminName = t('BrandForm.adminNameRequired');
    if (!/^\S+@\S+\.\S+$/.test(adminEmail.trim())) errs.adminEmail = t('BrandForm.adminEmailInvalid');
    return errs;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const desc = localizedToInput(description);
    const settings: CreateBrandInput['settings'] = {};
    if (birthdayEnabled) {
      settings.birthdayBonusEnabled = true;
      settings.birthdayBonusPoints = Number(birthdayPoints);
    }
    if (referralPoints.trim() !== '') settings.referralBonusPoints = Number(referralPoints);

    const input: CreateBrandInput = {
      name: name.trim(),
      description: desc.text,
      descriptionLocal: desc.local,
      cityIds,
      maxSpots: Number(maxSpots),
      admin: { name: adminName.trim(), email: adminEmail.trim().toLowerCase(), language: adminLanguage },
      ...(Object.keys(settings).length > 0 ? { settings } : {}),
      billingNote: billingNote.trim() || null,
    };

    setBusy(true);
    let brandId: string;
    try {
      const res = await createBrand({ variables: { input } });
      const created = res.data?.createBrand;
      if (!created) throw new Error();
      brandId = created.brand.brand.id;
    } catch (err) {
      setBusy(false);
      const code = errorCode(err);
      const field = errorField(err);
      if (code === 'BRAND_NAME_TAKEN') setFieldErrors({ name: errorText(err) });
      else if (code === 'STAFF_CONFLICT') setFieldErrors({ adminEmail: errorText(err) });
      else if (field === 'name') setFieldErrors({ name: errorText(err) });
      else if (field === 'cityIds') setFieldErrors({ cities: errorText(err) });
      else if (field === 'maxSpots') setFieldErrors({ maxSpots: errorText(err) });
      else setError(errorText(err, t('BrandForm.failedCreate')));
      return;
    }

    // The brand exists now; a failed logo upload is reported on its profile.
    let warning: string | undefined;
    if (logo) {
      try {
        await uploadBrandImage(brandId, 'logo', logo);
      } catch (err) {
        warning = t('BrandForm.logoFailedAfterCreate', { reason: errorText(err) });
      }
    }
    setBusy(false);
    navigate(`/brands/${encodeURIComponent(brandId)}`, {
      state: {
        notice: t('BrandForm.created', { name: input.name, email: input.admin.email }),
        warning,
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
      <PageHeader
        title={t('BrandForm.createTitle')}
        subtitle={t('BrandForm.createSubtitle')}
        back={
          <Link to="/brands" onClick={guardLeave(unsavedMessage)} className="text-sm text-gray-500 hover:text-brand">
            {t('BrandScope.backToBrands')}
          </Link>
        }
      />

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      <form onSubmit={submit} onChange={() => setTouched(true)} className="space-y-6" noValidate>
        <Card title={t('BrandForm.identity')}>
          <div className="space-y-4">
            <Field label={t('BrandForm.name')} error={fieldErrors.name} hint={t('BrandForm.nameHint')}>
              {(id, invalid) => (
                <Input
                  id={id}
                  invalid={invalid}
                  value={name}
                  maxLength={BRAND_NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
            </Field>
            <LocalizedTextFields
              label={t('BrandForm.description')}
              value={description}
              onChange={setDescription}
              multiline
              maxLength={BRAND_DESCRIPTION_MAX}
            />
            <ImageInput
              label={t('BrandForm.logo')}
              shape="square"
              selectedFile={logo}
              onSelect={setLogo}
            />
          </div>
        </Card>

        <Card
          title={t('BrandForm.cities')}
          description={t('BrandForm.citiesHint')}
          actions={
            <button
              type="button"
              onClick={() => setCityModalOpen(true)}
              className="text-xs font-semibold text-brand hover:underline"
            >
              {t('CreateSpot.addCity')}
            </button>
          }
        >
          <ChipMultiSelect
            options={cityOptions}
            value={cityIds}
            onChange={setCityIds}
            emptyText={t('BrandForm.noCitiesYet')}
          />
          {fieldErrors.cities && <p className="mt-2 text-xs text-red-600">{fieldErrors.cities}</p>}
        </Card>

        <Card title={t('BrandForm.plan')} description={t('BrandForm.planHint')}>
          <div className="space-y-4">
            <Field label={t('BrandForm.maxSpots')} error={fieldErrors.maxSpots} hint={t('BrandForm.maxSpotsHint')}>
              {(id, invalid) => (
                <Input
                  id={id}
                  invalid={invalid}
                  type="number"
                  min={0}
                  max={MAX_SPOTS_LIMIT}
                  step={1}
                  value={maxSpots}
                  onChange={(e) => setMaxSpots(e.target.value)}
                  className="max-w-[12rem]"
                  required
                />
              )}
            </Field>
            <Field label={t('BrandForm.billingNote')} hint={t('BrandForm.billingNoteHint')}>
              {(id) => (
                <Textarea
                  id={id}
                  rows={2}
                  maxLength={BILLING_NOTE_MAX}
                  value={billingNote}
                  onChange={(e) => setBillingNote(e.target.value)}
                />
              )}
            </Field>
          </div>
        </Card>

        <Card title={t('BrandForm.bonuses')} description={t('BrandForm.bonusesHint')}>
          <div className="space-y-4">
            <Toggle
              checked={birthdayEnabled}
              onChange={setBirthdayEnabled}
              label={t('BrandForm.birthday')}
              description={t('BrandForm.birthdayHint')}
            />
            {birthdayEnabled && (
              <Field label={t('BrandForm.birthdayPoints')} error={fieldErrors.birthday}>
                {(id, invalid) => (
                  <Input
                    id={id}
                    invalid={invalid}
                    type="number"
                    min={1}
                    step={1}
                    value={birthdayPoints}
                    onChange={(e) => setBirthdayPoints(e.target.value)}
                    className="max-w-[12rem]"
                  />
                )}
              </Field>
            )}
            <Field
              label={t('BrandForm.referralPoints')}
              error={fieldErrors.referral}
              hint={t('BrandForm.referralHint')}
            >
              {(id, invalid) => (
                <Input
                  id={id}
                  invalid={invalid}
                  type="number"
                  min={0}
                  step={1}
                  value={referralPoints}
                  onChange={(e) => setReferralPoints(e.target.value)}
                  className="max-w-[12rem]"
                />
              )}
            </Field>
          </div>
        </Card>

        <Card title={t('BrandForm.firstAdmin')} description={t('BrandForm.firstAdminHint')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Common.fullName')} error={fieldErrors.adminName}>
              {(id, invalid) => (
                <Input id={id} invalid={invalid} value={adminName} onChange={(e) => setAdminName(e.target.value)} />
              )}
            </Field>
            <Field label={t('Common.email')} error={fieldErrors.adminEmail}>
              {(id, invalid) => (
                <Input
                  id={id}
                  invalid={invalid}
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              )}
            </Field>
            <Field label={t('BrandForm.adminLanguage')} hint={t('BrandForm.adminLanguageHint')}>
              {(id) => (
                <Select
                  id={id}
                  value={adminLanguage}
                  onChange={(e) => setAdminLanguage(e.target.value as StaffLanguage)}
                >
                  {STAFF_LANGUAGES.map((lng) => (
                    <option key={lng} value={lng}>
                      {t(`Language.${lng.toLowerCase()}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </Card>

        <div className={stickyActionsClass}>
          <Button
            variant="secondary"
            onClick={() => {
              if (confirmLeave(unsavedMessage)) navigate('/brands');
            }}
            disabled={busy}
          >
            {t('Common.cancel')}
          </Button>
          <Button type="submit" loading={busy} loadingText={t('Common.creating')}>
            {t('BrandForm.submitCreate')}
          </Button>
        </div>
      </form>

      {cityModalOpen && (
        <CreateCityModal
          onClose={() => setCityModalOpen(false)}
          onCreated={async (city) => {
            await refetchCities();
            setCityIds((ids) => (ids.includes(city.id) ? ids : [...ids, city.id]));
            setCityModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

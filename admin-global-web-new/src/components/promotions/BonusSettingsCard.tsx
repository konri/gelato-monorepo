import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../../brand/BrandScope';
import { UPDATE_BRAND_SETTINGS, type BrandSettings, type BrandSettingsInput } from '../../graphql/brands';
import { errorField, errorText } from '../../lib/errors';
import { fmtNumber } from '../../lib/format';
import { SETTINGS_RANGES } from '../../lib/constants';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Field, Input } from '../ui/Field';
import { Toggle } from '../ui/Toggle';

type NumberKey = keyof typeof SETTINGS_RANGES;
const NUMBER_KEYS: NumberKey[] = [
  'birthdayBonusPoints',
  'referralBonusPoints',
  'fallbackPointsPerPln',
  'manualAwardCap',
  'staffDailyAwardCap',
];
const ADVANCED_KEYS: NumberKey[] = ['fallbackPointsPerPln', 'manualAwardCap', 'staffDailyAwardCap'];

type Form = { birthdayBonusEnabled: boolean } & Record<NumberKey, string>;

function formFrom(s: BrandSettings): Form {
  return {
    birthdayBonusEnabled: s.birthdayBonusEnabled,
    birthdayBonusPoints: String(s.birthdayBonusPoints),
    referralBonusPoints: String(s.referralBonusPoints),
    fallbackPointsPerPln: String(s.fallbackPointsPerPln),
    manualAwardCap: String(s.manualAwardCap),
    staffDailyAwardCap: String(s.staffDailyAwardCap),
  };
}

/**
 * The brand's bonus rules (BRANDS_SPEC §3.3): birthday on / off and points,
 * referral points (A2: paid to both when an invited friend's first purchase
 * is at this brand), and under Advanced the fallback points per PLN, the
 * custom-award cap and the daily cap per staff member (0 = off).
 */
export function BonusSettingsCard() {
  const { t } = useTranslation();
  const { brandId, brand, view } = useBrandScope();
  const [initial, setInitial] = useState<Form>(() => formFrom(view.settings));
  const [form, setForm] = useState<Form>(initial);
  const [advanced, setAdvanced] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<NumberKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [save, { loading }] = useMutation<{ updateBrandSettings: { settings: BrandSettings } }>(UPDATE_BRAND_SETTINGS);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const dirty = (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== initial[k]);

  const validate = () => {
    const errs: Partial<Record<NumberKey, string>> = {};
    for (const key of NUMBER_KEYS) {
      if (key === 'birthdayBonusPoints' && !form.birthdayBonusEnabled) continue;
      const [min, max] = SETTINGS_RANGES[key];
      const low = key === 'birthdayBonusPoints' ? 1 : min;
      const raw = form[key].trim();
      const n = Number(raw);
      if (raw === '' || !Number.isInteger(n) || n < low || n > max) {
        errs[key] = t('Bonuses.rangeRule', { min: fmtNumber(low), max: fmtNumber(max) });
      }
    }
    return errs;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (ADVANCED_KEYS.some((k) => errs[k])) setAdvanced(true);
      return;
    }
    const input: BrandSettingsInput = {};
    if (form.birthdayBonusEnabled !== initial.birthdayBonusEnabled) input.birthdayBonusEnabled = form.birthdayBonusEnabled;
    for (const key of NUMBER_KEYS) {
      if (key === 'birthdayBonusPoints' && !form.birthdayBonusEnabled) continue;
      if (form[key].trim() !== initial[key]) input[key] = Number(form[key]);
    }
    try {
      const res = await save({ variables: { brandId, input } });
      const next = res.data?.updateBrandSettings.settings;
      if (next) {
        const fresh = formFrom(next);
        setInitial(fresh);
        setForm(fresh);
      }
      setSaved(true);
    } catch (err) {
      const field = errorField(err);
      if (field && (NUMBER_KEYS as string[]).includes(field)) setErrors({ [field]: errorText(err) });
      else setError(errorText(err));
    }
  };

  const numberField = (key: NumberKey, label: string, hint: string) => (
    <Field label={label} hint={hint} error={errors[key]}>
      {(id, invalid) => (
        <Input
          id={id}
          type="number"
          min={SETTINGS_RANGES[key][0]}
          max={SETTINGS_RANGES[key][1]}
          step={1}
          inputMode="numeric"
          invalid={invalid}
          value={form[key]}
          disabled={loading}
          onChange={(e) => set(key, e.target.value)}
        />
      )}
    </Field>
  );

  return (
    <Card title={t('Bonuses.title')} description={t('Bonuses.subtitle', { brand: brand.name })}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Toggle
          checked={form.birthdayBonusEnabled}
          onChange={(v) => set('birthdayBonusEnabled', v)}
          label={t('Bonuses.birthday')}
          description={t('Bonuses.birthdayHint', { brand: brand.name })}
          disabled={loading}
        />
        {form.birthdayBonusEnabled &&
          numberField('birthdayBonusPoints', t('Bonuses.birthdayPoints'), t('Bonuses.birthdayPointsHint'))}
        {numberField('referralBonusPoints', t('Bonuses.referralPoints'), t('Bonuses.referralHint', { brand: brand.name }))}

        <div>
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            aria-expanded={advanced}
            className="text-sm font-semibold text-brand hover:underline"
          >
            {advanced ? t('Bonuses.hideAdvanced') : t('Bonuses.showAdvanced')}
          </button>
          {advanced && (
            <div className="mt-3 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              {numberField('fallbackPointsPerPln', t('Bonuses.fallbackPointsPerPln'), t('Bonuses.fallbackPointsPerPlnHint'))}
              {numberField('manualAwardCap', t('Bonuses.manualAwardCap'), t('Bonuses.manualAwardCapHint'))}
              {numberField('staffDailyAwardCap', t('Bonuses.staffDailyAwardCap'), t('Bonuses.staffDailyAwardCapHint'))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty} loading={loading} loadingText={t('Common.saving')}>
            {t('Bonuses.save')}
          </Button>
          {dirty && (
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => {
                setForm(initial);
                setErrors({});
              }}
            >
              {t('Common.discard')}
            </Button>
          )}
          {saved && !dirty && <span className="text-sm text-green-700">{t('Bonuses.saved')}</span>}
        </div>
      </form>
    </Card>
  );
}

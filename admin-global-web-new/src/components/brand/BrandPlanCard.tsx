import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../../brand/BrandScope';
import {
  UPDATE_BRAND_PLATFORM,
  type BrandAdminView,
  type UpdateBrandPlatformInput,
} from '../../graphql/brands';
import { errorCode, errorField, errorText } from '../../lib/errors';
import { BILLING_NOTE_MAX, BRAND_NAME_MAX, BRAND_NAME_MIN, MAX_SPOTS_LIMIT } from '../../lib/constants';
import { evictRoot } from '../../lib/cachePolicies';
import { QuotaMeter } from '../QuotaMeter';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Field, Input, Textarea } from '../ui/Field';
import { Toggle } from '../ui/Toggle';
import { ConfirmDialog } from '../ui/ConfirmDialog';

/**
 * PLATFORM only: brand name (E5), plan (maxSpots), billing note (E19) and
 * the brand's active state (E14), with a confirm step.
 */
export function BrandPlanCard() {
  const { t } = useTranslation();
  const { view, brand, brandId, quota } = useBrandScope();
  const [update, { loading }] = useMutation<{ updateBrandPlatform: BrandAdminView }>(UPDATE_BRAND_PLATFORM, {
    update: (cache) => evictRoot(cache, ['adminBrands']),
  });

  const [name, setName] = useState(brand.name);
  const [maxSpots, setMaxSpots] = useState(String(quota.maxSpots));
  const [billingNote, setBillingNote] = useState(view.billingNote ?? '');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; maxSpots?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmActive, setConfirmActive] = useState<boolean | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const changes: UpdateBrandPlatformInput = {};
  if (name.trim() !== brand.name) changes.name = name.trim();
  if (maxSpots.trim() !== String(quota.maxSpots)) changes.maxSpots = Number(maxSpots);
  if (billingNote.trim() !== (view.billingNote ?? '').trim()) changes.billingNote = billingNote.trim() || null;
  const dirty = Object.keys(changes).length > 0;
  const lowering = changes.maxSpots !== undefined && changes.maxSpots < quota.activeSpots;

  const save = async () => {
    setError(null);
    setNotice(null);
    const errs: typeof fieldErrors = {};
    const len = Array.from(name.trim()).length;
    if (len < BRAND_NAME_MIN || len > BRAND_NAME_MAX) {
      errs.name = t('BrandForm.nameRule', { min: BRAND_NAME_MIN, max: BRAND_NAME_MAX });
    }
    const max = Number(maxSpots);
    if (maxSpots.trim() === '' || !Number.isInteger(max) || max < 0 || max > MAX_SPOTS_LIMIT) {
      errs.maxSpots = t('BrandForm.maxSpotsRule', { max: MAX_SPOTS_LIMIT });
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      await update({ variables: { brandId, input: changes } });
      setNotice(t('BrandProfile.saved'));
    } catch (err) {
      if (errorCode(err) === 'BRAND_NAME_TAKEN' || errorField(err) === 'name') setFieldErrors({ name: errorText(err) });
      else if (errorField(err) === 'maxSpots') setFieldErrors({ maxSpots: errorText(err) });
      else setError(errorText(err));
    }
  };

  const setActive = async (isActive: boolean) => {
    setConfirmError(null);
    try {
      await update({ variables: { brandId, input: { isActive } } });
      setConfirmActive(null);
    } catch (err) {
      setConfirmError(errorText(err));
    }
  };

  return (
    <Card title={t('BrandPlan.title')} description={t('BrandPlan.subtitle')}>
      <div className="space-y-5">
        <div className="rounded-lg bg-gray-50 p-4">
          <QuotaMeter quota={quota} />
        </div>
        <Field label={t('BrandForm.name')} error={fieldErrors.name} hint={t('BrandPlan.nameHint')}>
          {(id, invalid) => (
            <Input
              id={id}
              invalid={invalid}
              value={name}
              maxLength={BRAND_NAME_MAX}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
        <Field
          label={t('BrandForm.maxSpots')}
          error={fieldErrors.maxSpots}
          hint={lowering ? t('BrandPlan.loweringHint', { active: quota.activeSpots }) : t('BrandForm.maxSpotsHint')}
        >
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
        {error && <Alert tone="error">{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
        <div className="flex gap-2">
          <Button onClick={() => void save()} disabled={!dirty} loading={loading && confirmActive === null} loadingText={t('Common.saving')}>
            {t('Common.save')}
          </Button>
          {dirty && (
            <Button
              variant="secondary"
              onClick={() => {
                setName(brand.name);
                setMaxSpots(String(quota.maxSpots));
                setBillingNote(view.billingNote ?? '');
                setFieldErrors({});
              }}
            >
              {t('Common.discard')}
            </Button>
          )}
        </div>

        <div className="border-t border-gray-100 pt-5">
          <Toggle
            checked={brand.isActive}
            onChange={(next) => {
              setConfirmError(null);
              setConfirmActive(next);
            }}
            label={t('BrandPlan.active')}
            description={brand.isActive ? t('BrandPlan.activeHint') : t('BrandPlan.inactiveHint')}
          />
        </div>
      </div>

      {confirmActive !== null && (
        <ConfirmDialog
          title={confirmActive ? t('BrandPlan.activateTitle', { name: brand.name }) : t('BrandPlan.deactivateTitle', { name: brand.name })}
          body={confirmActive ? t('BrandPlan.activateBody') : t('BrandPlan.deactivateBody')}
          confirmLabel={confirmActive ? t('BrandPlan.activateConfirm') : t('BrandPlan.deactivateConfirm')}
          tone={confirmActive ? 'default' : 'danger'}
          busy={loading}
          error={confirmError}
          onCancel={() => setConfirmActive(null)}
          onConfirm={() => void setActive(confirmActive)}
        />
      )}
    </Card>
  );
}

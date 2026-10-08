import { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { CREATE_PRIZE, UPDATE_PRIZE, type Prize } from '../../graphql/prizes';
import { evictRoot } from '../../lib/cachePolicies';
import { errorCode, errorField, errorText } from '../../lib/errors';
import { dateInputFromIso, fmtNumber, isoFromDateInput } from '../../lib/format';
import {
  EMPTY_LOCALIZED,
  localizedFromFilled,
  localizedToFilledInput,
  sameLocalized,
  type LocalizedValue,
} from '../../lib/localizedText';
import { uploadPrizeImage } from '../../lib/upload';
import { LocalizedTextFields } from '../LocalizedTextFields';
import { ImageInput } from '../ImageInput';
import { Modal } from '../ui/Modal';
import { modalActionsClass } from '../ui/modalActions';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Field, Input } from '../ui/Field';
import { Toggle } from '../ui/Toggle';

const REWARD_TITLE_MAX = 80;
const REWARD_DESCRIPTION_MAX = 500;

type Form = {
  title: LocalizedValue;
  description: LocalizedValue;
  pointsCost: string;
  quantity: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
};

type FieldErrors = Partial<Record<'title' | 'pointsCost' | 'quantity' | 'validUntil', string>>;

function formFrom(prize: Prize | null): Form {
  if (!prize) {
    return {
      title: EMPTY_LOCALIZED,
      description: EMPTY_LOCALIZED,
      pointsCost: '',
      quantity: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
    };
  }
  return {
    title: localizedFromFilled(prize.title, prize.titleLocal),
    description: localizedFromFilled(prize.description, prize.descriptionLocal),
    pointsCost: String(prize.pointsCost),
    quantity: prize.quantity != null ? String(prize.quantity) : '',
    validFrom: dateInputFromIso(prize.validFrom),
    validUntil: dateInputFromIso(prize.validUntil),
    isActive: prize.isActive,
  };
}

function wholeNumber(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : NaN;
}

/**
 * Create or edit a reward (BRANDS_SPEC §3.3): localized title and
 * description, cost, quantity (≥ claimed), validity dates, active flag and
 * a photo. A new reward's photo is uploaded right after it is created; if
 * that upload fails the reward is kept and the upload can be retried.
 */
export function RewardModal({
  brandId,
  prize: editing,
  onClose,
  onSaved,
}: {
  brandId: string;
  /** The reward to edit (live from the list), or null to create one. */
  prize: Prize | null;
  onClose: () => void;
  /** After a successful save (the modal closes itself). */
  onSaved: (message: string) => void;
}) {
  const { t } = useTranslation();
  const client = useApolloClient();
  /** Set after create when the photo upload failed (the reward exists). */
  const [created, setCreated] = useState<Prize | null>(null);
  const [initial] = useState<Form>(() => formFrom(editing));
  const [form, setForm] = useState<Form>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isEdit = !!editing;
  const claimed = editing?.claimed ?? 0;
  const changed = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const [createPrize] = useMutation<{ createPrize: Prize }>(CREATE_PRIZE, {
    update: (cache) => evictRoot(cache, ['brandPrizes']),
    refetchQueries: ['AdminBrand'],
  });
  const [updatePrize] = useMutation<{ updatePrize: Prize }>(UPDATE_PRIZE, { refetchQueries: ['AdminBrand'] });

  const setImageUrl = (prizeId: string, url: string | null) => {
    client.cache.modify({
      id: client.cache.identify({ __typename: 'PrizeType', id: prizeId }),
      fields: { imageUrl: () => url },
    });
  };

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!localizedToFilledInput(form.title).text) errs.title = t('Prizes.titleRequired');
    const cost = wholeNumber(form.pointsCost);
    if (cost === null || Number.isNaN(cost) || cost < 1) errs.pointsCost = t('Prizes.costRule');
    const qty = wholeNumber(form.quantity);
    if (qty !== null && (Number.isNaN(qty) || qty < 0)) errs.quantity = t('Prizes.quantityRule');
    else if (qty !== null && qty < claimed) errs.quantity = t('Prizes.quantityBelowClaimed', { claimed: fmtNumber(claimed) });
    if (form.validFrom && form.validUntil && form.validUntil < form.validFrom) errs.validUntil = t('Prizes.datesOrder');
    return errs;
  };

  /** Variables for the fields that differ from what was loaded (all of them on create). */
  const variables = (): Record<string, unknown> => {
    const vars: Record<string, unknown> = {};
    if (!isEdit || !sameLocalized(form.title, initial.title)) {
      const title = localizedToFilledInput(form.title);
      vars.title = title.text;
      vars.titleLocal = title.local;
    }
    if (!isEdit || !sameLocalized(form.description, initial.description)) {
      const description = localizedToFilledInput(form.description);
      if (isEdit || description.text) {
        vars.description = description.text;
        vars.descriptionLocal = description.local;
      }
    }
    if (!isEdit || form.pointsCost !== initial.pointsCost) vars.pointsCost = Number(form.pointsCost);
    if (!isEdit || form.quantity.trim() !== initial.quantity) {
      const qty = wholeNumber(form.quantity);
      if (isEdit || qty !== null) vars.quantity = qty;
    }
    if (!isEdit || form.validFrom !== initial.validFrom) {
      const from = form.validFrom ? isoFromDateInput(form.validFrom, 'start') : null;
      if (isEdit || from) vars.validFrom = from;
    }
    if (!isEdit || form.validUntil !== initial.validUntil) {
      const until = form.validUntil ? isoFromDateInput(form.validUntil, 'end') : null;
      if (isEdit || until) vars.validUntil = until;
    }
    if (!isEdit || form.isActive !== initial.isActive) vars.isActive = form.isActive;
    return vars;
  };

  const showServerError = (err: unknown) => {
    const code = errorCode(err);
    const field = errorField(err);
    if (code === 'REWARD_QUANTITY_BELOW_CLAIMED') {
      setErrors({ quantity: errorText(err) });
      return;
    }
    if (field === 'title') setErrors({ title: errorText(err) });
    else if (field === 'pointsCost') setErrors({ pointsCost: errorText(err) });
    else if (field === 'quantity') setErrors({ quantity: errorText(err) });
    else if (field === 'validUntil' || field === 'validFrom') setErrors({ validUntil: errorText(err) });
    else setError(errorText(err, t('Prizes.failedSave')));
  };

  const uploadAfterCreate = async (target: Prize, photo: File): Promise<boolean> => {
    try {
      const url = await uploadPrizeImage(target.id, photo);
      setImageUrl(target.id, url);
      return true;
    } catch (err) {
      setUploadError(errorText(err, t('Upload.failed')));
      return false;
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    try {
      if (editing) {
        const vars = variables();
        if (Object.keys(vars).length > 0) await updatePrize({ variables: { id: editing.id, ...vars } });
        onSaved(t('Prizes.saved'));
        onClose();
        return;
      }
      const res = await createPrize({ variables: { brandId, ...variables() } });
      const saved = res.data?.createPrize;
      if (!saved) throw new Error();
      if (file && !(await uploadAfterCreate(saved, file))) {
        // The reward exists: offer the photo upload again.
        setCreated(saved);
        setBusy(false);
        return;
      }
      onSaved(t('Prizes.created', { title: saved.title }));
      onClose();
    } catch (err) {
      showServerError(err);
      setBusy(false);
    }
  };

  const retryUpload = async () => {
    if (!created || !file) return;
    setBusy(true);
    setUploadError(null);
    if (await uploadAfterCreate(created, file)) {
      onSaved(t('Prizes.created', { title: created.title }));
      onClose();
      return;
    }
    setBusy(false);
  };


  return (
    <Modal
      title={isEdit ? t('Prizes.editTitle') : t('Prizes.createTitle')}
      onClose={onClose}
      size="lg"
      busy={busy}
    >
      {created ? (
        <div className="space-y-4">
          <Alert
            tone="warning"
            title={t('Prizes.createdPhotoFailed', { title: created.title })}
            action={
              file ? (
                <Button size="sm" variant="secondary" onClick={() => void retryUpload()} loading={busy} loadingText={t('Upload.uploading')}>
                  {t('Common.retry')}
                </Button>
              ) : undefined
            }
          >
            {uploadError}
          </Alert>
          <ImageInput
            label={t('Prizes.photoOther')}
            hint={t('Prizes.photoHint')}
            disabled={busy}
            onUpload={async (photo) => {
              const url = await uploadPrizeImage(created.id, photo);
              setImageUrl(created.id, url);
              onSaved(t('Prizes.created', { title: created.title }));
              onClose();
            }}
          />
          <Button
            variant="secondary"
            className="w-full"
            disabled={busy}
            onClick={() => {
              onSaved(t('Prizes.created', { title: created.title }));
              onClose();
            }}
          >
            {t('Prizes.skipPhoto')}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <LocalizedTextFields
            label={t('Prizes.fieldTitle')}
            value={form.title}
            onChange={(v) => changed('title', v)}
            maxLength={REWARD_TITLE_MAX}
            error={errors.title}
            hint={t('Prizes.titleHint')}
          />
          <LocalizedTextFields
            label={t('Prizes.fieldDescription')}
            value={form.description}
            onChange={(v) => changed('description', v)}
            multiline
            maxLength={REWARD_DESCRIPTION_MAX}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Prizes.fieldCost')} error={errors.pointsCost} hint={t('Prizes.costHint')}>
              {(id, invalid) => (
                <Input
                  id={id}
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  invalid={invalid}
                  value={form.pointsCost}
                  onChange={(e) => changed('pointsCost', e.target.value)}
                />
              )}
            </Field>
            <Field
              label={t('Prizes.fieldQuantity')}
              error={errors.quantity}
              hint={
                claimed > 0
                  ? t('Prizes.quantityHintClaimed', { claimed: fmtNumber(claimed) })
                  : t('Prizes.quantityHint')
              }
            >
              {(id, invalid) => (
                <Input
                  id={id}
                  type="number"
                  min={Math.max(0, claimed)}
                  step={1}
                  inputMode="numeric"
                  invalid={invalid}
                  value={form.quantity}
                  placeholder={t('Prizes.unlimited')}
                  onChange={(e) => changed('quantity', e.target.value)}
                />
              )}
            </Field>
            <Field label={t('Prizes.fieldValidFrom')} hint={t('Prizes.validFromHint')}>
              {(id) => (
                <Input id={id} type="date" value={form.validFrom} onChange={(e) => changed('validFrom', e.target.value)} />
              )}
            </Field>
            <Field label={t('Prizes.fieldValidUntil')} error={errors.validUntil} hint={t('Prizes.validUntilHint')}>
              {(id, invalid) => (
                <Input
                  id={id}
                  type="date"
                  invalid={invalid}
                  min={form.validFrom || undefined}
                  value={form.validUntil}
                  onChange={(e) => changed('validUntil', e.target.value)}
                />
              )}
            </Field>
          </div>
          <p className="text-xs text-gray-500">{t('Prizes.claimValidityNote')}</p>
          <Toggle
            checked={form.isActive}
            onChange={(v) => changed('isActive', v)}
            label={t('Prizes.fieldActive')}
            description={form.isActive ? t('Prizes.activeHint') : t('Prizes.disabledHint')}
          />
          {editing ? (
            <ImageInput
              label={t('Prizes.photo')}
              url={editing.imageUrl}
              hint={t('Prizes.photoSavedNow')}
              disabled={busy}
              onUpload={async (photo) => {
                const url = await uploadPrizeImage(editing.id, photo);
                setImageUrl(editing.id, url);
              }}
              onRemove={async () => {
                await updatePrize({ variables: { id: editing.id, imageUrl: null } });
              }}
            />
          ) : (
            <ImageInput
              label={t('Prizes.photo')}
              hint={t('Prizes.photoHint')}
              disabled={busy}
              selectedFile={file}
              onSelect={setFile}
            />
          )}
          <div className={modalActionsClass}>
            <Button variant="secondary" className="flex-1" onClick={onClose} disabled={busy}>
              {t('Common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={busy}
              loadingText={isEdit ? t('Common.saving') : t('Common.creating')}
            >
              {isEdit ? t('Common.save') : t('Prizes.createSubmit')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

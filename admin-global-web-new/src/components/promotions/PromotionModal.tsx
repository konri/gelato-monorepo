import { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import {
  CREATE_BRAND_TASK,
  UPDATE_BRAND_TASK,
  type BrandTask,
  type BrandTaskInput,
} from '../../graphql/tasks';
import type { AdminSpot } from '../../graphql/spots';
import { spotStatus } from '../../graphql/spots';
import { evictRoot } from '../../lib/cachePolicies';
import { errorCode, errorField, errorText } from '../../lib/errors';
import {
  EMPTY_LOCALIZED,
  localizedFromFilled,
  localizedToFilledInput,
  type LocalizedValue,
} from '../../lib/localizedText';
import {
  CUSTOM_MULTIPLIER_MAX,
  CUSTOM_MULTIPLIER_MIN,
  MULTIPLIER_PRESETS,
  fmtMultiplier,
  multiplierInput,
  newRange,
  parseMultiplier,
  rangesFromWindows,
  scheduleLines,
  validateRanges,
  windowsFromRanges,
  type ScheduleRange,
} from '../../lib/schedule';
import { LocalizedTextFields } from '../LocalizedTextFields';
import { ChipMultiSelect } from '../ChipMultiSelect';
import { Modal } from '../ui/Modal';
import { modalActionsClass } from '../ui/modalActions';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Field, Input } from '../ui/Field';
import { ScheduleEditor } from './ScheduleEditor';
import { datesText } from './promotionState';

const PROMOTION_TITLE_MAX = 80;

/** Prefill for a new promotion ("Start from this example": ×2, Thursday 10:00–14:00). */
export type PromotionDraft = {
  title: LocalizedValue;
  multiplierPercent: number;
  ranges: ScheduleRange[];
};

type Section = 'title' | 'multiplier' | 'schedule' | 'dates' | 'spots' | 'appliesTo';
type Errors = Partial<Record<Section, string>>;

type Form = {
  title: LocalizedValue;
  /** A preset (150 / 200 / 300) or 'custom'. */
  multiplierChoice: number | 'custom';
  customMultiplier: string;
  scheduleMode: 'always' | 'hours';
  ranges: ScheduleRange[];
  startsOn: string;
  endsOn: string;
  spotMode: 'all' | 'selected';
  spotIds: string[];
  appliesToOrders: boolean;
  appliesToTemplateAwards: boolean;
};

function formFrom(task: BrandTask | null, draft: PromotionDraft | null): Form {
  const percent = task?.multiplierPercent ?? draft?.multiplierPercent ?? 200;
  const preset = (MULTIPLIER_PRESETS as readonly number[]).includes(percent);
  const ranges = task ? rangesFromWindows(task.windows) : draft?.ranges ?? [];
  return {
    title: task ? localizedFromFilled(task.title, task.titleLocal) : draft?.title ?? EMPTY_LOCALIZED,
    multiplierChoice: preset ? percent : 'custom',
    customMultiplier: preset ? '' : multiplierInput(percent),
    scheduleMode: task && task.windows.length === 0 ? 'always' : 'hours',
    ranges: ranges.length > 0 ? ranges : [newRange()],
    startsOn: task?.startsOn ?? '',
    endsOn: task?.endsOn ?? '',
    spotMode: task && task.spotIds.length > 0 ? 'selected' : 'all',
    spotIds: task?.spotIds ?? [],
    appliesToOrders: task?.appliesToOrders ?? true,
    appliesToTemplateAwards: task?.appliesToTemplateAwards ?? true,
  };
}

/** Server validation field (BRAND_TASK_INVALID extensions.field) → form section. */
const FIELD_SECTION: Record<string, Section> = {
  title: 'title',
  multiplierPercent: 'multiplier',
  windows: 'schedule',
  dayOfWeek: 'schedule',
  startTime: 'schedule',
  endTime: 'schedule',
  startsOn: 'dates',
  endsOn: 'dates',
  spotIds: 'spots',
  appliesToOrders: 'appliesTo',
  appliesToTemplateAwards: 'appliesTo',
};

/**
 * Create or edit a points multiplier (BRANDS_SPEC §3.3): name, multiplier
 * (×1.5 / ×2 / ×3 / custom ×1.1–×10), schedule ranges, dates, spots, what it
 * applies to, the local-time hint, overlap and future-only notes and a live
 * preview. Always sends the full BrandTaskInput (updateBrandTask replaces).
 */
export function PromotionModal({
  brandId,
  task,
  draft,
  spots,
  fallbackTimeZones,
  onClose,
  onSaved,
}: {
  brandId: string;
  /** The promotion to edit, or null for a new one. */
  task: BrandTask | null;
  draft: PromotionDraft | null;
  /** Every spot of the brand (drafts included). */
  spots: AdminSpot[];
  /** Time zones of the brand's cities, when it has no spots yet. */
  fallbackTimeZones: string[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Form>(() => formFrom(task, draft));
  const [errors, setErrors] = useState<Errors>({});
  /** Range problems show once a save was attempted, then update live. */
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const [createTask, { loading: creating }] = useMutation<{ createBrandTask: BrandTask }>(CREATE_BRAND_TASK, {
    update: (cache) => evictRoot(cache, ['brandTasks', 'brandPromotions']),
  });
  const [updateTask, { loading: updating }] = useMutation<{ updateBrandTask: BrandTask }>(UPDATE_BRAND_TASK, {
    update: (cache) => evictRoot(cache, ['brandPromotions']),
  });
  const busy = creating || updating;

  const multiplierPercent =
    form.multiplierChoice === 'custom' ? parseMultiplier(form.customMultiplier) : form.multiplierChoice;
  const multiplierValid =
    multiplierPercent !== null && multiplierPercent >= CUSTOM_MULTIPLIER_MIN && multiplierPercent <= CUSTOM_MULTIPLIER_MAX;
  const windows = form.scheduleMode === 'always' ? [] : windowsFromRanges(form.ranges);
  const rangeCheck = validateRanges(form.ranges);
  const scheduleValid =
    form.scheduleMode === 'always' || (!rangeCheck.tooManyWindows && rangeCheck.rangeErrors.every((e) => e === null));

  const spotOptions = useMemo(
    () =>
      [...spots]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => {
          const st = spotStatus(s);
          return {
            id: s.id,
            label: st === 'ACTIVE' ? s.name : `${s.name} · ${t(`Spots.status_${st}`)}`,
          };
        }),
    [spots, t],
  );
  const scopeSpots = form.spotMode === 'all' ? spots : spots.filter((s) => form.spotIds.includes(s.id));
  const zoneSet = new Set(scopeSpots.map((s) => s.timezone).filter(Boolean));
  if (zoneSet.size === 0) for (const z of fallbackTimeZones) zoneSet.add(z);
  const timeZones = [...zoneSet].sort();

  const validate = (): Errors => {
    const errs: Errors = {};
    if (!localizedToFilledInput(form.title).text) errs.title = t('Promotions.errTitle');
    if (!multiplierValid) errs.multiplier = t('Promotions.errMultiplier');
    if (form.scheduleMode === 'hours' && !scheduleValid) errs.schedule = t('Promotions.errSchedule');
    if (form.startsOn && form.endsOn && form.endsOn < form.startsOn) errs.dates = t('Promotions.errDates');
    if (form.spotMode === 'selected' && form.spotIds.length === 0) errs.spots = t('Promotions.errSpots');
    if (!form.appliesToOrders && !form.appliesToTemplateAwards) errs.appliesTo = t('Promotions.errAppliesTo');
    return errs;
  };

  const input = (): BrandTaskInput => {
    const title = localizedToFilledInput(form.title);
    return {
      kind: 'POINTS_MULTIPLIER',
      title: title.text ?? '',
      titleLocal: title.local,
      // The console does not edit descriptions: keep the stored ones.
      description: task?.description ?? null,
      descriptionLocal: task?.descriptionLocal ?? null,
      multiplierPercent: multiplierPercent ?? 0,
      appliesToOrders: form.appliesToOrders,
      appliesToTemplateAwards: form.appliesToTemplateAwards,
      startsOn: form.startsOn || null,
      endsOn: form.endsOn || null,
      windows,
      spotIds: form.spotMode === 'all' ? [] : form.spotIds,
    };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      if (task) {
        await updateTask({ variables: { id: task.id, input: input() } });
        onSaved(t('Promotions.saved'));
      } else {
        const res = await createTask({ variables: { brandId, input: input() } });
        onSaved(t('Promotions.created', { title: res.data?.createBrandTask.title ?? '' }));
      }
      onClose();
    } catch (err) {
      const field = errorField(err);
      const section = errorCode(err) === 'BRAND_TASK_INVALID' && field ? FIELD_SECTION[field] : undefined;
      if (section) setErrors({ [section]: t(`Promotions.serverField_${section}`) });
      else setError(errorText(err, t('Promotions.failedSave')));
    }
  };

  const previewTitle = localizedToFilledInput(form.title).text ?? t('Promotions.previewUntitled');
  // The preview shows only the ranges that are complete and valid.
  const previewWindows =
    form.scheduleMode === 'always'
      ? []
      : windowsFromRanges(form.ranges.filter((_, i) => rangeCheck.rangeErrors[i] === null));
  const previewLines =
    form.scheduleMode === 'hours' && previewWindows.length === 0
      ? [t('Promotions.previewNoHours')]
      : scheduleLines(previewWindows, {
          always: t('Promotions.scheduleAlways'),
          everyDay: t('Promotions.everyDay'),
          allDay: t('Promotions.allDay'),
        });

  return (
    <Modal title={task ? t('Promotions.editTitle') : t('Promotions.createTitle')} onClose={onClose} size="lg" busy={busy}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <LocalizedTextFields
          label={t('Promotions.fieldName')}
          value={form.title}
          onChange={(v) => set('title', v)}
          maxLength={PROMOTION_TITLE_MAX}
          error={errors.title}
          hint={t('Promotions.nameHint')}
        />

        <Section title={t('Promotions.fieldMultiplier')} error={errors.multiplier}>
          <div className="flex flex-wrap items-center gap-2">
            {MULTIPLIER_PRESETS.map((p) => (
              <ChoiceChip key={p} active={form.multiplierChoice === p} onClick={() => set('multiplierChoice', p)}>
                {fmtMultiplier(p)}
              </ChoiceChip>
            ))}
            <ChoiceChip active={form.multiplierChoice === 'custom'} onClick={() => set('multiplierChoice', 'custom')}>
              {t('Promotions.custom')}
            </ChoiceChip>
            {form.multiplierChoice === 'custom' && (
              <span className="flex items-center gap-1 text-sm text-gray-600">
                ×
                <Input
                  className="w-24"
                  inputMode="decimal"
                  aria-label={t('Promotions.customMultiplier')}
                  placeholder="1.5"
                  value={form.customMultiplier}
                  invalid={!!errors.multiplier}
                  onChange={(e) => set('customMultiplier', e.target.value)}
                />
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">{t('Promotions.multiplierHint')}</p>
        </Section>

        <Section title={t('Promotions.fieldSchedule')} error={errors.schedule}>
          <div className="mb-3 flex flex-wrap gap-4 text-sm">
            <Radio checked={form.scheduleMode === 'hours'} onChange={() => set('scheduleMode', 'hours')}>
              {t('Promotions.scheduleHours')}
            </Radio>
            <Radio checked={form.scheduleMode === 'always'} onChange={() => set('scheduleMode', 'always')}>
              {t('Promotions.scheduleAlways')}
            </Radio>
          </div>
          {form.scheduleMode === 'hours' && (
            <ScheduleEditor
              ranges={form.ranges}
              onChange={(next) => set('ranges', next)}
              rangeErrors={submitted ? rangeCheck.rangeErrors : null}
              tooManyWindows={rangeCheck.tooManyWindows}
              disabled={busy}
            />
          )}
        </Section>

        <Section title={t('Promotions.fieldDates')} error={errors.dates}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('Promotions.startsOn')}>
              {(id) => <Input id={id} type="date" value={form.startsOn} onChange={(e) => set('startsOn', e.target.value)} />}
            </Field>
            <Field label={t('Promotions.endsOn')}>
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  min={form.startsOn || undefined}
                  value={form.endsOn}
                  onChange={(e) => set('endsOn', e.target.value)}
                />
              )}
            </Field>
          </div>
          <p className="mt-1 text-xs text-gray-500">{t('Promotions.datesHint')}</p>
        </Section>

        <Section title={t('Promotions.fieldSpots')} error={errors.spots}>
          <div className="mb-3 flex flex-wrap gap-4 text-sm">
            <Radio checked={form.spotMode === 'all'} onChange={() => set('spotMode', 'all')}>
              {t('Promotions.spotsAll')}
            </Radio>
            <Radio checked={form.spotMode === 'selected'} onChange={() => set('spotMode', 'selected')}>
              {t('Promotions.spotsSelected')}
            </Radio>
          </div>
          {form.spotMode === 'selected' && (
            <ChipMultiSelect
              options={spotOptions}
              value={form.spotIds}
              onChange={(next) => set('spotIds', next)}
              disabled={busy}
              emptyText={t('Promotions.noSpots')}
            />
          )}
        </Section>

        <Section title={t('Promotions.fieldAppliesTo')} error={errors.appliesTo}>
          <div className="space-y-2 text-sm">
            <Check checked={form.appliesToOrders} onChange={(v) => set('appliesToOrders', v)} hint={t('Promotions.appliesOrdersHint')}>
              {t('Promotions.appliesOrders')}
            </Check>
            <Check
              checked={form.appliesToTemplateAwards}
              onChange={(v) => set('appliesToTemplateAwards', v)}
              hint={t('Promotions.appliesCounterHint')}
            >
              {t('Promotions.appliesCounter')}
            </Check>
          </div>
        </Section>

        <div className="space-y-1 rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-800">
          <p>
            {timeZones.length > 0
              ? t('Promotions.localTimeHint', { zones: timeZones.join(', ') })
              : t('Promotions.localTimeHintNoZones')}
          </p>
          <p>{t('Promotions.overlapNote')}</p>
          <p>{t('Promotions.futureOnlyNote')}</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">{t('Promotions.preview')}</p>
          <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
              {multiplierValid ? fmtMultiplier(multiplierPercent) : '×?'}
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-gray-900">{previewTitle}</p>
              {previewLines.map((line) => (
                <p key={line} className="text-gray-700">
                  {line}
                </p>
              ))}
              <p className="text-gray-500">{datesText({ startsOn: form.startsOn || null, endsOn: form.endsOn || null }, t)}</p>
              <p className="text-gray-500">
                {form.spotMode === 'all'
                  ? t('Promotions.allSpots')
                  : scopeSpots.map((s) => s.name).join(', ') || '—'}
              </p>
              {multiplierValid && (
                <p className="mt-1 text-xs text-gray-500">
                  {t('Promotions.previewExample', { base: 100, result: multiplierPercent })}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={modalActionsClass}>
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={busy}>
            {t('Common.cancel')}
          </Button>
          <Button type="submit" className="flex-1" loading={busy} loadingText={t('Common.saving')}>
            {task ? t('Common.save') : t('Promotions.createSubmit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Section({ title, error, children }: { title: string; error?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-gray-700">{title}</legend>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}

function ChoiceChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'border-brand bg-brand-light text-brand' : 'border-gray-300 text-gray-700 hover:border-gray-400'
      }`}
    >
      {children}
    </button>
  );
}

function Radio({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-gray-700">
      <input type="radio" className="accent-brand" checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}

function Check({
  checked,
  onChange,
  hint,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-gray-700">
      <input type="checkbox" className="mt-0.5 accent-brand" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block font-medium text-gray-800">{children}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}

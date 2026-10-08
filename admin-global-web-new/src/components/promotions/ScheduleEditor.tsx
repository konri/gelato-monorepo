import { useTranslation } from 'react-i18next';
import {
  ISO_DAYS,
  MAX_SCHEDULE_WINDOWS,
  dayLong,
  dayShort,
  newRange,
  type RangeError,
  type ScheduleRange,
} from '../../lib/schedule';
import { Input } from '../ui/Field';
import { Button } from '../ui/Button';

/**
 * Time ranges of a promotion (BRANDS_SPEC §3.3): each range has day chips,
 * From / To and "Until midnight". Ranges are turned into one window per day;
 * a range can't cross midnight (add a second range for the next day).
 */
export function ScheduleEditor({
  ranges,
  onChange,
  rangeErrors,
  tooManyWindows,
  disabled = false,
}: {
  ranges: ScheduleRange[];
  onChange: (next: ScheduleRange[]) => void;
  /** Shown only after a submit attempt. */
  rangeErrors: (RangeError | null)[] | null;
  tooManyWindows: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  const update = (key: string, patch: Partial<ScheduleRange>) =>
    onChange(ranges.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const toggleDay = (range: ScheduleRange, day: number) =>
    update(range.key, {
      days: range.days.includes(day)
        ? range.days.filter((d) => d !== day)
        : [...range.days, day].sort((a, b) => a - b),
    });

  return (
    <div className="space-y-3">
      {ranges.map((range, index) => {
        const error = rangeErrors?.[index] ?? null;
        return (
          <div
            key={range.key}
            className={`rounded-lg border p-3 ${error ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Promotions.days')}>
                {ISO_DAYS.map((day) => {
                  const on = range.days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      aria-pressed={on}
                      title={dayLong(day)}
                      onClick={() => toggleDay(range, day)}
                      className={`min-h-11 min-w-[2.75rem] rounded-full border px-2.5 py-1 text-xs md:min-h-0 font-semibold capitalize transition-colors disabled:opacity-60 ${
                        on ? 'border-brand bg-brand text-white' : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {dayShort(day)}
                    </button>
                  );
                })}
              </div>
              {ranges.length > 1 && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(ranges.filter((r) => r.key !== range.key))}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                >
                  {t('Promotions.removeRange')}
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">{t('Promotions.from')}</span>
                <Input
                  type="time"
                  step={60}
                  className="w-32"
                  disabled={disabled}
                  value={range.from}
                  onChange={(e) => update(range.key, { from: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">{t('Promotions.to')}</span>
                <Input
                  type="time"
                  step={60}
                  className="w-32"
                  disabled={disabled || range.untilMidnight}
                  value={range.untilMidnight ? '' : range.to}
                  onChange={(e) => update(range.key, { to: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 pb-2.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="accent-brand"
                  disabled={disabled}
                  checked={range.untilMidnight}
                  onChange={(e) => update(range.key, { untilMidnight: e.target.checked })}
                />
                {t('Promotions.untilMidnight')}
              </label>
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{t(`Promotions.${error}`)}</p>}
          </div>
        );
      })}
      {tooManyWindows && (
        <p className="text-xs text-red-600">{t('Promotions.errTooManyWindows', { max: MAX_SCHEDULE_WINDOWS })}</p>
      )}
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={() => onChange([...ranges, newRange()])}
      >
        {t('Promotions.addRange')}
      </Button>
    </div>
  );
}

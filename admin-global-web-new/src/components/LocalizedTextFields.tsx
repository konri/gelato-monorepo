import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Input, Textarea } from './ui/Field';
import { LOCALIZED_LANGS, type LocalizedValue } from '../lib/localizedText';

type LocalizedTextFieldsProps = {
  label: ReactNode;
  value: LocalizedValue;
  onChange: (next: LocalizedValue) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  error?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
};

/**
 * Canonical text plus optional PL / EN / UA translations (BRANDS_SPEC §3.3).
 * The translations sit behind a toggle and open by themselves when one is set.
 */
export function LocalizedTextFields({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  maxLength,
  error,
  hint,
  disabled = false,
}: LocalizedTextFieldsProps) {
  const { t } = useTranslation();
  const hasTranslation = LOCALIZED_LANGS.some((lang) => value[lang].trim() !== '');
  const [open, setOpen] = useState(hasTranslation);
  const showTranslations = open || hasTranslation;

  const set = (key: keyof LocalizedValue, text: string) => onChange({ ...value, [key]: text });

  return (
    <div className="space-y-2">
      <Field
        label={label}
        error={error}
        hint={hint ?? t('Localized.canonicalHint')}
        action={
          !hasTranslation && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-xs font-semibold text-brand hover:underline"
            >
              {open ? t('Localized.hideTranslations') : t('Localized.addTranslations')}
            </button>
          )
        }
      >
        {(id, invalid) =>
          multiline ? (
            <Textarea
              id={id}
              rows={rows}
              invalid={invalid}
              value={value.canonical}
              maxLength={maxLength}
              disabled={disabled}
              onChange={(e) => set('canonical', e.target.value)}
            />
          ) : (
            <Input
              id={id}
              invalid={invalid}
              value={value.canonical}
              maxLength={maxLength}
              disabled={disabled}
              onChange={(e) => set('canonical', e.target.value)}
            />
          )
        }
      </Field>
      {showTranslations && (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">{t('Localized.translationsHint')}</p>
          {LOCALIZED_LANGS.map((lang) => (
            <Field key={lang} label={t(`Localized.lang_${lang}`)}>
              {(id) =>
                multiline ? (
                  <Textarea
                    id={id}
                    rows={Math.max(2, rows - 1)}
                    value={value[lang]}
                    maxLength={maxLength}
                    disabled={disabled}
                    onChange={(e) => set(lang, e.target.value)}
                  />
                ) : (
                  <Input
                    id={id}
                    value={value[lang]}
                    maxLength={maxLength}
                    disabled={disabled}
                    onChange={(e) => set(lang, e.target.value)}
                  />
                )
              }
            </Field>
          ))}
        </div>
      )}
    </div>
  );
}

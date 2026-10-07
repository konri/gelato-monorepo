import { useTranslation } from 'react-i18next';
import { passwordProblems, type PasswordRule } from '../lib/constants';

const RULES: PasswordRule[] = ['length', 'upper', 'lower', 'digit'];

/** Live checklist of the backend's password rules. */
export function PasswordRules({ password }: { password: string }) {
  const { t } = useTranslation();
  const missing = new Set(passwordProblems(password));
  return (
    <ul className="space-y-0.5 text-xs">
      {RULES.map((rule) => {
        const ok = !missing.has(rule);
        return (
          <li key={rule} className={ok ? 'text-green-600' : 'text-gray-500'}>
            <span aria-hidden className="mr-1.5 inline-block w-3">
              {ok ? '✓' : '•'}
            </span>
            {t(`Password.rule_${rule}`)}
          </li>
        );
      })}
    </ul>
  );
}

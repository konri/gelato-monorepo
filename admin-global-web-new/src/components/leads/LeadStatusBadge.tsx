import { useTranslation } from 'react-i18next';
import type { BusinessLeadStatus, BusinessType } from '../../graphql/leads';
import { Badge, type BadgeTone } from '../ui/Badge';

/** New = blue (to triage), contacted = amber (in progress), approved = green, declined = red. */
const STATUS_TONE: Record<BusinessLeadStatus, BadgeTone> = {
  NEW: 'blue',
  CONTACTED: 'amber',
  APPROVED: 'green',
  DECLINED: 'red',
};

export function LeadStatusBadge({ status }: { status: BusinessLeadStatus }) {
  const { t } = useTranslation();
  return <Badge tone={STATUS_TONE[status] ?? 'gray'}>{t(`Requests.status_${status}`, { defaultValue: status })}</Badge>;
}

/** The request's business types as small grey chips. */
export function BusinessTypeChips({ types }: { types: readonly BusinessType[] }) {
  const { t } = useTranslation();
  if (types.length === 0) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((type) => (
        <span key={type} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
          {t(`Requests.type_${type}`, { defaultValue: type })}
        </span>
      ))}
    </div>
  );
}

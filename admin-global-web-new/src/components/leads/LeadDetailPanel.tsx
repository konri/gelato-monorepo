import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import {
  BUSINESS_LEAD,
  BUSINESS_LEAD_STATUSES,
  LEAD_STATUS_REFETCH,
  UPDATE_BUSINESS_LEAD,
  type BusinessLead,
  type BusinessLeadStatus,
  type UpdateBusinessLeadVariables,
} from '../../graphql/leads';
import { errorText } from '../../lib/errors';
import { fmtDateTime, fmtNumber } from '../../lib/format';
import { Alert } from '../ui/Alert';
import { Button, ButtonLink } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CopyButton } from '../ui/CopyButton';
import { Textarea } from '../ui/Field';
import { FullPageSpinner } from '../ui/FullPageSpinner';
import type { ButtonVariant } from '../ui/buttonClass';
import { BusinessTypeChips, LeadStatusBadge } from './LeadStatusBadge';
import type { CreateBrandPrefill } from '../../pages/CreateBrandPage';

/** Client cap of the internal note (the request's own message allows 2000). */
const NOTE_MAX = 2000;

// The console's primary colour is red, so only "Create brand" is primary;
// Decline is the one red-outlined (destructive-looking) action.
const ACTION_VARIANT: Record<BusinessLeadStatus, ButtonVariant> = {
  CONTACTED: 'secondary',
  APPROVED: 'secondary',
  DECLINED: 'dangerOutline',
  NEW: 'secondary',
};

/**
 * Prefill for the create-brand form. Passed as router state, not query
 * params, so the contact's name and email stay out of the URL and history.
 */
function createBrandPrefill(lead: BusinessLead): CreateBrandPrefill {
  return {
    name: lead.companyName,
    adminName: lead.contactName,
    adminEmail: lead.email,
    maxSpots: lead.spotsCount,
    adminLanguage: lead.language ?? null,
  };
}

/**
 * One partnership request in a side panel (opened by ?id= on the Requests
 * page): every field, the status actions, the internal note and, once
 * approved, "Create brand from this request".
 */
export function LeadDetailPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useTranslation();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { data, loading, error, refetch } = useQuery<{ businessLead: BusinessLead | null }>(BUSINESS_LEAD, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const lead = data?.businessLead ?? null;

  const [updateStatus] = useMutation<{ updateBusinessLead: BusinessLead }, UpdateBusinessLeadVariables>(
    UPDATE_BUSINESS_LEAD,
    { refetchQueries: LEAD_STATUS_REFETCH },
  );
  const [busyStatus, setBusyStatus] = useState<BusinessLeadStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape closes the panel (the decline dialog handles its own Escape).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmDecline && !busyStatus) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, confirmDecline, busyStatus]);

  const setStatus = async (status: BusinessLeadStatus): Promise<boolean> => {
    if (!lead) return false;
    setStatusError(null);
    setBusyStatus(status);
    try {
      await updateStatus({ variables: { id: lead.id, status } });
      return true;
    } catch (err) {
      setStatusError(errorText(err, t('Requests.failedStatus')));
      return false;
    } finally {
      setBusyStatus(null);
    }
  };

  const onAction = (status: BusinessLeadStatus) => {
    if (status === 'DECLINED') {
      setStatusError(null);
      setConfirmDecline(true);
      return;
    }
    void setStatus(status);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-black/30" onClick={() => !busyStatus && onClose()} />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="break-words text-lg font-bold text-gray-900">
              {lead?.companyName ?? t('Requests.detailTitle')}
            </h2>
            {lead && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <LeadStatusBadge status={lead.status} />
                <span>{t('Requests.receivedAt', { date: fmtDateTime(lead.createdAt) })}</span>
              </div>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={!!busyStatus}
            aria-label={t('Common.close')}
            className="-mr-2 -mt-1 rounded-lg px-2 py-1 text-lg leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!lead && loading && <FullPageSpinner inline />}
          {!lead && error && (
            <Alert
              tone="error"
              action={
                <Button size="sm" variant="secondary" onClick={() => void refetch()}>
                  {t('Common.retry')}
                </Button>
              }
            >
              {errorText(error)}
            </Alert>
          )}
          {!lead && !loading && !error && data && <Alert tone="warning">{t('Requests.notFound')}</Alert>}

          {lead && (
            <div className="space-y-6">
              <section className="space-y-3">
                <StatusHistory lead={lead} />
                {statusError && !confirmDecline && <Alert tone="error">{statusError}</Alert>}
                {lead.status === 'APPROVED' && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <ButtonLink to="/brands/new" state={{ prefill: createBrandPrefill(lead) }} className="w-full">
                      {t('Requests.createBrand')}
                    </ButtonLink>
                    <p className="mt-2 text-xs text-green-800">{t('Requests.createBrandHint')}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_LEAD_STATUSES.filter((s) => s !== lead.status).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={ACTION_VARIANT[status]}
                      disabled={!!busyStatus}
                      loading={busyStatus === status}
                      loadingText={t('Common.saving')}
                      onClick={() => onAction(status)}
                    >
                      {t(`Requests.action_${status}`)}
                    </Button>
                  ))}
                </div>
              </section>

              <DetailSection title={t('Requests.sectionContact')}>
                <DetailRow label={t('Requests.contactName')}>{lead.contactName}</DetailRow>
                <DetailRow label={t('Common.email')}>
                  <ContactValue href={`mailto:${lead.email}`} value={lead.email} label={t('Common.email')} />
                </DetailRow>
                <DetailRow label={t('Common.phone')}>
                  <ContactValue href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`} value={lead.phone} label={t('Common.phone')} />
                </DetailRow>
                <DetailRow label={t('Requests.formLanguage')}>
                  {lead.language ? t(`Language.${lead.language.toLowerCase()}`) : '—'}
                </DetailRow>
              </DetailSection>

              <DetailSection title={t('Requests.sectionBusiness')}>
                <DetailRow label={t('Requests.company')}>{lead.companyName}</DetailRow>
                <DetailRow label={t('Requests.city')}>{lead.city || '—'}</DetailRow>
                <DetailRow label={t('Requests.types')}>
                  <BusinessTypeChips types={lead.businessTypes} />
                </DetailRow>
                <DetailRow label={t('Requests.locations')}>{fmtNumber(lead.spotsCount)}</DetailRow>
                <DetailRow label={t('Requests.currentSystem')}>{lead.currentSystem || '—'}</DetailRow>
              </DetailSection>

              <DetailSection title={t('Requests.sectionMessage')}>
                {lead.message?.trim() ? (
                  <p className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
                    {lead.message}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">{t('Requests.noMessage')}</p>
                )}
              </DetailSection>

              <NoteEditor key={lead.id} lead={lead} />
            </div>
          )}
        </div>
      </aside>

      {confirmDecline && lead && (
        <ConfirmDialog
          title={t('Requests.declineTitle', { company: lead.companyName })}
          body={t('Requests.declineBody')}
          confirmLabel={t('Requests.declineConfirm')}
          tone="danger"
          busy={busyStatus === 'DECLINED'}
          error={statusError}
          onCancel={() => setConfirmDecline(false)}
          onConfirm={() => {
            void setStatus('DECLINED').then((ok) => ok && setConfirmDecline(false));
          }}
        />
      )}
    </div>
  );
}

/** "Marked as contacted by {name}, {date}" for the last status change, if any. */
function StatusHistory({ lead }: { lead: BusinessLead }) {
  const { t } = useTranslation();
  if (!lead.statusChangedAt) return null;
  const date = fmtDateTime(lead.statusChangedAt);
  const name = lead.statusChangedBy?.name?.trim();
  return (
    <p className="text-sm text-gray-500">
      {name
        ? t(`Requests.history_${lead.status}`, { name, date })
        : t(`Requests.historyAnon_${lead.status}`, { date })}
    </p>
  );
}

function DetailSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
      <dl className="space-y-2.5">{children}</dl>
    </section>
  );
}

function DetailRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-gray-900">{children}</dd>
    </div>
  );
}

function ContactValue({ href, value, label }: { href: string; value: string; label: string }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <a href={href} className="min-w-0 break-all font-medium text-brand hover:underline">
        {value}
      </a>
      <CopyButton value={value} label={label} />
    </span>
  );
}

/** The internal note: a textarea with Save (updateBusinessLead, adminNote only). */
function NoteEditor({ lead }: { lead: BusinessLead }) {
  const { t } = useTranslation();
  const fieldId = useId();
  const saved = lead.adminNote ?? '';
  const [draft, setDraft] = useState(saved);
  const [baseline, setBaseline] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [save, { loading }] = useMutation<{ updateBusinessLead: BusinessLead }, UpdateBusinessLeadVariables>(
    UPDATE_BUSINESS_LEAD,
  );

  // The note changed on the server (another session): follow it unless edited here.
  if (saved !== baseline) {
    setBaseline(saved);
    if (draft.trim() === baseline.trim()) setDraft(saved);
  }

  const dirty = draft.trim() !== saved.trim();

  const submit = async () => {
    setError(null);
    setJustSaved(false);
    try {
      // An empty string clears the note.
      const res = await save({ variables: { id: lead.id, adminNote: draft.trim() } });
      setDraft(res.data?.updateBusinessLead.adminNote ?? '');
      setJustSaved(true);
    } catch (err) {
      setError(errorText(err, t('Requests.failedNote')));
    }
  };

  return (
    <section>
      <label htmlFor={fieldId} className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
        {t('Requests.note')}
      </label>
      {error && (
        <Alert tone="error" className="mb-2">
          {error}
        </Alert>
      )}
      <Textarea
        id={fieldId}
        rows={4}
        maxLength={NOTE_MAX}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setJustSaved(false);
        }}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {dirty ? (
            <span className="text-amber-700">{t('Requests.noteUnsaved')}</span>
          ) : justSaved ? (
            <span className="text-green-700">{t('Requests.noteSaved')}</span>
          ) : (
            t('Requests.noteHint')
          )}
        </p>
        <Button size="sm" onClick={() => void submit()} disabled={!dirty} loading={loading} loadingText={t('Common.saving')}>
          {t('Common.save')}
        </Button>
      </div>
    </section>
  );
}

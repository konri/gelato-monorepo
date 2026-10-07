import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams, type To } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import {
  BUSINESS_LEADS,
  BUSINESS_LEAD_STATUSES,
  type BusinessLead,
  type BusinessLeadCounts,
  type BusinessLeadPage,
  type BusinessLeadStatus,
} from '../graphql/leads';
import { errorText } from '../lib/errors';
import { fmtDateTime, fmtNumber } from '../lib/format';
import { useLeadCounts } from '../components/leads/useLeadCounts';
import { BusinessTypeChips, LeadStatusBadge } from '../components/leads/LeadStatusBadge';
import { LeadDetailPanel } from '../components/leads/LeadDetailPanel';
import { PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { Input } from '../components/ui/Field';
import { FullPageSpinner, Spinner } from '../components/ui/FullPageSpinner';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 350;

type Filter = 'ALL' | BusinessLeadStatus;
const FILTERS: Filter[] = ['ALL', ...BUSINESS_LEAD_STATUSES];

const COUNT_KEY: Record<Filter, keyof BusinessLeadCounts> = {
  ALL: 'total',
  NEW: 'new',
  CONTACTED: 'contacted',
  APPROVED: 'approved',
  DECLINED: 'declined',
};

function filterFrom(raw: string | null): Filter {
  return (BUSINESS_LEAD_STATUSES as readonly string[]).includes(raw ?? '') ? (raw as BusinessLeadStatus) : 'ALL';
}

function pageFrom(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 1 ? n : 1;
}

/** What the list shows; mirrored in the URL as ?status=&q=&page=. */
type View = { filter: Filter; q: string; page: number };

const viewKey = (v: View) => `${v.filter}|${v.page}|${v.q}`;

/**
 * PLATFORM: partnership requests from the /for-business form. URL:
 * ?status=&q=&page=&id= — status chips with counts, a server-side search
 * (debounced), pages of PAGE_SIZE and the request in a side panel (?id=).
 */
export function RequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const openId = params.get('id');

  const setParam = useCallback(
    (changes: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // The list's variables live in state, set at once by the controls (go) and
  // mirrored to the URL. BrowserRouter applies navigations in a transition and
  // useQuery re-observes during render, so variables read straight from the
  // URL would briefly flip back and re-request the previous page. The state
  // follows the URL whenever it changes (back / forward, the sidebar link).
  const urlView: View = {
    filter: filterFrom(params.get('status')),
    q: params.get('q') ?? '',
    page: pageFrom(params.get('page')),
  };
  const [view, setView] = useState<View>(urlView);
  const [seenUrlKey, setSeenUrlKey] = useState(() => viewKey(urlView));
  const [input, setInput] = useState(urlView.q);
  if (viewKey(urlView) !== seenUrlKey) {
    setSeenUrlKey(viewKey(urlView));
    if (viewKey(urlView) !== viewKey(view)) setView(urlView);
    if (urlView.q !== view.q) setInput(urlView.q);
  }
  const { filter, q, page } = view;

  const go = useCallback(
    (changes: Partial<View>) => {
      const next = { ...view, ...changes };
      setView(next);
      setParam({
        status: next.filter === 'ALL' ? null : next.filter,
        q: next.q || null,
        page: next.page > 1 ? String(next.page) : null,
      });
    },
    [view, setParam],
  );

  // The search box writes ?q= debounced.
  useEffect(() => {
    if (input === q) return;
    const id = window.setTimeout(() => go({ q: input, page: 1 }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [input, q, go]);

  const search = q.trim();
  const list = useQuery<{ businessLeads: BusinessLeadPage }>(BUSINESS_LEADS, {
    variables: {
      status: filter === 'ALL' ? null : filter,
      search: search || null,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    },
    fetchPolicy: 'cache-and-network',
  });
  const counts = useLeadCounts().data?.businessLeadCounts;

  // While another filter / page / search loads, keep the last page on screen (dimmed).
  const shown = list.data?.businessLeads ?? list.previousData?.businessLeads;
  const stale = !list.data && !!shown;
  const items = shown?.items ?? [];
  const total = shown?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const detailTo = (id: string): To => {
    const next = new URLSearchParams(params);
    next.set('id', id);
    return { search: `?${next.toString()}` };
  };
  const goToPage = (n: number) => {
    go({ page: n });
    window.scrollTo({ top: 0 });
  };
  const closeDetail = useCallback(() => setParam({ id: null }), [setParam]);

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = from + items.length - 1;

  return (
    <div className="mx-auto w-full max-w-6xl p-6 sm:p-8">
      <PageHeader title={t('Requests.title')} subtitle={t('Requests.subtitle')} />

      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <FilterChip
              key={f}
              active={filter === f}
              onClick={() => go({ filter: f, page: 1 })}
              count={counts?.[COUNT_KEY[f]]}
            >
              {t(`Requests.filter_${f}`)}
            </FilterChip>
          ))}
        </div>
        <div className="relative max-w-xl">
          <Input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('Requests.searchPlaceholder')}
            aria-label={t('Requests.searchPlaceholder')}
            className="pr-10"
          />
          {list.loading && shown && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <Spinner className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      {list.error && (
        <Alert
          tone="error"
          className="mb-4"
          action={
            <Button size="sm" variant="secondary" onClick={() => void list.refetch()}>
              {t('Common.retry')}
            </Button>
          }
        >
          {errorText(list.error)}
        </Alert>
      )}

      {list.loading && (!shown || (stale && items.length === 0)) && <FullPageSpinner inline />}

      {shown && !stale && items.length === 0 && (
        <NoResults
          filter={filter}
          search={search}
          page={page}
          onClearSearch={() => {
            setInput('');
            go({ q: '', page: 1 });
          }}
          onFirstPage={() => goToPage(1)}
        />
      )}

      {items.length > 0 && (
        <div className={`transition-opacity ${stale ? 'opacity-60' : ''}`} aria-busy={list.loading || undefined}>
          {/* Wide screens: a table. */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white xl:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('Requests.colReceived')}</th>
                  <th className="px-4 py-3 font-semibold">{t('Requests.colCompany')}</th>
                  <th className="px-4 py-3 font-semibold">{t('Requests.colCity')}</th>
                  <th className="px-4 py-3 font-semibold">{t('Requests.colTypes')}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t('Requests.colLocations')}</th>
                  <th className="px-4 py-3 font-semibold">{t('Requests.colContact')}</th>
                  <th className="px-4 py-3 font-semibold">{t('Requests.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(detailTo(lead.id))}
                    className={`cursor-pointer align-top ${openId === lead.id ? 'bg-brand-light/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{fmtDateTime(lead.createdAt)}</td>
                    <td className="max-w-[14rem] px-4 py-3">
                      <Link
                        to={detailTo(lead.id)}
                        onClick={(e) => e.stopPropagation()}
                        className={`break-words text-gray-900 hover:text-brand ${lead.status === 'NEW' ? 'font-semibold' : 'font-medium'}`}
                      >
                        {lead.companyName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.city || '—'}</td>
                    <td className="px-4 py-3">
                      <BusinessTypeChips types={lead.businessTypes} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{fmtNumber(lead.spotsCount)}</td>
                    <td className="max-w-[14rem] px-4 py-3">
                      <span className="block truncate text-gray-900" title={lead.contactName}>
                        {lead.contactName}
                      </span>
                      <span className="block truncate text-xs text-gray-500" title={lead.email}>
                        {lead.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Narrower screens: cards. */}
          <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
            {items.map((lead) => (
              <li key={lead.id}>
                <LeadCard lead={lead} to={detailTo(lead.id)} selected={openId === lead.id} />
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
            <span>{t('Requests.range', { from, to, total })}</span>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                  {t('Requests.prev')}
                </Button>
                <span className="px-1">{t('Requests.pageOf', { page, pages })}</span>
                <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => goToPage(page + 1)}>
                  {t('Requests.next')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {openId && <LeadDetailPanel key={openId} id={openId} onClose={closeDetail} />}
    </div>
  );
}

function LeadCard({ lead, to, selected }: { lead: BusinessLead; to: To; selected: boolean }) {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      className={`block h-full rounded-xl border bg-white p-4 transition-shadow hover:shadow-md ${
        selected ? 'border-brand' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`break-words text-gray-900 ${lead.status === 'NEW' ? 'font-semibold' : 'font-medium'}`}>
            {lead.companyName}
          </p>
          <p className="text-xs text-gray-500">{fmtDateTime(lead.createdAt)}</p>
        </div>
        <LeadStatusBadge status={lead.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-gray-400">{t('Requests.colCity')}</dt>
          <dd className="truncate text-gray-700">{lead.city || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400">{t('Requests.colLocations')}</dt>
          <dd className="tabular-nums text-gray-700">{fmtNumber(lead.spotsCount)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-gray-400">{t('Requests.colContact')}</dt>
          <dd className="truncate text-gray-700">{lead.contactName}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-gray-400">{t('Requests.colTypes')}</dt>
          <dd>
            <BusinessTypeChips types={lead.businessTypes} />
          </dd>
        </div>
      </dl>
    </Link>
  );
}

function NoResults({
  filter,
  search,
  page,
  onClearSearch,
  onFirstPage,
}: {
  filter: Filter;
  search: string;
  page: number;
  onClearSearch: () => void;
  onFirstPage: () => void;
}) {
  const { t } = useTranslation();
  if (page > 1) {
    return (
      <EmptyState
        title={t('Requests.pageEmpty')}
        action={
          <Button variant="secondary" onClick={onFirstPage}>
            {t('Requests.firstPage')}
          </Button>
        }
      />
    );
  }
  if (search) {
    return (
      <EmptyState
        title={t('Requests.noMatch', { q: search })}
        action={
          <Button variant="secondary" onClick={onClearSearch}>
            {t('Requests.clearSearch')}
          </Button>
        }
      />
    );
  }
  if (filter !== 'ALL') return <EmptyState title={t('Requests.emptyStatus')} />;
  return <EmptyState title={t('Requests.empty')} description={t('Requests.emptyHint')} />;
}

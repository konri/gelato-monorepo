import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { BUSINESS_LEAD_COUNTS, type BusinessLeadCounts } from '../../graphql/leads';

const POLL_MS = 60_000;
/** Focus and visibility events often fire together: one refetch for both. */
const FOCUS_REFETCH_GAP_MS = 5_000;

const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

/**
 * Partnership request counters (businessLeadCounts). `live`: polled every
 * 60 s (skipped while the tab is hidden) and refetched when the window
 * regains focus — the sidebar badge. Every caller shares one cache entry, so
 * the Requests page's chips follow the badge's polling.
 */
export function useLeadCounts({ live = false, skip = false }: { live?: boolean; skip?: boolean } = {}) {
  const query = useQuery<{ businessLeadCounts: BusinessLeadCounts }>(BUSINESS_LEAD_COUNTS, {
    skip,
    fetchPolicy: 'cache-and-network',
    pollInterval: live && !skip ? POLL_MS : undefined,
    skipPollAttempt: hidden,
  });
  const { refetch } = query;

  useEffect(() => {
    if (!live || skip) return;
    let last = 0;
    const onFocus = () => {
      if (hidden()) return;
      const now = Date.now();
      if (now - last < FOCUS_REFETCH_GAP_MS) return;
      last = now;
      refetch().catch(() => {
        // The badge just keeps its last value.
      });
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [live, skip, refetch]);

  return query;
}

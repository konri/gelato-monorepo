import type { ApolloCache, ApolloClient, TypePolicies } from '@apollo/client';

/**
 * Apollo cache policies (BRANDS_SPEC §3.4).
 * - BrandAdminView has no id of its own: it is keyed by its brand's id, and its
 *   embedded settings / quota merge.
 * - StaffContext is a singleton; StaffSpot is keyed by spotId.
 * - BrandPromotion is a computed view (not normalized); BrandTask.windows is
 *   always replaced as a whole.
 * Every scoped query passes brandId in its variables, so two brands never
 * share a root field entry.
 */
export const typePolicies: TypePolicies = {
  Query: {
    fields: {
      businessLead: {
        // `existing` is null after the server answered "not found": keep it
        // (a redirect to the missing entity would refetch forever).
        read(existing, { args, toReference }) {
          if (existing !== undefined || typeof args?.id !== 'string') return existing;
          return toReference({ __typename: 'BusinessLead', id: args.id });
        },
      },
    },
  },
  BusinessLeadCounts: { keyFields: [] },
  BrandAdminView: {
    keyFields: ['brand', ['id']],
    fields: {
      settings: { merge: true },
      quota: { merge: true },
    },
  },
  StaffContext: { keyFields: [] },
  StaffSpot: { keyFields: ['spotId'] },
  BrandPromotion: { keyFields: false },
  BrandTask: {
    fields: {
      windows: { merge: false },
    },
  },
};

/**
 * Drops root fields (all argument variants) so lists whose membership changed
 * refetch on their next read, e.g. evictRoot(cache, ['brandSpots', 'myAdminSpots']).
 */
export function evictRoot(cache: ApolloCache, fieldNames: readonly string[]): void {
  for (const fieldName of fieldNames) cache.evict({ id: 'ROOT_QUERY', fieldName });
  cache.gc();
}

/**
 * The named queries that are on screen now, for refetchQueries after a
 * mutation whose effects reach queries that may not be mounted (the brand
 * list, a brand view): Apollo warns "Unknown query" for a name it can't find.
 * Those lists use cache-and-network, so they refresh when they are shown.
 * Usage: `refetchQueries: () => mountedQueries(client, ['AdminBrand', 'AdminBrands'])`.
 */
export function mountedQueries(client: ApolloClient, names: readonly string[]): string[] {
  const mounted = new Set<string>();
  client.getObservableQueries('active').forEach((q) => {
    if (q.queryName) mounted.add(q.queryName);
  });
  return names.filter((name) => mounted.has(name));
}

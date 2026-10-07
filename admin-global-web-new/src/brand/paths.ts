/** URLs of the brand pages for a scope (BRANDS_SPEC §3.2). */

export type BrandScopeSource = 'self' | 'param';

export type BrandPaths = {
  /** Profile / home of the brand. */
  home: string;
  spots: string;
  newSpot: string;
  editSpot: (spotId: string) => string;
  rewards: string;
  promotions: string;
  staff: string;
  /** Staff page filtered to a spot, optionally with the invite dialog open. */
  staffFor: (opts: { spotId?: string; invite?: boolean }) => string;
  orders: string;
  ordersFor: (spotId: string) => string;
};

export function brandPaths(source: BrandScopeSource, brandId: string): BrandPaths {
  const base = source === 'self' ? '' : `/brands/${encodeURIComponent(brandId)}`;
  const staff = `${base}/staff`;
  return {
    home: source === 'self' ? '/brand' : base,
    spots: `${base}/spots`,
    newSpot: `${base}/spots/new`,
    editSpot: (spotId) => `${base}/spots/${encodeURIComponent(spotId)}/edit`,
    rewards: `${base}/rewards`,
    promotions: `${base}/promotions`,
    staff,
    staffFor: ({ spotId, invite }) => {
      const params = new URLSearchParams();
      if (invite) params.set('invite', '1');
      if (spotId) params.set('spot', spotId);
      const query = params.toString();
      return query ? `${staff}?${query}` : staff;
    },
    orders: `${base}/orders`,
    ordersFor: (spotId) => `${base}/orders?spot=${encodeURIComponent(spotId)}`,
  };
}

import { StatsContext } from './statsContext'

export type StoreMetricCoverageKind = 'FULL_MERCHANT' | 'STORE_SCOPED_PARTIAL'

export function resolveStoreMetricCoverage(ctx: StatsContext): StoreMetricCoverageKind {
  return ctx.storeIds === null ? 'FULL_MERCHANT' : 'STORE_SCOPED_PARTIAL'
}

export function buildStatsDataScopeNotes(ctx: StatsContext): string[] {
  const notes: string[] = []
  if (ctx.storeIds !== null) {
    notes.push(
      'Store filter applies to stamp transactions, point ledger, coupon usage, streak visits, and orders. Loyalty cards, user rewards, coupon configuration aggregates, and coupon claims (UserCoupon.createdAt) remain merchant-wide.'
    )
  }
  if (ctx.loyaltyCardTemplateId) {
    notes.push(
      'Loyalty card template filter narrows stamp and card program metrics. Points, coupons, rewards, orders, and locations are not filtered by card template.'
    )
  }
  if (ctx.streakProgramId) {
    notes.push(
      'Streak program filter narrows streak metrics and the streak branch of active-user unions; other channels in the union are unchanged.'
    )
  }
  notes.push('Campaign-level attribution (coupon to stamp in the same visit) is not available in the data model yet.')
  return notes
}

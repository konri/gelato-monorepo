import 'reflect-metadata'
import { Args, ArgsType, Authorized, Ctx, Field, Query, Resolver } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { buildStatsRequestContext } from '../utils/statsContext'
import { parseTrendGranularity } from '../utils/trendGranularity'
import { computeMerchantStatsBundlePayload } from '../services/merchantStatsBundleService'
import { computeOrdersTrendStats, computeStreakVisitsTrendStats } from '../services/trendsStatsService'
import { computeStatsMetricDeltas } from '../utils/statsMetricDeltas'
import { buildStatsDataScopeNotes, resolveStoreMetricCoverage } from '../utils/statsAnalyticsNotes'
import {
  MerchantStatsBundle,
  MerchantStatsOrdersTrendsResult,
  MerchantStatsStreakVisitsTrendsResult,
  StatsBundleAnalytics,
  StatsCompareMode,
  StatsMetricDeltaRow,
  StatsStoreMetricCoverage,
  StatsTrendGranularity,
} from './MerchantStatsTypes'
import {
  mapCompareMode,
  payloadToBundle,
  periodOf,
  toStatsOrdersTrends,
  toStatsStreakVisitsTrends,
} from './merchantStatsBundleMapper'

type MerchantStatsFilterFields = {
  from?: string
  to?: string
  merchantId?: string
  storeId?: string
  storeIds?: string[]
  loyaltyCardTemplateId?: string
  streakProgramId?: string
  compareMode?: StatsCompareMode
}

function applyMerchantStatsFiltersToQuery(q: Record<string, unknown>, args: MerchantStatsFilterFields): void {
  if (args.from !== undefined && args.from !== '') q.from = args.from
  if (args.to !== undefined && args.to !== '') q.to = args.to
  if (args.merchantId !== undefined && args.merchantId !== '') q.merchantId = args.merchantId
  if (args.storeId !== undefined && args.storeId !== '') q.storeId = args.storeId
  if (args.storeIds !== undefined && args.storeIds.length > 0) q.storeIds = args.storeIds
  if (args.loyaltyCardTemplateId !== undefined && args.loyaltyCardTemplateId !== '') {
    q.loyaltyCardTemplateId = args.loyaltyCardTemplateId
  }
  if (args.streakProgramId !== undefined && args.streakProgramId !== '') q.streakProgramId = args.streakProgramId
  if (args.compareMode !== undefined) q.compareMode = args.compareMode
}

@ArgsType()
class MerchantStatsBundleArgs implements MerchantStatsFilterFields {
  @Field({ nullable: true })
  from?: string

  @Field({ nullable: true })
  to?: string

  @Field({ nullable: true })
  merchantId?: string

  @Field({ nullable: true })
  storeId?: string

  @Field(() => [String], { nullable: true })
  storeIds?: string[]

  @Field({ nullable: true })
  loyaltyCardTemplateId?: string

  @Field({ nullable: true })
  streakProgramId?: string

  @Field(() => StatsCompareMode, { nullable: true })
  compareMode?: StatsCompareMode
}

@ArgsType()
class MerchantStatsTrendWindowArgs implements MerchantStatsFilterFields {
  @Field({ nullable: true })
  from?: string

  @Field({ nullable: true })
  to?: string

  @Field({ nullable: true })
  merchantId?: string

  @Field({ nullable: true })
  storeId?: string

  @Field(() => [String], { nullable: true })
  storeIds?: string[]

  @Field({ nullable: true })
  loyaltyCardTemplateId?: string

  @Field({ nullable: true })
  streakProgramId?: string

  @Field(() => StatsCompareMode, { nullable: true })
  compareMode?: StatsCompareMode

  @Field(() => StatsTrendGranularity)
  granularity!: StatsTrendGranularity
}

function toBundleQueryRecord(args: MerchantStatsBundleArgs): Record<string, unknown> {
  const q: Record<string, unknown> = {}
  applyMerchantStatsFiltersToQuery(q, args)
  return q
}

function toTrendWindowQueryRecord(args: MerchantStatsTrendWindowArgs): Record<string, unknown> {
  const q: Record<string, unknown> = {}
  applyMerchantStatsFiltersToQuery(q, args)
  q.granularity = args.granularity
  return q
}

@Resolver()
export class MerchantStatsResolver {
  @Authorized([Role.ADMIN, Role.OWNER, Role.COOPERATOR])
  @Query(() => MerchantStatsBundle)
  async merchantStatsBundle(@Ctx() ctx: Context, @Args() args: MerchantStatsBundleArgs): Promise<MerchantStatsBundle> {
    const user = ctx.req.user
    if (!user) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    const query = toBundleQueryRecord(args)
    const { primary, comparison, compareMode } = await buildStatsRequestContext(ctx.prisma, user, query)

    const [primaryPayload, comparisonPayload] = await Promise.all([
      computeMerchantStatsBundlePayload(ctx.prisma, primary),
      comparison ? computeMerchantStatsBundlePayload(ctx.prisma, comparison) : Promise.resolve(null),
    ])

    const main = payloadToBundle(primaryPayload)

    const analytics = new StatsBundleAnalytics()
    analytics.generatedAt = new Date().toISOString()
    analytics.compareMode = mapCompareMode(compareMode)
    analytics.primaryPeriod = periodOf({
      from: primary.from.toISOString(),
      to: primary.to.toISOString(),
    })
    analytics.comparisonPeriod =
      comparison === null
        ? null
        : periodOf({
            from: comparison.from.toISOString(),
            to: comparison.to.toISOString(),
          })
    analytics.filtersEcho = {
      merchantId: primary.merchantId,
      storeIds: primary.storeIds,
      loyaltyCardTemplateId: primary.loyaltyCardTemplateId,
      streakProgramId: primary.streakProgramId,
      from: primary.from.toISOString(),
      to: primary.to.toISOString(),
      compareMode,
    }
    analytics.storeMetricCoverage =
      resolveStoreMetricCoverage(primary) === 'FULL_MERCHANT'
        ? StatsStoreMetricCoverage.FULL_MERCHANT
        : StatsStoreMetricCoverage.STORE_SCOPED_PARTIAL
    analytics.dataScopeNotes = buildStatsDataScopeNotes(primary)

    if (comparisonPayload !== null) {
      const deltas = computeStatsMetricDeltas(primaryPayload, comparisonPayload)
      analytics.metricDeltas = deltas.map((d) => {
        const row = new StatsMetricDeltaRow()
        row.path = d.path
        row.current = d.current
        row.previous = d.previous
        row.delta = d.delta
        row.deltaPct = d.deltaPct
        return row
      })
    } else {
      analytics.metricDeltas = null
    }

    main.analytics = analytics
    if (comparisonPayload !== null) {
      const cmp = payloadToBundle(comparisonPayload)
      cmp.analytics = null
      cmp.comparison = null
      main.comparison = cmp
    } else {
      main.comparison = null
    }

    return main
  }

  @Authorized([Role.ADMIN, Role.OWNER, Role.COOPERATOR])
  @Query(() => MerchantStatsOrdersTrendsResult)
  async merchantStatsTrendOrders(
    @Ctx() ctx: Context,
    @Args() args: MerchantStatsTrendWindowArgs
  ): Promise<MerchantStatsOrdersTrendsResult> {
    const user = ctx.req.user
    if (!user) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    const query = toTrendWindowQueryRecord(args)
    const { primary, comparison } = await buildStatsRequestContext(ctx.prisma, user, query)
    const granularity = parseTrendGranularity(query)

    const [primaryPayload, comparisonPayload] = await Promise.all([
      computeOrdersTrendStats(ctx.prisma, primary, granularity),
      comparison ? computeOrdersTrendStats(ctx.prisma, comparison, granularity) : Promise.resolve(null),
    ])

    const result = new MerchantStatsOrdersTrendsResult()
    result.primary = toStatsOrdersTrends(primaryPayload)
    result.comparison = comparisonPayload !== null ? toStatsOrdersTrends(comparisonPayload) : null
    return result
  }

  @Authorized([Role.ADMIN, Role.OWNER, Role.COOPERATOR])
  @Query(() => MerchantStatsStreakVisitsTrendsResult)
  async merchantStatsTrendStreakVisits(
    @Ctx() ctx: Context,
    @Args() args: MerchantStatsTrendWindowArgs
  ): Promise<MerchantStatsStreakVisitsTrendsResult> {
    const user = ctx.req.user
    if (!user) {
      throw new ErrorWithStatus(401, 'Unauthorized')
    }

    const query = toTrendWindowQueryRecord(args)
    const { primary, comparison } = await buildStatsRequestContext(ctx.prisma, user, query)
    const granularity = parseTrendGranularity(query)

    const [primaryPayload, comparisonPayload] = await Promise.all([
      computeStreakVisitsTrendStats(ctx.prisma, primary, granularity),
      comparison ? computeStreakVisitsTrendStats(ctx.prisma, comparison, granularity) : Promise.resolve(null),
    ])

    const result = new MerchantStatsStreakVisitsTrendsResult()
    result.primary = toStatsStreakVisitsTrends(primaryPayload)
    result.comparison = comparisonPayload !== null ? toStatsStreakVisitsTrends(comparisonPayload) : null
    return result
  }
}

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { StatsDateRange } from './statsDateRange'

dayjs.extend(utc)

export type StatsCompareMode = 'none' | 'previous_period' | 'previous_year'

export function parseStatsCompareMode(raw: unknown): StatsCompareMode {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (s === 'previous_period' || s === 'previous_year') {
    return s
  }
  return 'none'
}

/**
 * Same calendar span shifted back by the primary window length (instant-aligned).
 */
export function previousPeriodRange(primary: StatsDateRange): StatsDateRange {
  const durationMs = primary.to.getTime() - primary.from.getTime()
  return {
    from: new Date(primary.from.getTime() - durationMs),
    to: new Date(primary.to.getTime() - durationMs),
  }
}

export function previousYearRange(primary: StatsDateRange): StatsDateRange {
  return {
    from: dayjs.utc(primary.from).subtract(1, 'year').toDate(),
    to: dayjs.utc(primary.to).subtract(1, 'year').toDate(),
  }
}

export function resolveComparisonDateRange(primary: StatsDateRange, mode: StatsCompareMode): StatsDateRange | null {
  if (mode === 'none') return null
  if (mode === 'previous_period') return previousPeriodRange(primary)
  return previousYearRange(primary)
}

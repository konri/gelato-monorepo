import type { TrendGranularity } from './trendGranularity'

export function startOfTrendBucketUtc(at: Date, granularity: TrendGranularity): Date {
  const y = at.getUTCFullYear()
  const mo = at.getUTCMonth()
  const d = at.getUTCDate()
  if (granularity === 'day') {
    return new Date(Date.UTC(y, mo, d))
  }
  if (granularity === 'month') {
    return new Date(Date.UTC(y, mo, 1))
  }
  const dayStart = new Date(Date.UTC(y, mo, d))
  const dow = dayStart.getUTCDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  dayStart.setUTCDate(dayStart.getUTCDate() + mondayOffset)
  return dayStart
}

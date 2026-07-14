import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { firstString } from './queryHelpers'

dayjs.extend(utc)

export type StatsDateRange = {
  from: Date
  to: Date
}

function parseIsoDate(value: unknown, label: string): Date | null {
  const s = firstString(value)
  if (s === undefined || s === '') {
    return null
  }
  const d = dayjs.utc(s)
  if (!d.isValid()) {
    throw new ErrorWithStatus(400, `${label} must be a valid ISO date string`)
  }
  return d.toDate()
}

/**
 * Parses optional `from` / `to` query params as UTC boundaries.
 * When omitted, uses the last 30 days ending at the current instant.
 */
export function parseStatsDateRange(query: Record<string, unknown>): StatsDateRange {
  const rawFrom = firstString(query.from) ?? firstString(query.fromDate)
  const rawTo = firstString(query.to) ?? firstString(query.toDate)

  const to = parseIsoDate(rawTo, 'to') ?? new Date()
  let from = parseIsoDate(rawFrom, 'from')

  if (!from) {
    from = dayjs.utc(to).subtract(30, 'day').toDate()
  }

  if (from.getTime() > to.getTime()) {
    throw new ErrorWithStatus(400, 'from must be before or equal to to')
  }

  return { from, to }
}

import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { firstString } from './queryHelpers'

export type TrendGranularity = 'day' | 'week' | 'month'

/**
 * Parses `granularity` from GraphQL args / query map: `day` | `week` | `month` (default `day`).
 */
export function parseTrendGranularity(query: Record<string, unknown>): TrendGranularity {
  const raw = firstString(query.granularity)?.toLowerCase()
  if (raw === 'week' || raw === 'month' || raw === 'day') {
    return raw
  }
  if (raw === undefined || raw === '') {
    return 'day'
  }
  throw new ErrorWithStatus(400, 'granularity must be one of: day, week, month')
}

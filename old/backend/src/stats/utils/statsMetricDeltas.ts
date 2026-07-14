import type { MerchantStatsBundlePayload } from '../services/merchantStatsBundleService'

const SKIP_KEYS = new Set([
  'period',
  'merchantId',
  'storeScopeApplied',
  'granularity',
  'series',
  'locations',
  'topRewardsInPeriod',
  'topCouponsByUsage',
  'programBreakdown',
])

export type StatsMetricDeltaRow = {
  path: string
  current: number
  previous: number
  delta: number
  deltaPct: number | null
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function collectNumericLeaves(obj: unknown, prefix: string, out: Map<string, number>): void {
  if (obj === null || obj === undefined) return
  if (typeof obj === 'number' && Number.isFinite(obj)) {
    out.set(prefix, obj)
    return
  }
  if (!isPlainObject(obj)) return
  for (const [k, v] of Object.entries(obj)) {
    if (SKIP_KEYS.has(k)) continue
    const path = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'number' && Number.isFinite(v)) {
      out.set(path, v)
    } else if (isPlainObject(v)) {
      collectNumericLeaves(v, path, out)
    }
  }
}

export function computeStatsMetricDeltas(
  current: MerchantStatsBundlePayload,
  previous: MerchantStatsBundlePayload
): StatsMetricDeltaRow[] {
  const curMap = new Map<string, number>()
  const prevMap = new Map<string, number>()
  collectNumericLeaves(current, '', curMap)
  collectNumericLeaves(previous, '', prevMap)

  const paths = new Set([...curMap.keys(), ...prevMap.keys()])
  const rows: StatsMetricDeltaRow[] = []
  for (const path of [...paths].sort()) {
    const c = curMap.get(path) ?? 0
    const p = prevMap.get(path) ?? 0
    const delta = c - p
    const deltaPct = p !== 0 ? Math.round((delta / p) * 10000) / 10000 : null
    rows.push({ path, current: c, previous: p, delta, deltaPct })
  }
  return rows
}

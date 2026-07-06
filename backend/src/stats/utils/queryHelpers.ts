import { Request } from 'express'
import { UserJWT } from '../../Auth/model/UserJWT'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'

export function merchantStoreIdScopeWhere(
  storeIds: string[] | null
): { merchantStoreId: { in: string[] } } | Record<string, never> {
  if (storeIds === null) {
    return {}
  }
  return { merchantStoreId: { in: storeIds } }
}

export function parseStoreIdsFromQuery(query: Record<string, unknown>): string[] | undefined {
  const raw = query.storeIds
  if (Array.isArray(raw)) {
    const ids = raw.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((s) => s.trim())
    return ids.length ? ids : undefined
  }
  const single = typeof raw === 'string' ? raw : undefined
  if (single?.includes(',')) {
    const ids = single
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
    return ids.length ? ids : undefined
  }
  return undefined
}

export function firstString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const head = value[0]
    return typeof head === 'string' ? head : undefined
  }
  return typeof value === 'string' ? value : undefined
}

export function extractUser(req: Request): UserJWT {
  const user = req.user as UserJWT | undefined
  if (!user?.id || !user?.roles) {
    throw new ErrorWithStatus(401, 'Unauthorized')
  }
  return user
}

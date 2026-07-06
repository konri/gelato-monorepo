import { LoyaltyStampCardTemplate, Prisma, PrismaClient } from '@prisma/client'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { getStampTemplateEarnBlockReason, stampTemplateEarnBlockedMessage } from './stampTemplateSchedule'

type StampTemplateDb = PrismaClient | Prisma.TransactionClient

export async function ensureStampTemplateUsableForCardActivation(
  db: StampTemplateDb,
  params: { templateId: string; merchantId: string; now?: Date }
): Promise<LoyaltyStampCardTemplate> {
  const template = await db.loyaltyStampCardTemplate.findUnique({
    where: { id: params.templateId },
  })

  if (!template) {
    throw new ErrorWithStatus(404, 'Template not found')
  }

  if (template.merchantId !== params.merchantId) {
    throw new ErrorWithStatus(400, 'Template does not belong to this merchant')
  }

  const block = getStampTemplateEarnBlockReason(template, params.now)
  if (block) {
    throw new ErrorWithStatus(400, stampTemplateEarnBlockedMessage(block))
  }

  return template
}

export async function resolveStampTemplateForEarn(
  db: StampTemplateDb,
  params: { merchantId: string; templateId?: string | null; now?: Date }
): Promise<LoyaltyStampCardTemplate> {
  const now = params.now ?? new Date()

  if (params.templateId) {
    const row = await db.loyaltyStampCardTemplate.findFirst({
      where: { id: params.templateId, merchantId: params.merchantId, isActive: true },
    })

    if (!row) {
      throw new ErrorWithStatus(400, 'Stamp program template not found or inactive for this merchant')
    }

    const block = getStampTemplateEarnBlockReason(row, now)
    if (block) {
      throw new ErrorWithStatus(400, stampTemplateEarnBlockedMessage(block))
    }

    return row
  }

  const candidates = await db.loyaltyStampCardTemplate.findMany({
    where: { merchantId: params.merchantId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  const usable = candidates.find((row) => !getStampTemplateEarnBlockReason(row, now))
  if (usable) {
    return usable
  }

  if (candidates.length > 0) {
    const block = getStampTemplateEarnBlockReason(candidates[0], now)
    if (block) {
      throw new ErrorWithStatus(400, stampTemplateEarnBlockedMessage(block))
    }
  }

  throw new ErrorWithStatus(400, 'No active loyalty stamp program is configured for this merchant')
}

export function buildAvailableStampTemplatesWhere(params: {
  merchantId?: string
  now?: Date
}): Prisma.LoyaltyStampCardTemplateWhereInput {
  const now = params.now ?? new Date()
  return {
    isActive: true,
    ...(params.merchantId ? { merchantId: params.merchantId } : {}),
    AND: [
      { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
      { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
    ],
  }
}

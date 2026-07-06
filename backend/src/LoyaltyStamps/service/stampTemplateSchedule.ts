import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'

export type StampTemplateScheduleCheck = {
  isActive: boolean
  validFrom?: Date | null
  validUntil?: Date | null
}

export function assertValidStampTemplateDateRange(validFrom?: Date | null, validUntil?: Date | null): void {
  if (validFrom && validUntil && validFrom.getTime() > validUntil.getTime()) {
    throw new ErrorWithStatus(400, 'Stamp program valid-until date must be on or after the valid-from date')
  }
}

export type StampTemplateEarnBlock = 'INACTIVE' | 'NOT_YET_ACTIVE' | 'EXPIRED'

export function getStampTemplateEarnBlockReason(
  template: StampTemplateScheduleCheck,
  now: Date = new Date()
): StampTemplateEarnBlock | null {
  if (!template.isActive) {
    return 'INACTIVE'
  }
  if (template.validFrom && now < template.validFrom) {
    return 'NOT_YET_ACTIVE'
  }
  if (template.validUntil && now > template.validUntil) {
    return 'EXPIRED'
  }
  return null
}

export function stampTemplateEarnBlockedMessage(block: StampTemplateEarnBlock): string {
  switch (block) {
    case 'INACTIVE':
      return 'Stamp program is turned off'
    case 'NOT_YET_ACTIVE':
      return 'Stamp program is not active yet (before valid-from date)'
    case 'EXPIRED':
      return 'Stamp program validity has ended'
  }
}

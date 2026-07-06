import { CouponType } from '@prisma/client'
import type { Coupon as PrismaCoupon } from '@prisma/client'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'

dayjs.extend(utc)
dayjs.extend(timezone)

const COUPON_RULES_TIMEZONE = process.env.COUPON_RULES_TIMEZONE ?? 'Europe/Warsaw'

export function isWithinBirthdayWindow(
  now: Date,
  birthDate: Date,
  daysBeforeBirthday: number | null,
  daysAfterBirthday: number | null
): boolean {
  const before = daysBeforeBirthday ?? 0
  const after = daysAfterBirthday ?? 0
  const today = dayjs(now).tz(COUPON_RULES_TIMEZONE).startOf('day')
  const birth = dayjs(birthDate).tz(COUPON_RULES_TIMEZONE)
  const month = birth.month()
  const date = birth.date()

  for (const yearOffset of [-1, 0, 1] as const) {
    const center = today
      .year(today.year() + yearOffset)
      .month(month)
      .date(date)
      .startOf('day')
    const start = center.subtract(before, 'day')
    const end = center.add(after, 'day')
    if (
      (today.isAfter(start, 'day') || today.isSame(start, 'day')) &&
      (today.isBefore(end, 'day') || today.isSame(end, 'day'))
    ) {
      return true
    }
  }
  return false
}

export function assertBirthdayRulesForClaimOrUse(
  couponType: CouponType,
  birthDate: Date | null,
  daysBeforeBirthday: number | null,
  daysAfterBirthday: number | null,
  now: Date
): void {
  if (couponType !== CouponType.BIRTHDAY) {
    return
  }
  if (!birthDate) {
    throw new ErrorWithStatus(400, 'COUPON_BIRTHDAY_REQUIRES_PROFILE_DATE')
  }
  if (!isWithinBirthdayWindow(now, birthDate, daysBeforeBirthday, daysAfterBirthday)) {
    throw new ErrorWithStatus(400, 'COUPON_BIRTHDAY_OUTSIDE_WINDOW')
  }
}

export function assertDayOfWeekMatchesNow(effective: PrismaCoupon, now: Date): void {
  if (effective.couponType !== CouponType.DAY_OF_WEEK) {
    return
  }
  const expected = effective.dayOfWeek?.trim()
  if (!expected) {
    throw new ErrorWithStatus(500, 'COUPON_DAY_OF_WEEK_MISCONFIGURED')
  }
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: COUPON_RULES_TIMEZONE,
  }).format(now)
  if (weekday.toLowerCase() !== expected.toLowerCase()) {
    throw new ErrorWithStatus(400, 'COUPON_WRONG_DAY_OF_WEEK')
  }
}

export function assertActingUserMatchesAssignee(effective: PrismaCoupon, actingUserId: string): void {
  if (effective.assignToUserId && effective.assignToUserId !== actingUserId) {
    throw new ErrorWithStatus(403, 'COUPON_USE_ASSIGNEE_ONLY')
  }
}

export function assertCouponClaimAllowed(input: {
  userId: string
  birthDate: Date | null
  now: Date
  baseCurrentUses: number
  effective: PrismaCoupon
}): void {
  const { userId, birthDate, now, baseCurrentUses, effective } = input
  if (!effective.isActive) {
    throw new ErrorWithStatus(400, 'Coupon not found or inactive')
  }
  if (now < effective.validFrom || now > effective.validUntil) {
    throw new ErrorWithStatus(400, 'Coupon is not valid at this time')
  }
  if (effective.assignToUserId && effective.assignToUserId !== userId) {
    throw new ErrorWithStatus(403, 'COUPON_CLAIM_ASSIGNEE_ONLY')
  }
  if (effective.globalUsageLimit != null && baseCurrentUses >= effective.globalUsageLimit) {
    throw new ErrorWithStatus(410, 'COUPON_GLOBAL_POOL_EXHAUSTED')
  }
  assertBirthdayRulesForClaimOrUse(
    effective.couponType,
    birthDate,
    effective.daysBeforeBirthday,
    effective.daysAfterBirthday,
    now
  )
  assertDayOfWeekMatchesNow(effective, now)
}

export function assertCouponUseAllowed(input: {
  actingUserId: string
  birthDate: Date | null
  now: Date
  userCouponIsUsed: boolean
  userUsageCount: number
  baseCurrentUses: number
  effective: PrismaCoupon
}): void {
  const { actingUserId, birthDate, now, userCouponIsUsed, userUsageCount, baseCurrentUses, effective } = input
  if (userCouponIsUsed) {
    throw new ErrorWithStatus(409, 'Coupon has already been used')
  }
  if (now < effective.validFrom || now > effective.validUntil) {
    throw new ErrorWithStatus(400, 'Coupon is not valid at this time')
  }
  assertActingUserMatchesAssignee(effective, actingUserId)
  const perUserCap = effective.usesPerUserLimit ?? 1
  if (userUsageCount >= perUserCap) {
    throw new ErrorWithStatus(409, 'COUPON_USER_USES_EXHAUSTED')
  }
  if (effective.globalUsageLimit != null && baseCurrentUses >= effective.globalUsageLimit) {
    throw new ErrorWithStatus(410, 'COUPON_GLOBAL_POOL_EXHAUSTED')
  }
  assertBirthdayRulesForClaimOrUse(
    effective.couponType,
    birthDate,
    effective.daysBeforeBirthday,
    effective.daysAfterBirthday,
    now
  )
  assertDayOfWeekMatchesNow(effective, now)
}

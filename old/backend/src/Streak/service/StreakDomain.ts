export type StreakPolicyValue = 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type StreakBenefitTypeValue = 'REWARD' | 'INFO_ONLY' | 'POINTS_MULTIPLIER' | 'FIXED_POINTS'

export type StageSnapshot = {
  id?: string
  dayThreshold: number
  benefitType: StreakBenefitTypeValue
  rewardId?: string
  infoMessage?: string
  pointsMultiplier?: number
  pointsAmount?: number
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000

const startOfWeekUtc = (value: Date): Date => {
  const date = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
  const day = date.getUTCDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diffToMonday)
  return date
}

const resolveBasePeriodIndex = (date: Date, streakingPolicy: StreakPolicyValue): number => {
  if (streakingPolicy === 'WEEKLY') {
    const weekStart = startOfWeekUtc(date)
    return Math.floor(weekStart.getTime() / (7 * DAY_IN_MILLISECONDS))
  }

  if (streakingPolicy === 'MONTHLY') {
    return date.getUTCFullYear() * 12 + date.getUTCMonth()
  }

  return Math.floor(date.getTime() / DAY_IN_MILLISECONDS)
}

export const resolvePeriodDifference = (
  lastDate: Date,
  currentDate: Date,
  streakingPolicy: StreakPolicyValue,
  streakingInterval: number
): number => {
  const safeInterval = Math.max(1, streakingInterval)
  const lastPeriodIndex = resolveBasePeriodIndex(lastDate, streakingPolicy)
  const currentPeriodIndex = resolveBasePeriodIndex(currentDate, streakingPolicy)
  return Math.floor(currentPeriodIndex / safeInterval) - Math.floor(lastPeriodIndex / safeInterval)
}

export const countAchievedRewards = (currentStreak: number, stages: StageSnapshot[], repeatable: boolean): number => {
  if (currentStreak < 1 || stages.length < 1) {
    return 0
  }

  if (!repeatable) {
    return stages.filter((stage) => stage.dayThreshold <= currentStreak).length
  }

  const cycleLength = stages[stages.length - 1].dayThreshold
  if (cycleLength < 1) {
    return 0
  }

  const fullCycles = Math.floor(currentStreak / cycleLength)
  const remainder = currentStreak % cycleLength
  const rewardsInRemainder = stages.filter((stage) => stage.dayThreshold <= remainder).length
  return fullCycles * stages.length + rewardsInRemainder
}

export const resolveNextClaimableStage = (input: {
  currentStreak: number
  claimedRewardsCount: number
  stages: StageSnapshot[]
  repeatable: boolean
}): { stage: StageSnapshot; cycleNumber: number } | null => {
  const achievedRewardsCount = countAchievedRewards(input.currentStreak, input.stages, input.repeatable)
  if (achievedRewardsCount <= input.claimedRewardsCount) {
    return null
  }

  if (!input.repeatable) {
    const achievedStages = input.stages.filter((stage) => stage.dayThreshold <= input.currentStreak)
    const stage = achievedStages[input.claimedRewardsCount]
    if (!stage) {
      return null
    }
    return { stage, cycleNumber: 1 }
  }

  const stageCount = input.stages.length
  const stageIndex = input.claimedRewardsCount % stageCount
  const cycleNumber = Math.floor(input.claimedRewardsCount / stageCount) + 1
  const stage = input.stages[stageIndex]
  if (!stage) {
    return null
  }
  return { stage, cycleNumber }
}

export const resolveDateInTimezone = (value: Date, timezone: string): Date => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(value)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Cannot resolve local date')
  }

  return new Date(`${year}-${month}-${day}T00:00:00.000Z`)
}

import { registerEnumType } from 'type-graphql'

export enum StreakBenefitType {
  REWARD = 'REWARD',
  INFO_ONLY = 'INFO_ONLY',
  POINTS_MULTIPLIER = 'POINTS_MULTIPLIER',
  FIXED_POINTS = 'FIXED_POINTS',
}

registerEnumType(StreakBenefitType, {
  name: 'StreakBenefitType',
  description: 'Type of effect granted when a streak stage is claimed',
})

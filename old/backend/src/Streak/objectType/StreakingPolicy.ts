import { registerEnumType } from 'type-graphql'

export enum StreakingPolicy {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

registerEnumType(StreakingPolicy, {
  name: 'StreakingPolicy',
  description: 'How streak continuity is measured',
})

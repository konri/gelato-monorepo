import { OperatorScopeMode as PrismaOperatorScopeMode } from '@prisma/client'
import { registerEnumType } from 'type-graphql'

export const OperatorScopeMode = PrismaOperatorScopeMode
export type OperatorScopeModeType = typeof OperatorScopeMode[keyof typeof OperatorScopeMode]

registerEnumType(OperatorScopeMode, {
  name: 'OperatorScopeMode',
  description: 'Operator scope mode',
})

import { OperatorPermission as PrismaOperatorPermission } from '@prisma/client'
import { registerEnumType } from 'type-graphql'

export const OperatorPermission = PrismaOperatorPermission
export type OperatorPermissionType = typeof OperatorPermission[keyof typeof OperatorPermission]

registerEnumType(OperatorPermission, {
  name: 'OperatorPermission',
  description: 'Granular operator permission',
})

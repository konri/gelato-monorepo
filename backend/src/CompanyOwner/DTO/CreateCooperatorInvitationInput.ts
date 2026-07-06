import { Field, InputType, Int } from 'type-graphql'
import { OperatorScopeMode, OperatorScopeModeType } from '../../Cooperator/objectType/OperatorScopeMode'
import { OperatorPermission, OperatorPermissionType } from '../../Cooperator/objectType/OperatorPermission'

@InputType()
export class CreateCooperatorInvitationInput {
  @Field(() => String)
  email: string

  @Field(() => String, { nullable: true })
  displayName?: string

  @Field(() => OperatorScopeMode)
  scopeMode: OperatorScopeModeType

  @Field(() => [OperatorPermission])
  permissions: OperatorPermissionType[]

  @Field(() => Boolean, { defaultValue: true })
  storeScopeAll: boolean

  @Field(() => [String], { nullable: true })
  storeIds?: string[]

  @Field(() => Int, { nullable: true })
  expiresInHours?: number
}

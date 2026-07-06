import { Field, InputType } from 'type-graphql'
import { OperatorScopeMode, OperatorScopeModeType } from '../../Cooperator/objectType/OperatorScopeMode'
import { OperatorPermission, OperatorPermissionType } from '../../Cooperator/objectType/OperatorPermission'

@InputType()
export class UpdateCooperatorAccessInput {
  @Field(() => String)
  cooperatorId: string

  @Field(() => OperatorScopeMode)
  scopeMode: OperatorScopeModeType

  @Field(() => [OperatorPermission])
  permissions: OperatorPermissionType[]

  @Field(() => Boolean, { defaultValue: true })
  storeScopeAll: boolean

  @Field(() => [String], { nullable: true })
  storeIds?: string[]
}

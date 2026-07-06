import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { Cooperator } from '../../Cooperator/objectType/Cooperator'
import { OperatorScopeMode, OperatorScopeModeType } from '../../Cooperator/objectType/OperatorScopeMode'
import { OperatorPermission, OperatorPermissionType } from '../../Cooperator/objectType/OperatorPermission'
import { CompanyOwner } from './CompanyOwner'

@ObjectType()
export class CooperatorCompany {
  @Field(() => ID)
  id: string

  @Field(() => String)
  displayName: string

  @Field(() => Cooperator)
  cooperator: Cooperator

  @Field(() => CompanyOwner)
  companyOwner: CompanyOwner

  @Field(() => OperatorScopeMode)
  scopeMode: OperatorScopeModeType

  @Field(() => [OperatorPermission])
  permissions: OperatorPermissionType[]

  @Field(() => Boolean)
  storeScopeAll: boolean

  @Field(() => [String])
  storeIds: string[]

  @Field()
  createdAt: Date

  @Authorized(Role.ADMIN)
  @Field()
  updatedAt: Date
}

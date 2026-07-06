import { Field, ID, ObjectType } from 'type-graphql'
import { OperatorScopeMode, OperatorScopeModeType } from './OperatorScopeMode'
import { OperatorPermission, OperatorPermissionType } from './OperatorPermission'
import { CooperatorInvitationPreviewStatus } from './CooperatorInvitationPreviewStatus'

@ObjectType()
export class CooperatorInvitation {
  @Field(() => ID)
  id: string

  @Field(() => String)
  email: string

  @Field(() => OperatorScopeMode)
  scopeMode: OperatorScopeModeType

  @Field(() => [OperatorPermission])
  permissions: OperatorPermissionType[]

  @Field(() => Boolean)
  storeScopeAll: boolean

  @Field(() => [String])
  storeIds: string[]

  @Field(() => String)
  companyOwnerId: string

  @Field(() => String, { nullable: true })
  merchantId?: string

  @Field(() => Date)
  expiresAt: Date

  @Field(() => Date, { nullable: true })
  acceptedAt?: Date

  @Field(() => Date, { nullable: true })
  revokedAt?: Date

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}

@ObjectType()
export class CooperatorInvitationCreateResult {
  @Field(() => CooperatorInvitation)
  invitation: CooperatorInvitation

  @Field(() => String)
  webUrl: string

  @Field(() => String)
  deeplinkUrl: string
}

@ObjectType()
export class CooperatorInvitationPreview {
  @Field(() => Boolean)
  valid: boolean

  @Field(() => CooperatorInvitationPreviewStatus)
  status: CooperatorInvitationPreviewStatus

  @Field(() => String, { nullable: true })
  email?: string

  @Field(() => String, { nullable: true })
  merchantId?: string

  @Field(() => String, { nullable: true })
  merchantName?: string

  @Field(() => OperatorScopeMode, { nullable: true })
  scopeMode?: OperatorScopeModeType

  @Field(() => [OperatorPermission], { nullable: true })
  permissions?: OperatorPermissionType[]

  @Field(() => Boolean, { nullable: true })
  storeScopeAll?: boolean

  @Field(() => [String], { nullable: true })
  storeIds?: string[]

  @Field(() => Date, { nullable: true })
  expiresAt?: Date
}

@ObjectType()
export class AcceptCooperatorInvitationResult {
  @Field(() => String)
  token: string

  @Field(() => String)
  merchantId: string

  @Field(() => String)
  merchantName: string

  @Field(() => OperatorScopeMode)
  scopeMode: OperatorScopeModeType

  @Field(() => [OperatorPermission])
  permissions: OperatorPermissionType[]

  @Field(() => Boolean)
  storeScopeAll: boolean

  @Field(() => [String])
  storeIds: string[]

  @Field(() => String)
  cooperatorId: string
}

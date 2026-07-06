import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { IsEmail } from 'class-validator'
import { Role } from './Role'
import { Privileges } from './Privilges'
import { LanguageCode } from '../../shared/interface/LanguageCode'

@ObjectType()
export class User {
  @Authorized([Role.NEW_USER, Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN])
  @Field(() => ID)
  id: string

  @Field(() => String)
  @IsEmail()
  email?: string

  password?: string

  @Authorized(Role.ADMIN)
  @Field(() => String, { nullable: true })
  profileId?: string

  @Authorized([Role.NEW_USER, Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN])
  @Field(() => String, { nullable: true })
  profileType?: string

  @Authorized([Role.NEW_USER, Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN])
  @Field(() => String, { nullable: true })
  gender?: string

  @Authorized([Role.NEW_USER, Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN])
  @Field(() => String, { nullable: true })
  picture?: string

  @Field(() => [Role])
  roles: Role[]

  @Field(() => String, { nullable: true })
  name?: string | null

  @Field(() => String, { nullable: true })
  firstName: string

  @Field(() => String, { nullable: true })
  surname: string

  @Field(() => String, { nullable: true })
  phone: string

  @Field(() => Date, { nullable: true })
  birthDate?: Date

  @Field(() => Privileges)
  privileges?: Privileges

  @Field(() => LanguageCode)
  language: LanguageCode

  @Field()
  createdAt: Date

  @Authorized(Role.ADMIN)
  @Field()
  updatedAt: Date

  @Field()
  tokenVersion: number

  @Field(() => Boolean, { nullable: true })
  locationPermission?: boolean

  @Field(() => Boolean, { nullable: true })
  notificationPermission?: boolean

  @Field(() => String, { nullable: true })
  preferredCity?: string

  @Field(() => Boolean, { nullable: true })
  isFirstTimeGoogleLogin?: boolean
}

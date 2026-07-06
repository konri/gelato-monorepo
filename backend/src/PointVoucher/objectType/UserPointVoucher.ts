import 'reflect-metadata'
import { ObjectType, Field, ID } from 'type-graphql'
import { User } from '../../User/objectType/User'
import { PointVoucher } from './PointVoucher'

@ObjectType()
export class UserPointVoucher {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field()
  userId: string

  @Field(() => PointVoucher)
  pointVoucher: PointVoucher

  @Field()
  pointVoucherId: string

  @Field()
  qrCode: string

  @Field()
  isUsed: boolean

  @Field({ nullable: true })
  usedAt?: Date

  @Field()
  validUntil: Date

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}

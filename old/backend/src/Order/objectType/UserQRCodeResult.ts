import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class UserQRCodeResult {
  @Field()
  token: string

  @Field()
  expiresAt: Date
}

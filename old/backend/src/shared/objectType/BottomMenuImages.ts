import 'reflect-metadata'
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class BottomMenuImages {
  @Field()
  home: string

  @Field()
  award: string

  @Field()
  qrCode: string

  @Field()
  merchant: string

  @Field()
  user: string
}

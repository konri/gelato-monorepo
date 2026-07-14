import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class VenueQRCodeResult {
  @Field()
  url: string

  @Field()
  storeId: string
}

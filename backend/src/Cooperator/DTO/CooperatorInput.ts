import { Field, Float, InputType, Int } from 'type-graphql'
import { CooperatorType } from '../objectType/CooperatorType'

@InputType()
export class CooperatorInput {
  @Field(() => CooperatorType, { nullable: true })
  type?: CooperatorType
}

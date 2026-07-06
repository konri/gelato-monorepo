import { Field, ID, ObjectType } from 'type-graphql'
import { Role } from '../../User/objectType/Role'

@ObjectType()
export class RegistrationSelectRole {
  @Field(() => String)
  token: string

  @Field(() => Role)
  role: Role
}

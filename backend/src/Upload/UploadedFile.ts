import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { User } from '../User/objectType/User'
import { Role } from '../User/objectType/Role'

@ObjectType()
export class UploadedFile {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field(() => String)
  fileName: string

  @Field(() => String)
  filePath: string

  @Field(() => String, { nullable: true })
  filePreview: string

  @Field(() => String)
  fileMimeType: string

  @Field(() => String)
  size: number

  @Authorized(Role.ADMIN)
  @Field(() => String)
  eTag: string

  @Authorized(Role.ADMIN)
  @Field(() => String)
  bucket: string

  @Field(() => String)
  key: string

  @Authorized(Role.ADMIN)
  @Field()
  createdAt: Date
}

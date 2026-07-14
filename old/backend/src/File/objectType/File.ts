import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { User } from '../../User/objectType/User'
import { UploadedFile } from '../../Upload/UploadedFile'
import { FileType } from './FileType'

@ObjectType()
export class File {
  @Field(() => ID)
  id: string

  @Field(() => User)
  creator: User

  @Field(() => String)
  title: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => [UploadedFile])
  uploadedFiles: UploadedFile[]

  @Field(() => [FileType])
  fileTypes: FileType[]

  @Field()
  createdAt: Date

  @Field(() => Boolean, { nullable: true })
  isExpired?: boolean

  @Field(() => Boolean, { nullable: true })
  isCompanyExpired?: boolean

  @Authorized(Role.ADMIN)
  @Field()
  updatedAt: Date
}

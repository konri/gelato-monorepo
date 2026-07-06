import { Field, InputType } from 'type-graphql'
import { FileType } from '../objectType/FileType'

@InputType()
export class FileWhereInput {
  @Field(() => String, { nullable: true })
  projectId?: string

  @Field(() => String, { nullable: true })
  search?: string

  @Field(() => [String], { nullable: true })
  tags?: string[]

  @Field(() => FileType, { nullable: true })
  fileType?: FileType

  @Field(() => Date, { nullable: true })
  fromDate?: Date

  @Field(() => Date, { nullable: true })
  toDate?: Date
}

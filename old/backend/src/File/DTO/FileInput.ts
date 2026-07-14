import { Field, ID, InputType } from 'type-graphql'

@InputType()
export class FileInput {
  @Field(() => String)
  projectId: string

  @Field(() => String)
  title: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => [String])
  uploadedFiles: string[]

  @Field(() => [String])
  tags: string[]
}

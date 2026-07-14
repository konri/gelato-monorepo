import { ClassType, Field, Int, ObjectType } from 'type-graphql'

export default function PageableResponse<TItem>(TItemClass: ClassType<TItem>) {
  @ObjectType({ isAbstract: true })
  abstract class PageableResponseClass {
    @Field(() => [TItemClass])
    items: TItem[]

    @Field(() => Int)
    total: number
  }

  return PageableResponseClass
}

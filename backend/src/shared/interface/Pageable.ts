import { Field, InputType, Int } from 'type-graphql'
import { convertSortToOrderBy, Sort } from './Sort'

@InputType()
export class Pageable {
  @Field(() => Int)
  skip: number

  @Field(() => Int)
  take: number

  @Field(() => [Sort], { nullable: true })
  sort: Array<Sort>
}

export function convertPageableToPrisma(pageable: Pageable) {
  if (pageable == null) {
    return {
      skip: 0,
      take: 10,
    }
  }

  const { skip, take, sort } = pageable

  return {
    skip,
    take,
    orderBy: convertSortToOrderBy(sort),
  }
}

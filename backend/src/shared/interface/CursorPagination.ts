import { Field, InputType, Int } from 'type-graphql'
import { convertSortToOrderBy, Sort } from './Sort'

@InputType()
export class CursorPagination {
  @Field(() => Int)
  take: number

  @Field(() => String, { nullable: true })
  cursor?: string

  @Field(() => Int, { nullable: true })
  skip?: number

  @Field(() => [Sort], { nullable: true })
  sort?: Array<Sort>
}

function parseCursor(cursorId?: string, cursorInt = false) {
  if (cursorId) {
    return {
      cursor: {
        id: cursorInt ? parseInt(cursorId, 10) : cursorId,
      },
    }
  }

  return {}
}

export function convertCursorPaginationToPrisma(
  cursorPagination: CursorPagination,
  shuffled: boolean = false,
  cursorInt = false
) {
  if (cursorPagination == null) {
    return null
  }

  const { take, skip, cursor, sort } = cursorPagination

  if (cursor) {
    return {
      take,
      ...parseCursor(cursor, cursorInt),
      orderBy: convertSortToOrderBy(sort),
      skip: 1,
    }
  }
  return {
    take: shuffled ? 100 : take,
    skip,
    orderBy: convertSortToOrderBy(sort),
  }
}

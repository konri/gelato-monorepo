import { Field, InputType } from 'type-graphql'

@InputType()
export class DateRange {
  @Field(() => String)
  from: string

  @Field(() => String)
  to: string
}

export function convertDataRange(dateRange: DateRange) {
  if (dateRange == null) {
    return {}
  }
  return {
    AND: [
      {
        createdAt: {
          gte: new Date(dateRange.from),
        },
      },
      {
        createdAt: {
          lte: new Date(dateRange.to),
        },
      },
    ],
  }
}

export function createWhereByDateRangeAndUserId(userId: string, dateRange: DateRange | undefined) {
  if (dateRange == null) {
    return { userId }
  }
  return {
    userId,
    ...convertDataRange(dateRange),
  }
}

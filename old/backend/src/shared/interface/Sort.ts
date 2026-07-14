import { Field, InputType, registerEnumType } from 'type-graphql'

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: 'Roles for user type',
})

@InputType()
export class Sort {
  @Field(() => String)
  field: string

  @Field(() => SortOrder)
  order: SortOrder
}

export function convertSortToOrderBy(sort?: Array<Sort>) {
  if (sort == null) {
    return undefined
  }
  if (sort.length && sort.length > 1) {
    return sort.map(({ field, order }) => ({
      [field]: order,
    }))
  }
  return sort.reduce((acc, val) => {
    return {
      ...acc,
      [val.field]: val.order,
    }
  }, {})
}

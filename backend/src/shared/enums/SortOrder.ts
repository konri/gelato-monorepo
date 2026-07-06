import { registerEnumType } from 'type-graphql'

export enum SearchSortOrder {
  DISTANCE = 'DISTANCE',
  ALPHABETICAL = 'ALPHABETICAL',
  ALPHABETICAL_DESC = 'ALPHABETICAL_DESC',
  PRIORITY = 'PRIORITY',
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  POINTS_ASC = 'POINTS_ASC',
  POINTS_DESC = 'POINTS_DESC',
  POPULARITY = 'POPULARITY',
  EXPIRING_SOON = 'EXPIRING_SOON',
}

registerEnumType(SearchSortOrder, {
  name: 'SearchSortOrder',
  description: 'Opcje sortowania wyników wyszukiwania',
})

import { Authorized, Query, Resolver } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { LanguageCode } from '../interface/LanguageCode'

@Resolver()
export class UtilResolver {
  @Authorized([Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [String])
  getAvailableLanguages() {
    return Object.keys(LanguageCode)
  }
}

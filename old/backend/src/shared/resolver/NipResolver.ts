import { Resolver, Query, Arg } from 'type-graphql'
import { CompanyData } from '../objectType/CompanyData'
import { NipService } from '../service/NipService'

@Resolver()
export class NipResolver {
  @Query(() => CompanyData, { nullable: true })
  async getCompanyByNip(@Arg('nip') nip: string): Promise<CompanyData | null> {
    return await NipService.getCompanyByNip(nip)
  }
}

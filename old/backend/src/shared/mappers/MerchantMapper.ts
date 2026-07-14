import { Merchant } from '../../Merchant/objectType/Merchant'

export class MerchantMapper {
  static toGraphQL(prismaMerchant: any): Merchant {
    return {
      id: prismaMerchant.id,
      name: prismaMerchant.name,
      slug: prismaMerchant.slug,
      description: prismaMerchant.description,
      logoUrl: prismaMerchant.logoUrl,
      coverUrl: prismaMerchant.coverUrl,
      iconUrl: prismaMerchant.iconUrl,
      categoryId: prismaMerchant.categoryId,
      category: prismaMerchant.category,
      company: prismaMerchant.company,
      companyId: prismaMerchant.companyId,
      isVerified: prismaMerchant.isVerified,
      verifiedAt: prismaMerchant.verifiedAt,
      verifiedBy: prismaMerchant.verifiedBy,
      stores: prismaMerchant.stores,
      vouchers: prismaMerchant.vouchers,
      streakPrograms: prismaMerchant.streakPrograms,
      isActive: prismaMerchant.isActive,
      createdAt: prismaMerchant.createdAt,
      updatedAt: prismaMerchant.updatedAt,
    } as Merchant
  }

  static toGraphQLArray(prismaMerchants: any[]): Merchant[] {
    return prismaMerchants.map((merchant) => this.toGraphQL(merchant))
  }
}

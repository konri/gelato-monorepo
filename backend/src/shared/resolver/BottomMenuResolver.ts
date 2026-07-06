import 'reflect-metadata'
import { Resolver, Query } from 'type-graphql'
import { BottomMenuImages } from '../objectType/BottomMenuImages'

@Resolver()
export class BottomMenuResolver {
  @Query(() => BottomMenuImages)
  async bottomMenuImages(): Promise<BottomMenuImages> {
    const baseUrl = process.env.BACKEND_ADDRESS

    return {
      home: `${baseUrl}/api/static/bottom_menu/home.png`,
      award: `${baseUrl}/api/static/bottom_menu/award.png`,
      qrCode: `${baseUrl}/api/static/bottom_menu/qr_code.png`,
      merchant: `${baseUrl}/api/static/bottom_menu/merchant.png`,
      user: `${baseUrl}/api/static/bottom_menu/user.png`,
    }
  }
}

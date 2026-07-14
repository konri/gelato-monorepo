import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { Context } from '../../shared/interface/Context'
import { Role } from '../../User/objectType/Role'
import { Voucher } from '../objectType/Voucher'
import { VoucherInput } from '../DTO/VoucherInput'
import { CodeGenerator } from '../../shared/util/CodeGenerator'
import { generateAndSendVoucher, getVoucherByCode, setVoucherToAccount } from '../service/voucher.service'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'

@Resolver(Voucher)
export class VoucherResolver {
  // @Authorized([Role.ADMIN])
  // @Mutation(() => [Voucher])
  // async createVoucher(@Arg('data') voucherData: VoucherInput, @Ctx() ctx: Context) {
  //   if (voucherData.separateVoucher) {
  //     const vouchersCode = CodeGenerator.generateUniqueRandomStrings(5, voucherData.amountMax).map(
  //       (key) => `${voucherData.code}_${key}`
  //     )
  //     const vouchersPrisma = vouchersCode.map((voucher) => {
  //       return ctx.prisma.voucher.create({
  //         data: {
  //           code: voucher,
  //           amountMonths: voucherData.amountMonths,
  //           amountMax: 1,
  //           details: voucherData.details,
  //         },
  //       })
  //     })
  //     return Promise.all(vouchersPrisma)
  //   }
  //   const voucher = await ctx.prisma.voucher.create({
  //     data: {
  //       code: voucherData.code,
  //       amountMonths: voucherData.amountMonths,
  //       amountMax: voucherData.amountMax,
  //       details: voucherData.details,
  //     },
  //   })
  //   return [voucher]
  // }

  @Authorized([Role.ADMIN])
  @Mutation(() => Voucher)
  async generatePdfVoucher(@Arg('data') voucherData: VoucherInput, @Ctx() ctx: Context) {
    const { code, planId, amountMonths, amountMax, name, email } = voucherData
    const voucher = generateAndSendVoucher(code, planId, amountMonths, amountMax, name, email)
    return voucher
  }

  @Authorized([Role.ADMIN])
  @Query(() => [Voucher])
  async getVouchers(@Ctx() ctx: Context) {
    return ctx.prisma.voucher.findMany()
  }

  @Authorized([Role.ADMIN])
  @Query(() => [Voucher])
  async getVoucher(@Arg('code') code: string, @Ctx() ctx: Context) {
    return ctx.prisma.voucher.findMany({ where: { code } })
  }

  @Authorized([Role.CLIENT, Role.COOPERATOR, Role.OWNER])
  @Mutation(() => Voucher)
  async setVoucherToAccount(@Arg('code') code: string, @Ctx() ctx: Context) {
    const voucher = await getVoucherByCode(code, ctx)
    if (voucher) {
      const subscription = await setVoucherToAccount(voucher, ctx)
      if (subscription) {
        return {
          ...voucher,
          endDate: subscription.endDate,
        }
      }
    }
    throw new ErrorWithStatus(400, 'CODE_NOT_FOUND')
  }

  // get people from specific voucher
}

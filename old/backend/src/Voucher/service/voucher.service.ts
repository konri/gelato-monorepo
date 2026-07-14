import type * as Prisma from '@prisma/client'
import fs from 'fs'
import path from 'path'
import sgMail from '@sendgrid/mail'
// @ts-ignore
import { TemplateEngine, StandardDialect } from 'thymeleaf'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { UserJWT } from '../../Auth/model/UserJWT'
import prisma from '../../shared/prisma'
import { CodeGenerator } from '../../shared/util/CodeGenerator'
import { AttachmentEmail, generatePdf, sendEmail } from '../../shared/service/emailGeneration.service'

const sendExceedAmountVoucherEmail = (voucher: Prisma.Voucher, user: UserJWT) => {
  const templateEngine = new TemplateEngine({
    dialects: [new StandardDialect('th')],
  })

  const templateVars = {
    code: voucher.code,
    amountMonths: voucher.amountMonths,
    amountMax: voucher.amountMax,
    details: voucher.details,
    userEmail: user.email,
    userId: user.id,
  }
  const emailTemplate: string = fs.readFileSync(
    path.resolve(__dirname, '../../public/Messaging/template/voucher-exceed.html'),
    'utf8'
  )

  templateEngine
    .process(emailTemplate, templateVars)
    .then(async (emailHtml: string) => {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
      const msg = {
        to: process.env.SENDGRID_FROM,
        from: process.env.SENDGRID_FROM, // Change to your verified sender
        subject: `UWAGA! Voucher ${voucher.code} przekroczył swoją możliwość powiekszenia!`,
        html: emailHtml,
      }
      await sgMail.send(msg as any)
    })
    .catch((e: string) => console.log(JSON.stringify(e)))
}

const parseDateForTimezone = (date: string | Date): Date => {
  const parsedAvailableDate = new Date(date)
  const userTimezoneOffset = parsedAvailableDate?.getTimezoneOffset() * 60000
  return new Date(parsedAvailableDate.getTime() - userTimezoneOffset)
}

export const setVoucherToAccount = async (
  voucher: Prisma.Voucher,
  ctx: Context
): Promise<Prisma.SubscriptionCompany | null> => {
  const user = await ctx.prisma.user.findFirst({
    where: {
      id: ctx.req.user?.id,
    },
    include: {
      company: true,
    },
  })

  if (user == null) {
    throw new ErrorWithStatus(404, 'USER_NOT_FOUND')
  }

  if (user.company == null) {
    throw new ErrorWithStatus(500, 'Company not found for this user')
  }

  const subscription: Prisma.SubscriptionCompany | null = await ctx.prisma.subscriptionCompany.findFirst({
    where: {
      companyId: user.company.id,
    },
  })

  const plan = await ctx.prisma.plan.findFirst({
    where: {
      id: voucher.planId,
    },
  })

  if (plan == null) {
    throw new ErrorWithStatus(500, 'Plan is not found')
  }

  await ctx.prisma.usedVoucher.create({
    data: {
      code: voucher.code,
      user: {
        connect: { id: ctx.req.user?.id },
      },
    },
  })

  if (subscription) {
    const endDate = new Date(subscription.endDate)
    return ctx.prisma.subscriptionCompany.update({
      data: {
        endDate: new Date(endDate.setMonth(endDate.getMonth() + voucher.amountMonths)),
        plan: { connect: { id: plan.id } },
      },
      where: {
        companyId: user.company.id,
      },
    })
  }
  const startDate = new Date()
  const endDate = new Date(startDate.setMonth(startDate.getMonth() + voucher.amountMonths))
  return ctx.prisma.subscriptionCompany.create({
    data: {
      startDate: parseDateForTimezone(startDate.toISOString()),
      endDate: parseDateForTimezone(endDate),
      originalAppUserId: ctx.req.user?.profileId || 'voucher',
      store: 'VOUCHER',
      promoCode: voucher.code,
      firstSeen: parseDateForTimezone(startDate),
      company: {
        connect: { id: user.company.id },
      },
      plan: { connect: { id: plan.id } },
    },
  })
}

export const getVoucherByCode = async (code: string, ctx: Context): Promise<Prisma.Voucher | null> => {
  const voucher: Prisma.Voucher | null = await ctx.prisma.voucher.findFirst({
    where: {
      code,
    },
  })
  if (voucher) {
    const usedVouchers = await ctx.prisma.usedVoucher.findMany({
      where: {
        code,
      },
    })
    if (usedVouchers.length < voucher.amountMax) {
      return voucher
    }
    sendExceedAmountVoucherEmail(voucher, ctx.req.user!)
    throw new ErrorWithStatus(401, 'CODE_USED')
    return null
  }
  return null
}

export const voucherPdf = async (code: string, amount: number, amountMembers: number) => {
  const templateVars = { code, amount, amountMembers }
  return generatePdf('voucher-online/voucher', templateVars)
}

async function generateCodeWithoutDuplicate(codePrefix: string) {
  let code = `${codePrefix}-${CodeGenerator.generateRandomString(7)}`
  let amountCode = await prisma.voucher.count({
    where: {
      code,
    },
  })
  while (amountCode !== 0) {
    code = `${codePrefix}-${CodeGenerator.generateRandomString(7)}`
    amountCode = await prisma.voucher.count({
      where: {
        code,
      },
    })
  }
  return code
}
export const generateAndSendVoucher = async (
  codePrefix: string,
  planId: string,
  amountMonths: number,
  amountMax: number,
  name: string,
  email: string
): Promise<Prisma.Voucher> => {
  const code = await generateCodeWithoutDuplicate(codePrefix)
  const plan = await prisma.plan.findFirst({
    where: {
      id: planId,
    },
  })
  if (plan == null) {
    throw new ErrorWithStatus(500, 'Plan is not found')
  }
  try {
    const voucher = await prisma.voucher.create({
      data: {
        code,
        amountMonths,
        amountMax,
        plan: { connect: { id: planId } },
        details: `shop online email: ${email}`,
      },
    })
    // todo: voucher pdf with amountMembers
    const pdf = await voucherPdf(code, amountMonths, plan.amountMembers)
    const templateVars = {
      userName: name,
      duration: amountMonths,
      amount: amountMax,
      amountUsers: plan.amountMembers,
      code,
    }
    const attachments: Array<AttachmentEmail> = [
      {
        content: pdf,
        filename: 'Voucher',
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ]
    // todo: change to voucher-online/email-client with amountMembers
    sendEmail('voucher-online/email-client', templateVars, email, 'voucherClient', 'pl', attachments)
    return voucher
  } catch (e) {
    console.error(e)
    throw new Error(`Error happen in generating voucher email: ${e}`)
  }
  throw new Error('Error happen in generating voucher')
}

import { Arg, Authorized, Ctx, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import type * as Prisma from '@prisma/client'
import { Prisma as PrismaDTO } from '@prisma/client'
import i18next from 'i18next'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { Role } from '../../User/objectType/Role'
import { FileInput } from '../DTO/FileInput'
import { File } from '../objectType/File'
import { sendNotificationForUser } from '../../shared/service/notifications'
import { NotificationType } from '../../shared/interface/NotificationType'
import PageableResponse from '../../shared/interface/PageableResponse'
import { useFileTypes } from '../utils/useFileTypes'

@ObjectType()
class FilePageableResponse extends PageableResponse<File>(File) {}

@Resolver(File)
export class FileResolver {
  @Authorized([Role.OWNER, Role.COOPERATOR, Role.CLIENT])
  @Mutation(() => File)
  async createFile(@Arg('data') data: FileInput, @Ctx() ctx: Context) {
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.req.user?.id,
      },
    })

    if (user == null) {
      throw new ErrorWithStatus(404, `User not found, while creating file ${JSON.stringify(data)}`)
    }

    if (data.uploadedFiles.length === 0) {
      throw new ErrorWithStatus(400, `No files uploaded, while creating file ${JSON.stringify(data)}`)
    }

    let company
    if (user.roles.includes(Role.OWNER)) {
      company = await ctx.prisma.company.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          subscription: { include: { plan: true } },
        },
      })
    }

    if (
      company &&
      (!company.subscription || (company.subscription && new Date(company.subscription?.endDate) < new Date()))
    ) {
      throw new ErrorWithStatus(402, `Company ${company.id} has free plan`)
    }

    const filesToUpload = await ctx.prisma.uploadedFile.findMany({
      where: {
        id: { in: data.uploadedFiles },
      },
    })
    const fileTypes = useFileTypes(filesToUpload)

    const file = await ctx.prisma.file.create({
      data: {
        title: data.title,
        description: data.description,
        creator: { connect: { id: ctx.req.user?.id } },
        fileTypes: { set: fileTypes },
        uploadedFiles:
          data.uploadedFiles && data.uploadedFiles.length > 0
            ? { connect: data.uploadedFiles.map((id) => ({ id })) }
            : undefined,
      },
    })

    return file
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.CLIENT])
  @Mutation(() => File)
  async deleteFile(@Arg('id') id: string, @Ctx() ctx: Context) {
    const file = await ctx.prisma.file.findFirst({
      where: {
        id,
      },
    })
    if (file == null) {
      throw new ErrorWithStatus(404, `File not found, while deleting feed ${id}`)
    }

    if (file.creatorId !== ctx.req.user?.id) {
      throw new ErrorWithStatus(403, `User not allowed to delete file ${id}`)
    }

    await ctx.prisma.file.delete({
      where: {
        id,
      },
    })
    return file
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.CLIENT])
  @Query(() => File)
  async getFileById(@Arg('id') id: string, @Ctx() ctx: Context) {
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.req.user?.id,
      },
    })

    if (user == null) {
      throw new ErrorWithStatus(404, `User not found, while fetching file ${id}`)
    }

    const file = await ctx.prisma.file.findFirst({
      where: {
        id,
      },
      include: {
        creator: true,
        uploadedFiles: true,
      },
    })

    let company
    if (user.roles.includes(Role.OWNER)) {
      company = await ctx.prisma.company.findFirst({
        where: {
          userId: user.id,
        },
        include: { subscription: true },
      })
    }

    if (!file) {
      throw new ErrorWithStatus(404, `File not found, while fetching file ${id}`)
    }

    if (
      company &&
      (!company.subscription || (company.subscription && new Date(company.subscription?.endDate) < new Date()))
    ) {
      return {
        ...file,
        description: 'Subscription is expired',
        uploadedFiles: [],
        fileTypes: [],
        isExpired: true,
      }
    }
    return file
  }
}

import { ExpressContext } from 'apollo-server-express/dist/ApolloServer'
import { Request } from 'express'
import { PrismaClient } from '@prisma/client'
import { UserJWT } from '../../Auth/model/UserJWT'

export interface RequestWithUser extends Request {
  user?: UserJWT
  projectId: string
}

// @ts-ignore
export interface Context extends ExpressContext {
  req: RequestWithUser
  prisma: PrismaClient
}

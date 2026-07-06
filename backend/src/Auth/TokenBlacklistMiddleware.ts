import { AuthChecker } from 'type-graphql'
import { AuthenticationError } from 'apollo-server-express'
import { Context } from '../shared/interface/Context'
import * as jwt from 'jsonwebtoken'
import prisma from '../shared/prisma'
import { Role } from '../User/objectType/Role'

const AUTH_REASON = {
  MISSING_TOKEN: 'MISSING_TOKEN',
  TOKEN_BLACKLISTED: 'TOKEN_BLACKLISTED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TOKEN_VERSION_MISMATCH: 'TOKEN_VERSION_MISMATCH',
} as const

type AuthReason = typeof AUTH_REASON[keyof typeof AUTH_REASON]

type JwtPayload = { user?: { id?: string }; tokenVersion?: number }

const throwUnauthenticated = (reason: AuthReason): never => {
  throw new AuthenticationError(reason)
}

export const authChecker: AuthChecker<Context> = async ({ context }, roles) => {
  const token = context.req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return throwUnauthenticated(AUTH_REASON.MISSING_TOKEN)
  }

  const blacklisted = await prisma.tokenBlacklist.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
    },
  })

  if (blacklisted) {
    return throwUnauthenticated(AUTH_REASON.TOKEN_BLACKLISTED)
  }

  let payload: JwtPayload
  try {
    payload = jwt.verify(token, process.env.BE_JWT!) as JwtPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return throwUnauthenticated(AUTH_REASON.TOKEN_EXPIRED)
    }
    return throwUnauthenticated(AUTH_REASON.TOKEN_INVALID)
  }

  if (!payload?.user?.id) {
    return throwUnauthenticated(AUTH_REASON.TOKEN_INVALID)
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.user.id },
  })

  if (!user) {
    return throwUnauthenticated(AUTH_REASON.USER_NOT_FOUND)
  }

  if (user.tokenVersion && payload.tokenVersion !== user.tokenVersion) {
    return throwUnauthenticated(AUTH_REASON.TOKEN_VERSION_MISMATCH)
  }

  if (roles.length === 0) {
    return true
  }

  return user.roles.some((userRole) => roles.includes(userRole as Role))
}

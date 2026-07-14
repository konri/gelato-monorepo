import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type * as Prisma from '@prisma/client'
import { User } from '../User/objectType/User'
import { ErrorWithStatus } from '../shared/interface/ErrorWithStatus'
import { UserJWT } from './model/UserJWT'

const hashPassword = (password: string) => {
  if (password.length < 8) {
    throw new ErrorWithStatus(400, 'Password must be at least 8 characters long.')
  }

  return bcrypt.hash(password, 10)
}

const validatePassword = (user: User | Prisma.User | null, password: string): Promise<boolean> => {
  return bcrypt.compare(password, user!.password!)
}

const generateJWT = (user: User | Prisma.User | null): string => {
  const body: UserJWT = {
    id: user!.id,
    email: user!.email!,
    roles: user!.roles,
    profileId: user?.profileId,
    profileType: user?.profileType,
    name: user?.name,
    firstName: user?.firstName,
    surname: user?.surname,
    picture: user?.picture,
  }
  const { BE_JWT } = process.env
  return jwt.sign({ user: body, tokenVersion: user!.tokenVersion || 0 }, BE_JWT as string)
}

export { hashPassword, validatePassword, generateJWT }

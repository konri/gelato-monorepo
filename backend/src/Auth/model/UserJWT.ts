import { Role } from '@prisma/client'

export interface UserJWT {
  id: string
  email: string
  roles: Role[]
  profileId?: string | null
  profileType?: string | null
  name?: string | null
  firstName?: string | null
  surname?: string | null
  picture?: string | null
}

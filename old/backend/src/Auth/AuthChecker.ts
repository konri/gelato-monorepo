import { AuthChecker } from 'type-graphql'
import { Context } from '../shared/interface/Context'

export const authChecker: AuthChecker<Context> = (
  {
    context: {
      req: { user },
    },
  },
  roles
) => {
  if (roles.length === 0) {
    // if `@Authorized()`, check only is user exist
    return user !== undefined
  }
  if (!user) {
    return false
  }

  // Check if user has any of the required roles
  if (user.roles && user.roles.some((userRole: string) => roles.includes(userRole))) {
    return true
  }

  return false
}

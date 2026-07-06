import passport from 'passport'
import { Role } from '../User/objectType/Role'
import { User } from '../User/objectType/User'

function checkPermissionRole(user: User, role: Role | Array<Role>) {
  if (Array.isArray(role)) {
    return role.some((r) => user.roles.includes(r))
  }
  return user.roles.includes(role)
}
export const AuthGuard = (role: Role | Array<Role> | undefined) => {
  return (req: any, res: any, next: any) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
      if (user) {
        req.user = user
        if (role) {
          const isPermitted = checkPermissionRole(user, role)
          if (isPermitted) {
            next()
          } else {
            res.status(403)
            res.json({
              error:
                'You don’t have permission to access this resource. Maybe if you ask the system administrator nicely, you’ll get permission.',
            })
            // todo: log
          }
        } else {
          next()
        }
      } else {
        res.status(401)
        res.json({ error: 'Authorization token expired or is invaild, please contact with admin' })
        // todo: log
      }
    })(req, res, next)
  }
}

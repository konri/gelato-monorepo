import { registerEnumType } from 'type-graphql'

export enum Role {
  CLIENT = 'CLIENT',
  OWNER = 'OWNER',
  COOPERATOR = 'COOPERATOR',
  ADMIN = 'ADMIN',
  DISACTIVE = 'DISACTIVE',
  NEW_USER = 'NEW_USER',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'Roles for user type',
})

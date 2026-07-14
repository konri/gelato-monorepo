import { registerEnumType } from 'type-graphql'

export enum CooperatorType {
  OTHER = 'OTHER',
}

registerEnumType(CooperatorType, {
  name: 'CooperatorType',
  description: 'CooperatorType for cooperator type',
})

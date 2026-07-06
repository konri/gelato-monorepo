import { registerEnumType } from 'type-graphql'

export enum VoucherCardType {
  SINGLE = 'SINGLE',
  FAMILY = 'FAMILY',
}

registerEnumType(VoucherCardType, {
  name: 'VoucherCardType',
  description: 'Type for VoucherCardType',
})

import { registerEnumType } from 'type-graphql'

export enum VoucherDisplayType {
  HOT = 'HOT',
  PROMOTED = 'PROMOTED',
  STANDARD = 'STANDARD',
}

registerEnumType(VoucherDisplayType, {
  name: 'VoucherDisplayType',
  description: 'Display type for merchant vouchers',
})

import { registerEnumType } from 'type-graphql'

export enum VoucherCardBuySessionStatus {
  SCHEDULED = 'SCHEDULED',
  PAIED = 'PAIED',
  FAILED = 'FAILED',
}

registerEnumType(VoucherCardBuySessionStatus, {
  name: 'VoucherCardBuySessionStatus',
  description: 'Type for VoucherCardBuySessionStatus',
})

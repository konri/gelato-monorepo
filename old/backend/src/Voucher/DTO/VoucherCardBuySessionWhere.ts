import { Field, InputType, Int } from 'type-graphql'
import { VoucherCardBuySessionStatus } from '../objectType/VoucherCardBuySessionStatus'

@InputType()
export class VoucherCardBuySessionWhere {
  @Field(() => VoucherCardBuySessionStatus)
  status: VoucherCardBuySessionStatus
}

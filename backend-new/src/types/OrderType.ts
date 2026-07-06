import { ObjectType, Field, ID, Float, Int, InputType, registerEnumType } from 'type-graphql';
import { OrderStatus } from '@prisma/client';

// Register Prisma enum with TypeGraphQL
registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'Order lifecycle status',
});

/**
 * Order Item GraphQL Type
 */
@ObjectType()
export class OrderItemType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orderId!: string;

  @Field(() => ID, { nullable: true })
  tasteId?: string;

  @Field(() => ID, { nullable: true })
  productId?: string;

  @Field(() => [ID])
  boxTasteIds!: string[];

  @Field(() => Int)
  quantity!: number;

  @Field(() => Float)
  pricePerUnit!: number;

  @Field(() => Float)
  total!: number;

  @Field()
  createdAt!: Date;
}

/**
 * Order GraphQL Type
 */
@ObjectType()
export class OrderType {
  @Field(() => ID)
  id!: string;

  @Field()
  orderNumber!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  spotId!: string;

  @Field(() => OrderStatus)
  status!: OrderStatus;

  @Field(() => [OrderItemType])
  items!: OrderItemType[];

  @Field(() => Float)
  subtotal!: number;

  @Field(() => Float)
  deliveryFee!: number;

  @Field(() => Float)
  discount!: number;

  @Field(() => Float)
  total!: number;

  @Field({ nullable: true })
  paymentIntentId?: string;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field()
  paymentStatus!: string;

  @Field()
  deliveryAddress!: string;

  @Field()
  deliveryLatitude!: number;

  @Field()
  deliveryLongitude!: number;

  @Field({ nullable: true })
  buildingType?: string;

  @Field({ nullable: true })
  apartmentNumber?: string;

  @Field({ nullable: true })
  floor?: string;

  @Field({ nullable: true })
  noteForCourier?: string;

  @Field({ nullable: true })
  noteForSpot?: string;

  @Field({ nullable: true })
  scheduledFor?: Date;

  @Field()
  invoiceRequested!: boolean;

  @Field({ nullable: true })
  invoiceNIP?: string;

  @Field({ nullable: true })
  invoiceCompanyName?: string;

  @Field({ nullable: true })
  invoiceAddress?: string;

  @Field(() => ID, { nullable: true })
  preparedById?: string;

  @Field({ nullable: true })
  preparedByName?: string;

  @Field({ nullable: true })
  claimedAt?: Date;

  @Field(() => ID, { nullable: true })
  courierId?: string;

  @Field({ nullable: true })
  courierAssignedAt?: Date;

  @Field({ nullable: true })
  acceptedAt?: Date;

  @Field({ nullable: true })
  readyAt?: Date;

  @Field({ nullable: true })
  pickedUpAt?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field({ nullable: true })
  cancelledAt?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * Order Item Input
 */
@InputType()
export class OrderItemInput {
  // Exactly one of tasteId / productId must be provided.
  @Field(() => ID, { nullable: true })
  tasteId?: string;

  @Field(() => ID, { nullable: true })
  productId?: string;

  // For box products: chosen taste ids (repeats allowed, length <= maxTastes).
  @Field(() => [ID], { nullable: true })
  boxTasteIds?: string[];

  @Field(() => Int)
  quantity!: number;
}

/**
 * Create Order Input
 */
@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  spotId!: string;

  @Field(() => [OrderItemInput])
  items!: OrderItemInput[];

  @Field()
  deliveryAddress!: string;

  @Field()
  deliveryLatitude!: number;

  @Field()
  deliveryLongitude!: number;

  @Field({ nullable: true })
  buildingType?: string;

  @Field({ nullable: true })
  apartmentNumber?: string;

  @Field({ nullable: true })
  floor?: string;

  @Field({ nullable: true })
  deliveryNotes?: string;

  @Field({ nullable: true })
  spotNotes?: string;

  @Field()
  paymentMethod!: string;

  @Field({ nullable: true })
  scheduledFor?: Date;

  // Promo / influencer code applied at checkout (validated server-side).
  @Field({ nullable: true })
  promoCode?: string;

  // Invoice request
  @Field({ nullable: true })
  invoiceRequested?: boolean;

  @Field({ nullable: true })
  invoiceNIP?: string;

  @Field({ nullable: true })
  invoiceCompanyName?: string;

  @Field({ nullable: true })
  invoiceAddress?: string;
}

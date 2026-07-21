import { ObjectType, Field, ID, Float, Int, InputType, registerEnumType } from 'type-graphql';
import { OrderStatus, FulfillmentType } from '@prisma/client';

// Register Prisma enums with TypeGraphQL
registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'Order lifecycle status',
});

registerEnumType(FulfillmentType, {
  name: 'FulfillmentType',
  description: 'How the customer receives the order (delivery vs pickup)',
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

  // Human-readable name of what was ordered (taste title or product name),
  // resolved from the referenced taste/product. Lets staff see what to prepare.
  @Field({ nullable: true })
  displayName?: string;

  // For box products: the chosen taste names (one entry per scoop).
  // Provided by a field resolver — optional on the TS type so existing
  // Prisma-row casts to OrderType still hold.
  @Field(() => [String])
  boxTasteNames?: string[];
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

  @Field(() => FulfillmentType)
  fulfillmentType!: FulfillmentType;

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

  @Field({ nullable: true })
  deliveryAddress?: string;

  @Field({ nullable: true })
  deliveryLatitude?: number;

  @Field({ nullable: true })
  deliveryLongitude?: number;

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

  // Handover codes. pickupCode is shown to spot staff (courier reads it back);
  // deliveryPin is shown to the customer (courier enters it to mark delivered).
  @Field({ nullable: true })
  pickupCode?: string;

  @Field({ nullable: true })
  deliveryPin?: string;

  @Field({ nullable: true })
  acceptedAt?: Date;

  @Field({ nullable: true })
  readyAt?: Date;

  @Field({ nullable: true })
  pickedUpAt?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field({ nullable: true })
  collectedAt?: Date;

  @Field({ nullable: true })
  cancelledAt?: Date;

  // Delivery incident (courier-reported) — shown in the spot "Needs attention" view.
  @Field({ nullable: true })
  incidentType?: string;

  @Field({ nullable: true })
  incidentNote?: string;

  @Field({ nullable: true })
  incidentPhotoUrl?: string;

  @Field({ nullable: true })
  incidentReportedAt?: Date;

  @Field({ nullable: true })
  cancelReason?: string;

  // Spot termination (out of stock / closing).
  @Field({ nullable: true })
  terminatedAt?: Date;

  @Field({ nullable: true })
  terminationReason?: string;

  @Field({ nullable: true })
  refundedAt?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * Result of a staff collecting a pickup order at the spot.
 */
@ObjectType()
export class CollectOrderResult {
  @Field(() => ID)
  orderId!: string;

  @Field()
  orderNumber!: string;

  @Field(() => OrderStatus)
  status!: OrderStatus;

  // Points credited to the customer as part of this collection (0 if the
  // order was already paid online and points were awarded earlier).
  @Field(() => Int)
  pointsAwarded!: number;
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

  // DELIVERY (default) requires the address fields below; PICKUP ignores them.
  @Field(() => FulfillmentType, { nullable: true })
  fulfillmentType?: FulfillmentType;

  @Field({ nullable: true })
  deliveryAddress?: string;

  @Field({ nullable: true })
  deliveryLatitude?: number;

  @Field({ nullable: true })
  deliveryLongitude?: number;

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

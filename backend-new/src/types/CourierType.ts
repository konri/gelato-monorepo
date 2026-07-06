import { ObjectType, Field, ID, Float, Int } from 'type-graphql';

/**
 * Courier Profile GraphQL Type
 */
@ObjectType()
export class CourierProfileType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field()
  isOnline!: boolean;

  @Field()
  isAvailable!: boolean;

  @Field(() => ID, { nullable: true })
  currentSpotId?: string;

  @Field(() => Int)
  totalDeliveries!: number;

  @Field(() => Float, { nullable: true })
  averageRating?: number;

  @Field(() => Float)
  totalEarnings!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * Courier Application GraphQL Type
 */
@ObjectType()
export class CourierApplicationType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  courierId!: string;

  @Field(() => ID)
  spotId!: string;

  @Field()
  status!: string; // pending, approved, rejected

  // Resolved spot/city info for display in the courier app.
  @Field({ nullable: true })
  spotName?: string;

  @Field({ nullable: true })
  spotAddress?: string;

  @Field({ nullable: true })
  cityName?: string;

  @Field()
  appliedAt!: Date;

  @Field({ nullable: true })
  reviewedAt?: Date;

  @Field({ nullable: true })
  reviewedBy?: string;
}

/**
 * Courier Location GraphQL Type
 */
@ObjectType()
export class CourierLocationType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  courierId!: string;

  @Field(() => ID, { nullable: true })
  orderId?: string;

  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;

  @Field(() => Float, { nullable: true })
  accuracy?: number;

  @Field()
  timestamp!: Date;
}

/**
 * Courier Spot (Approved Relationship) GraphQL Type
 */
@ObjectType()
export class CourierSpotType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  courierId!: string;

  @Field(() => ID)
  spotId!: string;

  @Field()
  isActive!: boolean;

  @Field()
  approvedAt!: Date;
}

/**
 * An approved spot a courier can work at (CourierSpot joined with spot display info).
 */
@ObjectType()
export class CourierApprovedSpotType {
  @Field(() => ID)
  spotId!: string;

  @Field()
  spotName!: string;

  @Field({ nullable: true })
  spotAddress?: string;

  @Field({ nullable: true })
  cityName?: string;

  @Field()
  isActive!: boolean;
}

/**
 * A courier work session (on-the-job period + selected spots).
 */
@ObjectType()
export class WorkSessionType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  courierId!: string;

  @Field(() => [ID])
  selectedSpotIds!: string[];

  @Field()
  startedAt!: Date;

  @Field({ nullable: true })
  endedAt?: Date;
}

/**
 * A delivery as seen by the courier: pickup (spot) + dropoff (customer) info,
 * used for the available pool, the active-delivery map, and navigation.
 */
@ObjectType()
export class CourierDeliveryType {
  @Field(() => ID)
  id!: string;

  @Field()
  orderNumber!: string;

  @Field(() => String)
  status!: string;

  @Field(() => Float)
  total!: number;

  @Field(() => Int)
  itemCount!: number;

  // Pickup — the spot
  @Field(() => ID)
  spotId!: string;

  @Field()
  spotName!: string;

  @Field({ nullable: true })
  spotAddress?: string;

  @Field(() => Float)
  spotLatitude!: number;

  @Field(() => Float)
  spotLongitude!: number;

  // Dropoff — the customer. Address is only revealed once the spot confirms
  // handover (PICKED_UP); before that the courier just navigates to the spot.
  @Field({ nullable: true })
  deliveryAddress?: string;

  @Field(() => Float, { nullable: true })
  deliveryLatitude?: number;

  @Field(() => Float, { nullable: true })
  deliveryLongitude?: number;

  @Field({ nullable: true })
  apartmentNumber?: string;

  @Field({ nullable: true })
  floor?: string;

  @Field({ nullable: true })
  noteForCourier?: string;

  @Field(() => Float, { nullable: true })
  distanceKm?: number;

  @Field({ nullable: true })
  readyAt?: Date;

  @Field({ nullable: true })
  pickedUpAt?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  // Review info (populated for delivery history once the client rates).
  @Field(() => Int, { nullable: true })
  courierRating?: number;

  @Field({ nullable: true })
  reviewComment?: string;
}

/**
 * Earnings for a single day (dashboard: earnings per day).
 */
@ObjectType()
export class CourierDailyEarningType {
  @Field()
  date!: string; // YYYY-MM-DD

  @Field(() => Float)
  amount!: number;

  @Field(() => Int)
  deliveries!: number;
}

/**
 * Courier earnings dashboard: per-day breakdown + current-month summary.
 */
@ObjectType()
export class CourierEarningsSummaryType {
  @Field(() => Float)
  todayAmount!: number;

  @Field(() => Int)
  todayDeliveries!: number;

  @Field(() => Float)
  monthAmount!: number;

  @Field(() => Int)
  monthDeliveries!: number;

  @Field(() => Float)
  totalAmount!: number;

  @Field(() => [CourierDailyEarningType])
  daily!: CourierDailyEarningType[];
}

/**
 * Available Courier for Assignment
 */
@ObjectType()
export class AvailableCourierType {
  @Field(() => ID)
  courierId!: string;

  @Field(() => ID)
  userId!: string;

  @Field()
  userName!: string;

  @Field(() => Float, { nullable: true })
  averageRating?: number;

  @Field(() => Int)
  totalDeliveries!: number;

  @Field(() => Float, { nullable: true })
  distanceKm?: number;
}

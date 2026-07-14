# Enhanced Merchant Coupon System

## Overview

Comprehensive merchant coupon system with merchant-specific points, advanced coupon types, usage tracking, and exclusivity controls.

## Key Features Implemented

### 1. Merchant-Specific Points System

- **UserMerchantPointBalance**: Points earned and spent per merchant
- **MerchantPointTransaction**: Complete transaction history per merchant
- **Automatic Point Management**: Points deducted when purchasing coupons

### 2. Enhanced Coupon Types

#### Multi-Buy Coupons (1+1, 3 za 2, etc.)

```typescript
{
  couponType: "MULTI_BUY",
  buyQuantity: 1,
  getQuantity: 1  // Buy 1 Get 1 Free
}
```

#### Discount Coupons (Percentage/Amount)

```typescript
{
  couponType: "DISCOUNT",
  discountType: "PERCENTAGE", // or "AMOUNT"
  discountValue: 20
}
```

#### Day of Week Coupons

```typescript
{
  couponType: "DAY_OF_WEEK",
  dayOfWeek: "Tuesday",
  discountValue: 30
}
```

#### Threshold Discount Coupons

```typescript
{
  couponType: "THRESHOLD_DISCOUNT",
  thresholdAmount: 100,
  discountAmount: 20  // 20zł off when spending 100zł+
}
```

#### Item-Specific Coupons

```typescript
{
  couponType: "ITEM_SPECIFIC",
  itemName: "Coffee",
  itemBarcode: "1234567890"  // Optional barcode scanning
}
```

#### Birthday Coupons

```typescript
{
  couponType: "BIRTHDAY",
  daysBeforeBirthday: 3,
  daysAfterBirthday: 3,
  discountValue: 50
}
```

#### Activity Coupons

```typescript
{
  couponType: "ACTIVITY",
  activityType: "instagram_share"  // For social media integration
}
```

### 3. Advanced Usage Controls

#### Usage Limits

- **usesPerUserLimit**: Maximum uses per user
- **globalUsageLimit**: Total coupon pool limit
- **currentUses**: Real-time usage tracking

#### Date Range Control

- **validFrom/validUntil**: Coupon validity period
- **Automatic expiry checking**

#### Exclusivity Groups

- **exclusivityGroups**: Prevent conflicting coupons
- **isStackable**: Control coupon stacking

### 4. Availability Types

- **FREE**: Available to all users
- **POINTS**: Requires merchant-specific points to claim

### 5. Complete Usage Tracking

- **CouponUsage**: Detailed usage history
- **remainingUses**: Track remaining uses per user
- **Automatic usage counting**

## Database Schema

### New Models Added

```sql
-- Merchant-specific points
UserMerchantPointBalance {
  userId + merchantId (unique)
  totalPoints, availablePoints, lockedPoints
}

MerchantPointTransaction {
  userId, merchantId, type, amount
  balanceBefore, balanceAfter
  referenceId, referenceType
}

-- Enhanced coupon tracking
CouponUsage {
  couponId, userId, usedAt
  remainingUses, metadata
}

-- Enhanced Coupon fields
Coupon {
  // ... existing fields
  currentUses, usesPerUserLimit
  globalUsageLimit, isStackable
}
```

## API Endpoints

### Merchant Points Management

#### Get Point Balance

```graphql
query MyMerchantPointBalance($merchantId: String!) {
  myMerchantPointBalance(merchantId: $merchantId) {
    totalPoints
    availablePoints
    merchant {
      name
    }
  }
}
```

#### Add Points (Owner/Cooperator)

```graphql
mutation AddMerchantPoints($userId: String!, $amount: Float!, $description: String!) {
  addMerchantPoints(userId: $userId, amount: $amount, description: $description) {
    availablePoints
  }
}
```

#### Get Transaction History

```graphql
query MyMerchantPointTransactions($merchantId: String!) {
  myMerchantPointTransactions(merchantId: $merchantId) {
    type
    amount
    description
    createdAt
  }
}
```

### Coupon Management

#### Create Coupon

```graphql
mutation CreateCoupon($data: CreateCouponInput!) {
  createCoupon(data: $data) {
    id
    code
    title
    couponType
    usesPerUserLimit
    globalUsageLimit
  }
}
```

#### Get Available Coupons

```graphql
query AvailableCoupons($merchantId: String) {
  availableCoupons(merchantId: $merchantId) {
    id
    code
    title
    pointsCost
    currentUses
    globalUsageLimit
  }
}
```

#### Claim Coupon

```graphql
mutation ClaimCoupon($couponId: String!, $storeId: String) {
  claimCoupon(couponId: $couponId, storeId: $storeId) {
    id
    title
    merchant {
      name
    }
  }
}
```

#### Use Coupon

```graphql
mutation UseCoupon($couponId: String!, $storeId: String!) {
  useCoupon(couponId: $couponId, storeId: $storeId)
}
```

### Usage Tracking

#### Get Usage History

```graphql
query MyCouponUsageHistory {
  myCouponUsageHistory {
    usedAt
    remainingUses
    coupon {
      code
      title
      merchant {
        name
      }
    }
  }
}
```

## Security & Validation

### Automatic Validations

- **Point Balance**: Checks sufficient points before purchase
- **Usage Limits**: Validates per-user and global limits
- **Expiry Dates**: Automatic expiry checking
- **Merchant Association**: Coupons automatically linked to merchant

### Authorization

- **Role-Based Access**: Different permissions per user role
- **Merchant Isolation**: Users only see their merchant's data
- **Automatic Merchant Detection**: From JWT token and company association

## Integration Points

### With Existing Systems

- **Loyalty Stamps**: Can award merchant points for stamp completion
- **User Activities**: Coupons appear in unified activity feed
- **Location Search**: Coupons included in nearby search results

### Future Integrations

- **Social Media**: Activity coupons for Instagram/Facebook shares
- **Barcode Scanning**: Item-specific coupons with barcode validation
- **Push Notifications**: Birthday and special offer notifications

## Usage Flow Examples

### 1. Merchant Creates Multi-Buy Coupon

1. Owner/Cooperator creates "Buy 1 Get 1 Free Coffee" coupon
2. Sets pointsCost: 50, usesPerUserLimit: 3, globalUsageLimit: 100
3. Coupon appears in availableCoupons for users

### 2. User Claims and Uses Coupon

1. User checks myMerchantPointBalance (has 150 points)
2. User calls claimCoupon (50 points deducted automatically)
3. User visits store and calls useCoupon
4. System tracks usage in CouponUsage table
5. Updates currentUses and remainingUses

### 3. Merchant Adds Points to User

1. User makes purchase at store
2. Owner/Cooperator calls addMerchantPoints
3. Points added to user's merchant-specific balance
4. Transaction recorded in MerchantPointTransaction

## Testing

### Seed Data

- Run `prisma/seed-merchant-coupons.ts` for sample data
- Creates point balances for users
- Generates various coupon types for testing

### API Testing

- Use `merchant_coupon_system_examples.md` for curl commands
- Test all coupon types and usage scenarios
- Validate point deduction and usage tracking

## Key Benefits

1. **Merchant-Specific**: Points and coupons isolated per merchant
2. **Flexible Types**: 7 different coupon types for various scenarios
3. **Usage Control**: Comprehensive limits and tracking
4. **Automatic Management**: Points, usage, and validation handled automatically
5. **Scalable**: Designed for multiple merchants and high usage
6. **Secure**: Role-based access and automatic validations
7. **Integrated**: Works with existing loyalty and activity systems

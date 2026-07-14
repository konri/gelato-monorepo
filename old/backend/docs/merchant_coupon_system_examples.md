# Enhanced Merchant Coupon System - API Examples

## Merchant Points Management

### Add Points to User (Merchant/Owner/Cooperator)

```bash
# Add Merchant Points to User
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation AddMerchantPoints($userId: String!, $amount: Float!, $description: String!) { addMerchantPoints(userId: $userId, amount: $amount, description: $description) { id totalPoints availablePoints merchant { name } } }",
    "variables": {
        "userId": "72738ea3-a3c6-4e33-a23a-d95a6906ddc1",
        "amount": 100,
        "description": "Points for purchase"
    }
}'
```

### Get User's Merchant Point Balance (Client)

```bash
# Get Merchant Point Balance - Client specifies merchant
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query MyMerchantPointBalance($merchantId: String!) { myMerchantPointBalance(merchantId: $merchantId) { id totalPoints availablePoints lockedPoints merchant { name } } }",
    "variables": {
        "merchantId": "fd237576-f6f9-4990-b84a-30e8ab98ec9b"
    }
}'
```

### Get Own Merchant Point Balance (Owner/Cooperator)

```bash
# Get Own Merchant Point Balance - Auto-detect merchant
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query MyOwnMerchantPointBalance { myOwnMerchantPointBalance { id totalPoints availablePoints lockedPoints merchant { name } } }"
}'
```

### Get Merchant Point Transaction History (Client)

```bash
# Get Merchant Point Transactions - Client specifies merchant
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query MyMerchantPointTransactions($merchantId: String!) { myMerchantPointTransactions(merchantId: $merchantId) { id type amount description balanceBefore balanceAfter createdAt } }",
    "variables": {
        "merchantId": "fd237576-f6f9-4990-b84a-30e8ab98ec9b"
    }
}'
```

### Get Own Merchant Point Transaction History (Owner/Cooperator)

```bash
# Get Own Merchant Point Transactions - Auto-detect merchant
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query MyOwnMerchantPointTransactions { myOwnMerchantPointTransactions { id type amount description balanceBefore balanceAfter createdAt } }"
}'
```

## Enhanced Coupon Management

### Create Multi-Buy Coupon (1+1 Free)

```bash
# Create Multi-Buy Coupon
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation CreateCoupon($data: CreateCouponInput!) { createCoupon(data: $data) { id code title couponType availability pointsCost buyQuantity getQuantity usesPerUserLimit globalUsageLimit isStackable } }",
    "variables": {
        "data": {
            "code": "BUY1GET1",
            "title": "Buy 1 Get 1 Free Coffee",
            "description": "Purchase one coffee and get another one free",
            "couponType": "MULTI_BUY",
            "availability": "POINTS",
            "pointsCost": 50,
            "validFrom": "2024-01-01T00:00:00Z",
            "validUntil": "2024-12-31T23:59:59Z",
            "buyQuantity": 1,
            "getQuantity": 1,
            "usesPerUserLimit": 3,
            "globalUsageLimit": 100,
            "isStackable": false
        }
    }
}'
```

### Create Percentage Discount Coupon

```bash
# Create Percentage Discount Coupon
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation CreateCoupon($data: CreateCouponInput!) { createCoupon(data: $data) { id code title discountType discountValue usesPerUserLimit } }",
    "variables": {
        "data": {
            "code": "SAVE20",
            "title": "20% Off Everything",
            "description": "Get 20% discount on all items",
            "couponType": "DISCOUNT",
            "availability": "POINTS",
            "pointsCost": 30,
            "validFrom": "2024-01-01T00:00:00Z",
            "validUntil": "2024-12-31T23:59:59Z",
            "discountType": "PERCENTAGE",
            "discountValue": 20,
            "usesPerUserLimit": 1,
            "globalUsageLimit": 200,
            "isStackable": false
        }
    }
}'
```

### Create Threshold Discount Coupon

```bash
# Create Threshold Discount Coupon
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation CreateCoupon($data: CreateCouponInput!) { createCoupon(data: $data) { id code title thresholdAmount discountAmount } }",
    "variables": {
        "data": {
            "code": "SPEND100GET20",
            "title": "Spend 100zł Get 20zł Off",
            "description": "Get 20zł discount when you spend 100zł or more",
            "couponType": "THRESHOLD_DISCOUNT",
            "availability": "FREE",
            "validFrom": "2024-01-01T00:00:00Z",
            "validUntil": "2024-12-31T23:59:59Z",
            "thresholdAmount": 100,
            "discountAmount": 20,
            "usesPerUserLimit": 2,
            "globalUsageLimit": 50
        }
    }
}'
```

### Create Day of Week Coupon

```bash
# Create Day of Week Coupon (Tuesday Special)
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation CreateCoupon($data: CreateCouponInput!) { createCoupon(data: $data) { id code title dayOfWeek discountValue } }",
    "variables": {
        "data": {
            "code": "TUESDAYSPECIAL",
            "title": "Tuesday 30% Off",
            "description": "Special discount every Tuesday",
            "couponType": "DAY_OF_WEEK",
            "availability": "FREE",
            "validFrom": "2024-01-01T00:00:00Z",
            "validUntil": "2024-12-31T23:59:59Z",
            "dayOfWeek": "Tuesday",
            "discountType": "PERCENTAGE",
            "discountValue": 30,
            "usesPerUserLimit": 1
        }
    }
}'
```

### Create Birthday Coupon

```bash
# Create Birthday Coupon
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation CreateCoupon($data: CreateCouponInput!) { createCoupon(data: $data) { id code title daysBeforeBirthday daysAfterBirthday } }",
    "variables": {
        "data": {
            "code": "BIRTHDAY50",
            "title": "Birthday Special - 50% Off",
            "description": "Special birthday discount",
            "couponType": "BIRTHDAY",
            "availability": "FREE",
            "validFrom": "2024-01-01T00:00:00Z",
            "validUntil": "2024-12-31T23:59:59Z",
            "discountType": "PERCENTAGE",
            "discountValue": 50,
            "daysBeforeBirthday": 3,
            "daysAfterBirthday": 3,
            "usesPerUserLimit": 1
        }
    }
}'
```

## Coupon Usage

### Get Available Coupons

```bash
# Get Available Coupons
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query AvailableCoupons($merchantId: String) { availableCoupons(merchantId: $merchantId) { id code title description couponType availability pointsCost validUntil currentUses globalUsageLimit merchant { name } } }",
    "variables": {
        "merchantId": "merchant-uuid"
    }
}'
```

### Claim Coupon (Purchase with Points)

```bash
# Claim Coupon
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation ClaimCoupon($couponId: String!, $storeId: String) { claimCoupon(couponId: $couponId, storeId: $storeId) { id code title merchant { name } } }",
    "variables": {
        "couponId": "f5261ab4-d5fe-42dd-8c9d-34573ef87ec1",
        "storeId": "store-uuid-optional"
    }
}'
```

### Get My Coupons

```bash
# Get My Coupons
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query MyCoupons { myCoupons { id code title description couponType discountType discountValue validUntil merchant { name } } }"
}'
```

### Use Coupon

```bash
# Use Coupon
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation UseCoupon($couponId: String!, $storeId: String!) { useCoupon(couponId: $couponId, storeId: $storeId) }",
    "variables": {
        "couponId": "f5261ab4-d5fe-42dd-8c9d-34573ef87ec1",
        "storeId": "store-uuid-required"
    }
}'
```

### Get Coupon Usage History

```bash
# Get Coupon Usage History
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query MyCouponUsageHistory { myCouponUsageHistory { id usedAt remainingUses coupon { code title merchant { name } } } }"
}'
```

## Merchant Management

### Get My Merchant Coupons (Owner/Cooperator)

```bash
# Get My Merchant Coupons
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query MyMerchantCoupons { myMerchantCoupons { id code title couponType currentUses globalUsageLimit isActive createdAt } }"
}'
```

## Key Features Implemented:

1. **Merchant-Specific Points**: Users earn and spend points per merchant
2. **Enhanced Coupon Types**: Multi-buy, discount, threshold, day-of-week, birthday, activity
3. **Usage Limits**: Per-user and global usage limits
4. **Usage Tracking**: Complete history of coupon usage
5. **Stackability Control**: Prevent conflicting coupons from being used together
6. **Automatic Point Deduction**: Points are automatically deducted when claiming paid coupons
7. **Comprehensive Validation**: Checks for expiry, limits, and availability before usage

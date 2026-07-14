# Stamp Rewards - 2-Step Redemption Flow

## Flow Overview

**1 QR per user (userId)** - Owner scans once, then selects which reward to redeem.

## CLIENT Flow

### 1. Login as CLIENT

```bash
curl --location '{{base_url}}/authorization/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "client@gmail.com",
    "password": "hasloklientgmail"
}'
```

### 2. Get My Available Rewards

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query { myStampCards { id stampsCollected stampsRequired merchant { name } availableRewards { type milestone { id title discountPercent stampsRequired } mainRewardTitle mainRewardDiscountPercent } } }"
}'
```

### 3. Claim Reward (generates entry in database)

```bash
# Claim Milestone
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation ClaimReward($cardId: String!, $type: String!, $milestoneId: String) { claimReward(cardId: $cardId, type: $type, milestoneId: $milestoneId) { type claimedMilestone { id milestone { title discountPercent } } } }",
    "variables": {
        "cardId": "card-id",
        "type": "MILESTONE",
        "milestoneId": "milestone-id"
    }
}'

# Claim Main Reward
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation ClaimReward($cardId: String!) { claimReward(cardId: $cardId) { type claimedMilestone { id } } }",
    "variables": {
        "cardId": "card-id"
    }
}'
```

### 4. Show QR Code (userId)

```javascript
// Client app shows QR with userId
const qrData = JSON.stringify({
  userId: currentUser.id,
  type: "REWARDS"
})
<QRCode value={qrData} />
```

## OWNER Flow (2-Step Redemption)

### Step 1: Scan User QR → Get Claimed Rewards List

```bash
# Owner scans QR containing userId
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query GetUserClaimedRewards($userId: String!) { getUserClaimedRewards(userId: $userId) { id claimedAt milestone { title description milestoneType discountPercent discountAmount } card { template { rewardTitle rewardDiscountPercent } merchant { name } } } }",
    "variables": {
        "userId": "user-id-from-qr"
    }
}'
```

**Response:**

```json
{
  "getUserClaimedRewards": [
    {
      "id": "claimed-1",
      "milestone": {
        "title": "10% zniżki",
        "discountPercent": 10
      }
    },
    {
      "id": "claimed-2",
      "milestone": {
        "title": "20% zniżki",
        "discountPercent": 20
      }
    },
    {
      "id": "claimed-3",
      "milestone": null, // Main reward
      "card": {
        "template": {
          "rewardTitle": "Darmowa kawa",
          "rewardDiscountPercent": 100
        }
      }
    }
  ]
}
```

### Step 2: Select Reward → Redeem

```bash
# Owner selects which reward to redeem
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation RedeemReward($claimedRewardId: String!) { redeemReward(claimedRewardId: $claimedRewardId) { id isRedeemed redeemedAt milestone { title } } }",
    "variables": {
        "claimedRewardId": "claimed-2"
    }
}'
```

## Complete Flow Example

### CLIENT Side:

1. User has 6/10 stamps
2. User claims milestone: `claimReward(cardId, type: "MILESTONE", milestoneId: "m-6")`
3. User shows **1 QR code** with their `userId`

### OWNER Side:

1. Owner scans QR → gets `userId: "user-123"`
2. Owner calls: `getUserClaimedRewards(userId: "user-123")`
3. Owner sees list:
   - ✅ 10% zniżki (claimed-1)
   - ✅ 20% zniżki (claimed-2)
   - ✅ Darmowa kawa (claimed-3)
4. Owner selects "20% zniżki"
5. Owner calls: `redeemReward(claimedRewardId: "claimed-2")`
6. ✅ Reward redeemed!

## Key Points

- **1 QR per user** - contains only `userId`
- **Step 1**: Scan QR → Get list of claimed rewards
- **Step 2**: Select reward → Redeem
- Owner sees all unredeemed rewards for that user at their merchant
- Simple UX: scan once, select from list

## Mobile App Integration

```javascript
// OWNER APP - After scanning QR
const scannedData = JSON.parse(qrCodeString)
const userId = scannedData.userId

// Step 1: Get rewards
const rewards = await getUserClaimedRewards({ userId })

// Step 2: Show list to owner
rewards.forEach((reward) => {
  if (reward.milestone) {
    console.log(`🎯 ${reward.milestone.title}`)
  } else {
    console.log(`🎁 ${reward.card.template.rewardTitle}`)
  }
})

// Step 3: Owner selects and redeems
await redeemReward({ claimedRewardId: selectedReward.id })
```

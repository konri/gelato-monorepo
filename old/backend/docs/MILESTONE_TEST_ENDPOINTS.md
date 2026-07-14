# Stamp Milestones - Test Endpoints

## 1. (CLIENT) Login as CLIENT (client@gmail.com)

```bash
# Login CLIENT
curl --location '{{base_url}}/authorization/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "client@gmail.com",
    "password": "hasloklientgmail"
}'
```

## 2. (CLIENT) Get My Stamp Cards with Available Rewards

```bash
# Get My Stamp Cards - Shows all available rewards (milestones + main reward)
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query { myStampCards { id stampsCollected stampsRequired isActive merchant { name } template { title rewardTitle } availableRewards { type milestone { id title description milestoneType discountPercent discountAmount pointsReward stampsRequired } mainRewardTitle mainRewardDescription mainRewardType mainRewardDiscountPercent mainRewardDiscountAmount } } }"
}'
```

## 3. (CLIENT) Claim Reward - Unified endpoint with single rewardId

```bash
# Claim ANY Reward - Milestone or Main Reward
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation ClaimReward($rewardId: String!) { claimReward(rewardId: $rewardId) { id isRedeemed claimedAt milestone { id title description milestoneType discountPercent discountAmount pointsReward stampsRequired } card { id stampsCollected stampsRequired merchant { name } template { title rewardTitle } } } }",
    "variables": {
        "rewardId": "{{reward_id}}"
    }
}'
```

**How to get rewardId:**

- For **Milestone**: Use `milestone.id` from `availableRewards[].milestone.id`
- For **Main Reward**: Use `card.id` (the stamp card ID)

**Note:** User shows their **permanent QR code** (containing userId) to merchant for redemption. No per-reward QR codes are generated.

## 4. (CLIENT) Check Cards After Claim

```bash
# Get My Stamp Cards - Check claimed rewards status
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query { myStampCards { id stampsCollected stampsRequired mainRewardClaimed { id isAvailable canClaim isClaimed isRedeemed isReadyToRedeem rewardDetails { title description type discountPercent discountAmount } claimedAt redeemedAt } merchant { name } template { title rewardTitle rewardType rewardDiscountPercent rewardDiscountAmount rewardImageUrl resetStampsOnMilestoneClaim milestones { id stampsRequired milestoneType title description discountPercent discountAmount pointsReward imageUrl } } stamps { id isUsed createdAt } claimedMilestones { id isAvailable isClaimed isRedeemed isReadyToRedeem claimedAt redeemedAt milestone { title description milestoneType discountPercent } } } }"
}'
```

## 5. (OWNER/COOPERATOR/ADMIN) Login as OWNER (owner@gmail.com)

```bash
# Login OWNER
curl --location '{{base_url}}/authorization/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "owner@gmail.com",
    "password": "hasloownergmail"
}'
```

## 6. (OWNER/COOPERATOR/ADMIN) Get User Claimed Rewards - Scan user's permanent QR code

```bash
# Get User Claimed Rewards - Merchant scans user's QR (contains userId)
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query GetUserClaimedRewards($userId: String!) { getUserClaimedRewards(userId: $userId) { id isAvailable isClaimed isRedeemed isReadyToRedeem redeemedAt claimedAt milestone { title description milestoneType discountPercent discountAmount pointsReward } card { id stampsCollected stampsRequired merchant { name } template { title rewardTitle } } } }",
    "variables": {
        "userId": "PASTE_USER_ID_HERE"
    }
}'
```

**Flow:**

1. Merchant scans user's **permanent QR code** (contains userId)
2. Backend checks claimed rewards for this user at this merchant
3. If **1 reward** → auto-redeemed, returns `isRedeemed: true`
4. If **multiple rewards** → returns list with `isRedeemed: false`, merchant selects which to redeem

## 7. (OWNER/COOPERATOR/ADMIN) Redeem Reward - Manual selection if multiple rewards

```bash
# Redeem Reward - Used ONLY when user has multiple rewards (manual selection)
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation RedeemReward($claimedRewardId: String!) { redeemReward(claimedRewardId: $claimedRewardId) { id isRedeemed redeemedAt milestone { title description } card { id template { rewardTitle rewardDescription rewardType rewardDiscountPercent rewardDiscountAmount } } } }",
    "variables": {
        "claimedRewardId": "PASTE_CLAIMED_REWARD_ID_HERE"
    }
}'
```

**Note:** This endpoint is only needed when `getUserClaimedRewards` returns multiple rewards with `isRedeemed: false`. If only 1 reward exists, it's auto-redeemed by endpoint #6.

## 8. (OWNER/COOPERATOR/ADMIN) Create Template with Milestones

```bash
# Create Stamp Card Template with Milestones
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation CreateTemplate($data: CreateStampCardTemplateInput!) { createStampCardTemplate(data: $data) { id title stampsRequired rewardType rewardTitle resetStampsOnMilestoneClaim milestones { id stampsRequired milestoneType title discountPercent } } }",
    "variables": {
        "data": {
            "merchantId": "PASTE_MERCHANT_ID_HERE",
            "title": "Test Card with Milestones",
            "description": "Test description",
            "stampsRequired": 10,
            "rewardType": "DISCOUNT_PERCENT",
            "rewardTitle": "50% discount",
            "rewardDiscountPercent": 50,
            "resetStampsOnMilestoneClaim": true,
            "milestones": [
                {
                    "stampsRequired": 3,
                    "milestoneType": "DISCOUNT_PERCENT",
                    "discountPercent": 10,
                    "title": "10% off",
                    "description": "10% discount on next purchase"
                },
                {
                    "stampsRequired": 6,
                    "milestoneType": "FREE_SERVICE",
                    "title": "Free coffee",
                    "description": "Free espresso coffee"
                }
            ]
        }
    }
}'
```

## 9. (CLIENT) Activate New Stamp Card

```bash
# Activate Stamp Card - Create new card for same merchant
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation ActivateStampCard($merchantId: String!, $templateId: String) { activateStampCard(merchantId: $merchantId, templateId: $templateId) { id stampsCollected stampsRequired merchant { name } template { title milestones { id stampsRequired title } } } }",
    "variables": {
        "merchantId": "a7f7975d-abee-44ca-982d-e1726d1aa5fd",
        "templateId": "numero-uno-stamps-template"
    }
}'
```

## 10. (OWNER/COOPERATOR/ADMIN) Add Stamp by QR Scan

```bash
# Add Stamp by User ID - Merchant scans client QR code
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation AddStampByUserId($userId: String!, $templateId: String, $description: String!) { addStampByUserId(userId: $userId, templateId: $templateId, description: $description) { id cardId isUsed createdAt } }",
    "variables": {
        "userId": "{{client_user_id}}",
        "templateId": "numero-uno-stamps-template",
        "description": "Purchase at store"
    }
}'
```

### Full Flow:

1. **(CLIENT)** Login → Get JWT token
2. **(CLIENT)** Get My Stamp Cards → See available rewards with their IDs
3. **(CLIENT)** Claim Reward with `rewardId` (milestone.id OR card.id)
4. **(OWNER)** Login → Get JWT token
5. **(OWNER)** Scan user's permanent QR code (contains userId)
6. **(OWNER)** Call `getUserClaimedRewards(userId)` → See claimed rewards
   - If 1 reward → automatically redeemed
   - If multiple → select which to redeem via `redeemReward(claimedRewardId)`
7. **(CLIENT)** Check cards → See reward was redeemed

### QR Code System:

- **User has 1 permanent QR code** containing their `userId`
- **No per-reward QR codes** - same QR for all rewards
- Merchant scans user QR → backend finds all claimed rewards for that user at that merchant

### Unified API Benefits:

- ✅ **Single endpoint** - `claimReward(rewardId: String!)`
- ✅ **Simple frontend** - just pass the reward ID from `availableRewards`
- ✅ **Less validation** - backend auto-detects milestone vs main reward
- ✅ **Cleaner code** - no need for type/milestoneId combinations

## Expected Results:

- ✅ User has **1 permanent QR code** with userId
- ✅ `claimReward` accepts single `rewardId` parameter
- ✅ Backend auto-detects if it's milestone or main reward
- ✅ `getUserClaimedRewards` auto-redeems if 1 reward, shows list if multiple
- ✅ `redeemReward` used only for manual selection when multiple rewards

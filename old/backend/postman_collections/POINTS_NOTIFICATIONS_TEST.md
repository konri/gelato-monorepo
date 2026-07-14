# Points & Notifications System - Test Flow

## ✅ Backend Analysis Summary

### Push Notifications Implementation:

- ✅ **Firebase Admin SDK** - initialized in `NotificationService.ts`
- ✅ **FCM Sending** - uses `admin.messaging().sendEachForMulticast()` in `notificationQueue.ts` (line 38)
- ✅ **Queue System** - BullMQ + Redis for async processing
- ✅ **Auto Retry** - 3 attempts with exponential backoff
- ✅ **Invalid Token Cleanup** - automatic deactivation of invalid FCM tokens

### Points System Integration:

- ✅ **addPoints mutation** - automatically sends push notification via `PushNotificationHelper.sendPointsEarned()`
- ✅ **Notification saved to DB** - before sending push
- ✅ **Queue processing** - async FCM delivery

---

## Test Flow: Add Points → Receive Push Notification

### Prerequisites:

1. User must be logged in (JWT token)
2. Device must be registered with FCM token
3. Redis must be running
4. Firebase credentials must be configured in .env

---

## Step 1: Register Device (REQUIRED FIRST!)

```bash
# Register Device for Push Notifications (CLIENT) - requires fcmToken, platform, deviceId
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation RegisterDevice($fcmToken: String!, $platform: String!, $deviceId: String!, $deviceName: String) { registerDevice(fcmToken: $fcmToken, platform: $platform, deviceId: $deviceId, deviceName: $deviceName) }",
  "variables": {
    "fcmToken": "YOUR_FCM_TOKEN_FROM_MOBILE_APP",
    "platform": "ios",
    "deviceId": "test-device-123",
    "deviceName": "iPhone Test"
  }
}'
```

**Note:** Replace `YOUR_FCM_TOKEN_FROM_MOBILE_APP` with actual FCM token from mobile app.

---

## Step 2: Add Points to User (Triggers Push Notification)

```bash
# Add Points (CLIENT) - no params (adds to logged user)
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation AddPoints($amount: Float!, $description: String!) { addPoints(amount: $amount, description: $description) { totalPoints availablePoints lockedPoints } }",
  "variables": {
    "amount": 100,
    "description": "Test points - checking push notification"
  }
}'
```

**Expected Result:**

1. ✅ Points added to user balance
2. ✅ Notification saved to database
3. ✅ Push notification queued in Redis
4. ✅ FCM sends push to registered device
5. ✅ Mobile app receives: "💰 Otrzymano punkty! +100 punktów. Test points - checking push notification"

---

## Step 3: Verify Notification in Database

```bash
# Get My Notifications (CLIENT) - no params
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query MyNotifications { myNotifications { id category type title message isRead isSent sentAt createdAt } }"
}'
```

**Expected Fields:**

- `type`: "POINTS_EARNED"
- `category`: "GENERAL"
- `title`: "💰 Otrzymano punkty!"
- `message`: "+100 punktów. Test points - checking push notification"
- `isSent`: true (if FCM succeeded)
- `sentAt`: timestamp when FCM sent

---

## Step 4: Check Point Balance

```bash
# Get My Point Balance (CLIENT) - no params
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query MyPointBalance { myPointBalance { totalPoints availablePoints lockedPoints } }"
}'
```

---

## Step 5: Check Point Transaction History

```bash
# Get My Point Transactions (CLIENT) - no params
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query MyPointTransactions { myPointTransactions { id type amount description balanceBefore balanceAfter createdAt } }"
}'
```

---

## Troubleshooting

### Push notification not received?

1. **Check Redis connection:**

   ```bash
   redis-cli -s /usr/home/kraczo/redis.sock ping
   ```

2. **Check Firebase credentials in .env:**

   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

3. **Check device registration:**

   ```graphql
   query {
     myNotifications {
       isSent
       sentAt
     }
   }
   ```

   - If `isSent: false` → FCM failed
   - If `isSent: true` → FCM succeeded, check mobile app

4. **Check backend logs:**

   - Look for: `✅ Notification queued for push delivery`
   - Look for: `✅ Notification sent: [job-id]`
   - Look for: `❌ Notification failed: [error]`

5. **Check FCM token validity:**
   - Token must be from physical device (not emulator)
   - Token must be fresh (not expired)
   - Token must match platform (iOS/Android)

---

## Additional Test: Unregister Device

```bash
# Unregister Device (CLIENT) - requires deviceId
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation UnregisterDevice($deviceId: String!) { unregisterDevice(deviceId: $deviceId) }",
  "variables": {
    "deviceId": "test-device-123"
  }
}'
```

After unregistering, adding points should:

- ✅ Still save notification to DB
- ❌ NOT send push notification (no devices registered)

---

## Backend Code Flow

```
1. User calls addPoints mutation
   ↓
2. PointsResolver.addPoints() (line 133)
   ↓
3. PushNotificationHelper.sendPointsEarned()
   ↓
4. NotificationService.sendPushNotification()
   ↓
5. Save notification to DB (synchronous)
   ↓
6. Get FCM tokens from UserDevice table
   ↓
7. Add job to notificationQueue (async)
   ↓
8. BullMQ worker processes job
   ↓
9. admin.messaging().sendEachForMulticast()
   ↓
10. Update notification.isSent = true
```

---

## Expected Notification Payload (Mobile App)

```json
{
  "notification": {
    "title": "💰 Otrzymano punkty!",
    "body": "+100 punktów. Test points - checking push notification"
  },
  "data": {
    "type": "POINTS_EARNED",
    "category": "GENERAL",
    "notificationId": "uuid-here",
    "amount": "100",
    "description": "Test points - checking push notification"
  },
  "android": {
    "priority": "high",
    "notification": {
      "sound": "default",
      "channelId": "general"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1,
        "category": "GENERAL"
      }
    }
  }
}
```

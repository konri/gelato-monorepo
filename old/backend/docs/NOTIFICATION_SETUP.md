# Notification System Setup Guide

## 1. Install Dependencies

```bash
yarn add bullmq ioredis firebase-admin
yarn add -D @types/ioredis
```

## 2. Update Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
enum NotificationCategory {
  GENERAL
  PROMOTIONS
}

enum NotificationType {
  STAMP_ADDED
  STAMP_CARD_COMPLETED
  STAMP_MILESTONE_REACHED
  POINTS_EARNED
  POINTS_SPENT
  COUPON_CLAIMED
  VOUCHER_PURCHASED
  BIRTHDAY_REWARD
  REFERRAL_COMPLETED
  SYSTEM_ANNOUNCEMENT
  COUPON_AVAILABLE
  COUPON_EXPIRING
  VOUCHER_EXPIRING
  MERCHANT_PROMOTION
  SPECIAL_OFFER
  NEW_REWARD_AVAILABLE
}

model Notification {
  id        String               @id @default(uuid())
  user      User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String

  category  NotificationCategory @default(GENERAL)
  type      NotificationType
  title     String
  message   String
  imageUrl  String?
  metadata  Json?

  isRead    Boolean              @default(false)
  readAt    DateTime?
  isSent    Boolean              @default(false)
  sentAt    DateTime?

  createdAt DateTime             @default(now())

  @@index([userId, isRead])
  @@index([userId, category])
  @@index([userId, createdAt])
}

model UserDevice {
  id         String   @id @default(uuid())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId     String

  fcmToken   String   @unique
  platform   String
  deviceId   String
  deviceName String?

  isActive   Boolean  @default(true)
  lastUsedAt DateTime @default(now())
  createdAt  DateTime @default(now())

  @@unique([userId, deviceId])
}
```

Add to User model:

```prisma
model User {
  // ... existing fields
  notifications  Notification[]
  devices        UserDevice[]
}
```

## 3. Run Migration

```bash
# Local
yarn migrate-db-local

# Dev (MyDevil)
yarn migrate-db-dev
```

## 4. Setup Redis

### Local Development (Docker)

```bash
# Add to docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - '6379:6379'
  volumes:
    - redis-data:/data

# Start Redis
docker-compose up -d redis
```

### MyDevil Production

```bash
# SSH to MyDevil
ssh kraczo@s5.mydevil.net

# Redis jest już zainstalowany, uruchom:
redis-server --daemonize yes --port 0 --unixsocket ~/redis.sock --unixsocketperm 700

# Sprawdź czy działa
redis-cli -s ~/redis.sock ping
# Output: PONG
```

## 5. Configure Environment Variables

### .env.local (Local Development)

```bash
REDIS_URL=redis://localhost:6379

FIREBASE_PROJECT_ID=bonapka-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@bonapka-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### .env.dev (MyDevil Production)

```bash
REDIS_SOCKET=/usr/home/kraczo/redis.sock

FIREBASE_PROJECT_ID=bonapka-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@bonapka-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 6. Register Resolver

Add to your GraphQL schema setup:

```typescript
// src/index.ts or wherever you setup Apollo Server
import { NotificationResolver } from './User/resolver/NotificationResolver'

const schema = await buildSchema({
  resolvers: [
    // ... existing resolvers
    NotificationResolver,
  ],
})
```

## 7. Import Queue Worker

Add to `src/index.ts` (before starting server):

```typescript
// Import to start worker
import './queues/notificationQueue'

// ... rest of your server setup
```

## 8. Firebase Setup

1. Go to Firebase Console: https://console.firebase.google.com
2. Create project or select existing
3. Project Settings > Service Accounts
4. Generate new private key
5. Copy credentials to .env

## 9. Mobile App Setup (React Native)

```bash
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

```typescript
// App.tsx
import messaging from '@react-native-firebase/messaging'
import { useMutation } from '@apollo/client'

const REGISTER_DEVICE = gql`
  mutation RegisterDevice($fcmToken: String!, $platform: String!, $deviceId: String!) {
    registerDevice(fcmToken: $fcmToken, platform: $platform, deviceId: $deviceId)
  }
`

useEffect(() => {
  // Request permission
  messaging().requestPermission()

  // Get FCM token
  messaging()
    .getToken()
    .then((token) => {
      registerDevice({
        variables: {
          fcmToken: token,
          platform: Platform.OS,
          deviceId: DeviceInfo.getUniqueId(),
        },
      })
    })

  // Foreground notifications
  messaging().onMessage(async (remoteMessage) => {
    console.log('Notification:', remoteMessage)
  })
}, [])
```

## 10. Test Notifications

```graphql
# Register device (from mobile app)
mutation {
  registerDevice(fcmToken: "YOUR_FCM_TOKEN", platform: "ios", deviceId: "device-123")
}

# Get notifications
query {
  myNotifications(category: GENERAL) {
    id
    title
    message
    isRead
    createdAt
  }
}

# Get unread count
query {
  unreadNotificationsCount(category: PROMOTIONS)
}

# Mark as read
mutation {
  markNotificationAsRead(notificationId: "notif-id")
}
```

## 11. Integration Examples

See `src/services/NotificationIntegrationExamples.ts` for complete examples.

Quick example:

```typescript
import { NotificationService } from '../services/NotificationService'

const notificationService = NotificationService.getInstance()

await notificationService.sendPushNotification({
  userId: user.id,
  category: 'GENERAL',
  type: 'STAMP_ADDED',
  title: '🎉 Nowa pieczątka!',
  message: `Otrzymałeś pieczątkę w ${merchant.name}`,
  metadata: { merchantId: merchant.id },
  prisma: ctx.prisma,
})
```

## 12. Deploy to MyDevil

```bash
# Deploy
yarn deploy-dev-mydevil-compiled

# Or manually:
ssh kraczo@s5.mydevil.net
cd /usr/home/kraczo/domains/bonapka.com/public_nodejs/api-dev

# Uruchom Redis (jeśli nie działa)
redis-server --daemonize yes --port 0 --unixsocket ~/redis.sock --unixsocketperm 700

# Restart aplikacji
yarn stop-pm2 && yarn start-pm2
```

## Troubleshooting

### Redis connection error

```bash
# Sprawdź czy Redis działa
redis-cli -s ~/redis.sock ping

# Jeśli nie działa, uruchom:
redis-server --daemonize yes --port 0 --unixsocket ~/redis.sock --unixsocketperm 700
```

### FCM token invalid

- Token expires when app is uninstalled
- Worker automatically deactivates invalid tokens
- User needs to re-register device

### Notifications not sending

```bash
# Check logs
yarn logs-pm2

# Check queue
# Add Bull Board for monitoring (optional)
```

## Architecture

```
User Action (e.g., add stamp)
    ↓
NotificationService.sendPushNotification()
    ↓
1. Save to PostgreSQL (instant)
2. Add to Redis Queue (instant)
    ↓
Response to user (50ms) ⚡
    ↓
BullMQ Worker (background)
    ↓
Firebase Cloud Messaging
    ↓
User's Phone 📱
```

## Categories

- **GENERAL**: Stamps, points, rewards, system messages
- **PROMOTIONS**: Coupons, offers, merchant promotions

Users can filter notifications by category in the app.

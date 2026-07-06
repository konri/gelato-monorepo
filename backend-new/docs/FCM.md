# Firebase Cloud Messaging (FCM) Documentation

## Overview

The Gelato backend implements Firebase Cloud Messaging for push notifications across all mobile applications:
- **Client App**: Order updates, points earned, prizes, news
- **Courier App**: Delivery assignments, route updates
- **Spot Admin App**: New orders, courier updates, announcements

## Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Cloud Messaging in the project settings
4. Add iOS and Android apps to the project
5. Download service account credentials:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `config/firebase-service-account.json`

### 2. Backend Configuration

Add to `.env`:

```bash
# Option 1: Service account file (recommended)
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json

# Option 2: Project ID only (uses Application Default Credentials)
FIREBASE_PROJECT_ID=gelato-production
```

The service will automatically initialize on startup:
```
✅ Firebase Cloud Messaging initialized
```

If credentials are not configured, you'll see:
```
⚠️  Firebase credentials not configured. Push notifications disabled.
```

### 3. Mobile App Setup

#### Client App (mobile-new)

```bash
cd mobile-new
npx expo install expo-notifications
```

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#4a044e",
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#4a044e",
      "androidMode": "default",
      "androidCollapsedTitle": "Gelato"
    }
  }
}
```

#### Courier App (mobile-courier-new)

Same setup as client app with different notification icon/color if desired.

#### Spot Admin App (mobile-admin-spot-new)

Same setup with admin-specific notification configuration.

## Notification Types

The system supports 15 notification types:

```typescript
enum NotificationType {
  ORDER_PLACED              // Order received
  ORDER_CONFIRMED           // Spot confirmed order
  ORDER_PREPARING           // Order being prepared
  ORDER_READY               // Order ready for pickup
  ORDER_PICKED_UP           // Courier picked up order
  ORDER_OUT_FOR_DELIVERY    // Order on the way
  ORDER_DELIVERED           // Order delivered
  ORDER_CANCELLED           // Order cancelled
  COURIER_ASSIGNED          // Courier assigned to delivery
  COURIER_NEARBY            // Courier is close
  POINTS_EARNED             // Loyalty points earned
  POINTS_REDEEMED           // Points redeemed for prize
  PRIZE_AVAILABLE           // New prize in catalog
  QUEST_COMPLETED           // Quest/mission completed
  NEWS_PUBLISHED            // News/announcement
  SPOT_ANNOUNCEMENT         // Spot-specific announcement
  REFERRAL_REWARD           // Referral bonus earned
}
```

## Multi-Language Support

All notifications support PL/EN/UA with automatic language detection based on user's language preference.

Example template:
```typescript
ORDER_PLACED: {
  pl: {
    title: 'Zamówienie złożone',
    body: 'Twoje zamówienie #{orderId} zostało przyjęte.',
  },
  en: {
    title: 'Order Placed',
    body: 'Your order #{orderId} has been received.',
  },
  ua: {
    title: 'Замовлення розміщено',
    body: 'Ваше замовлення #{orderId} отримано.',
  },
}
```

## GraphQL API

### User Operations

#### Register FCM Token
```graphql
mutation RegisterToken {
  registerFCMToken(token: "fcm-token-here")
}
```

**Automatic topic subscriptions:**
- Clients → `clients` topic
- Couriers → `couriers` topic
- Spot staff → `spot_staff` topic

#### Remove FCM Token
```graphql
mutation RemoveToken {
  removeFCMToken(token: "fcm-token-here")
}
```

#### Get My Tokens
```graphql
query MyTokens {
  myFCMTokens
}
```

#### Send Test Notification
```graphql
mutation TestNotification {
  sendTestNotification
}
```

### Admin Operations

#### Broadcast to All Clients
```graphql
mutation BroadcastClients {
  broadcastToClients(
    title: "Summer Sale!"
    body: "Get 20% off all ice cream this week"
    language: pl
  )
}
```

**Permissions:** SUPER_ADMIN only

#### Broadcast to Couriers
```graphql
mutation BroadcastCouriers {
  broadcastToCouriers(
    title: "Important Update"
    body: "New delivery zone added"
    language: pl
  )
}
```

**Permissions:** SUPER_ADMIN, SPOTS_ADMIN

#### Broadcast to Spot Staff
```graphql
mutation BroadcastStaff {
  broadcastToSpotStaff(
    title: "System Update"
    body: "New features available in the app"
    language: pl
  )
}
```

**Permissions:** SUPER_ADMIN, SPOTS_ADMIN

#### Send to Specific User
```graphql
mutation NotifyUser {
  sendNotificationToUser(
    userId: "user-id-here"
    title: "Personal Message"
    body: "Your account has been verified"
  )
}
```

**Permissions:** SUPER_ADMIN, SPOTS_ADMIN

## Programmatic Usage

### Send to Single User

```typescript
import { FCMService, NotificationType } from '../services/FCMService';

// Send order confirmation
await FCMService.sendToUser(
  userId,
  NotificationType.ORDER_CONFIRMED,
  {
    spotName: 'Gelato Espresso Warsaw',
  },
  {
    orderId: order.id,
  },
  prisma
);
```

### Send to Multiple Users

```typescript
// Notify all couriers in a city
const courierIds = await prisma.user.findMany({
  where: {
    roles: { has: Role.COURIER },
    courierProfile: {
      city: { id: cityId }
    }
  },
  select: { id: true }
});

await FCMService.sendToUsers(
  courierIds.map(c => c.id),
  NotificationType.SPOT_ANNOUNCEMENT,
  {
    spotName: 'Gelato Admin',
    message: 'New peak hour bonuses available'
  },
  {},
  prisma
);
```

### Send to Topic

```typescript
// Broadcast to all clients
await FCMService.sendToTopic(
  'clients',
  NotificationType.NEWS_PUBLISHED,
  'pl',
  {
    newsTitle: 'New Ice Cream Flavor: Lavender Honey'
  }
);
```

### Manual Topic Management

```typescript
// Subscribe tokens to topic
await FCMService.subscribeToTopic(
  ['token1', 'token2', 'token3'],
  'vip_customers'
);

// Unsubscribe from topic
await FCMService.unsubscribeFromTopic(
  ['token1'],
  'vip_customers'
);
```

## Order Flow Notifications

### 1. Order Placed (Client)
```typescript
// When order is created
await FCMService.sendToUser(
  order.userId,
  NotificationType.ORDER_PLACED,
  { orderId: order.id },
  { orderId: order.id },
  prisma
);
```

### 2. Order Confirmed (Client)
```typescript
// When spot confirms order
await FCMService.sendToUser(
  order.userId,
  NotificationType.ORDER_CONFIRMED,
  { spotName: spot.name },
  { orderId: order.id },
  prisma
);
```

### 3. Order Ready (Client)
```typescript
// When order is prepared
await FCMService.sendToUser(
  order.userId,
  NotificationType.ORDER_READY,
  {},
  { orderId: order.id },
  prisma
);
```

### 4. Courier Assigned (Client + Courier)
```typescript
// Notify client
await FCMService.sendToUser(
  order.userId,
  NotificationType.COURIER_ASSIGNED,
  { courierName: courier.name },
  { orderId: order.id },
  prisma
);

// Notify courier
await FCMService.sendToUser(
  courier.id,
  NotificationType.COURIER_ASSIGNED,
  { spotName: spot.name },
  { orderId: order.id, deliveryId: delivery.id },
  prisma
);
```

### 5. Out for Delivery (Client)
```typescript
// When courier picks up order
await FCMService.sendToUser(
  order.userId,
  NotificationType.ORDER_OUT_FOR_DELIVERY,
  {
    courierName: courier.name,
    estimatedTime: '15'
  },
  { orderId: order.id },
  prisma
);
```

### 6. Courier Nearby (Client)
```typescript
// When courier is within 500m
await FCMService.sendToUser(
  order.userId,
  NotificationType.COURIER_NEARBY,
  {},
  { orderId: order.id },
  prisma
);
```

### 7. Order Delivered (Client)
```typescript
// When delivery is complete
await FCMService.sendToUser(
  order.userId,
  NotificationType.ORDER_DELIVERED,
  {},
  { orderId: order.id },
  prisma
);
```

## Loyalty Points Notifications

```typescript
// Points earned
await FCMService.sendToUser(
  userId,
  NotificationType.POINTS_EARNED,
  {
    points: '500',
    totalPoints: '1500'
  },
  {},
  prisma
);

// Referral reward
await FCMService.sendToUser(
  userId,
  NotificationType.REFERRAL_REWARD,
  { points: '700' },
  {},
  prisma
);

// Quest completed
await FCMService.sendToUser(
  userId,
  NotificationType.QUEST_COMPLETED,
  {
    questName: 'First 5 Orders',
    points: '1000'
  },
  {},
  prisma
);
```

## Testing

### 1. Get FCM Token from Mobile App

```typescript
// In Expo app
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status !== 'granted') {
    alert('Permission denied!');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('FCM Token:', token);
  
  // Register with backend
  await registerFCMToken({ variables: { token } });
}
```

### 2. Test Notification via GraphQL

```graphql
# Register token
mutation {
  registerFCMToken(token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]")
}

# Send test notification
mutation {
  sendTestNotification
}
```

### 3. Test Admin Broadcast

```graphql
mutation {
  broadcastToClients(
    title: "Test Notification"
    body: "This is a test broadcast"
    language: pl
  )
}
```

## Topics

The system uses 3 main topics:

### clients
- All users with CLIENT role
- Order updates, promotions, news

### couriers
- All users with COURIER role
- Delivery assignments, bonuses, announcements

### spot_staff
- All users with SPOT_ADMIN or EMPLOYEE role
- New orders, system updates, admin messages

## Notification Channels (Android)

Default channel configuration:
```typescript
android: {
  priority: 'high',
  notification: {
    sound: 'default',
    channelId: 'gelato_notifications',
  },
}
```

Mobile apps should create the channel:
```typescript
await Notifications.setNotificationChannelAsync('gelato_notifications', {
  name: 'Gelato Notifications',
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'default',
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#4a044e',
});
```

## iOS Configuration

APNS settings:
```typescript
apns: {
  payload: {
    aps: {
      sound: 'default',
      badge: 1,
    },
  },
}
```

Add notification capabilities in `app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["remote-notification"]
    }
  }
}
```

## Error Handling

```typescript
// Service automatically handles errors
const sent = await FCMService.sendToUser(userId, type, vars, data, prisma);

if (sent === 0) {
  console.warn('No notifications sent - user may not have FCM tokens');
}
```

Common issues:
- **No tokens registered**: User hasn't granted notification permissions
- **Invalid token**: Token expired or device uninstalled app
- **Firebase not initialized**: Missing credentials in .env

## Security

1. **Token storage**: FCM tokens stored in User.fcmTokens array
2. **Topic access**: Only authenticated users can register tokens
3. **Admin broadcasts**: Restricted to SUPER_ADMIN and SPOTS_ADMIN
4. **Rate limiting**: Implement rate limiting on broadcast mutations
5. **Token cleanup**: Remove invalid tokens automatically

## Performance

- Batch notifications use `sendToUsers()` for efficiency
- Topic broadcasts scale to millions of users
- No polling required - push-based delivery
- Average delivery latency: <1 second

## Monitoring

Track notification metrics:
```typescript
// Log all notifications
console.log(`📱 Notification sent: ${type} to ${userId}`);

// Track success rates
const successCount = await FCMService.sendToUsers(...);
console.log(`Sent ${successCount}/${userIds.length} notifications`);
```

## Production Checklist

- [ ] Upload real Firebase service account JSON
- [ ] Update FIREBASE_SERVICE_ACCOUNT_PATH in production .env
- [ ] Configure iOS APNS certificates in Firebase Console
- [ ] Add Android SHA-256 fingerprint in Firebase Console
- [ ] Test notifications on physical devices (not simulator)
- [ ] Set up notification channels in mobile apps
- [ ] Implement notification click handlers
- [ ] Add unsubscribe options for user preferences
- [ ] Monitor FCM quota and delivery rates
- [ ] Set up error alerting for failed notifications

## Future Enhancements

1. **Rich notifications**: Images, actions, custom sounds
2. **Scheduled notifications**: Reminder before order arrives
3. **Notification preferences**: Per-category opt-in/out
4. **A/B testing**: Test notification copy and timing
5. **Analytics**: Track open rates and conversions
6. **Silent notifications**: Background data sync
7. **Notification history**: In-app notification center

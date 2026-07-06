# WebSocket Real-Time Updates Documentation

## Overview

The Gelato backend implements WebSocket support for real-time updates using GraphQL Subscriptions with `graphql-ws`. This enables instant notifications for:
- Order status changes
- Courier GPS location updates  
- New order alerts for spot admins
- Loyalty points updates
- Delivery status tracking

## Architecture

**Stack:**
- `graphql-ws` - WebSocket GraphQL protocol
- `graphql-subscriptions` - PubSub implementation
- TypeGraphQL `@Subscription` decorators
- JWT authentication for WebSocket connections

**Endpoints:**
- HTTP GraphQL: `http://localhost:4000/graphql`
- WebSocket: `ws://localhost:4000/graphql`

## Subscription Topics

```typescript
enum SubscriptionTopic {
  ORDER_CREATED              // New order placed
  ORDER_STATUS_CHANGED       // Order status updated
  ORDER_ASSIGNED             // Order assigned to courier
  ORDER_CANCELLED            // Order cancelled
  DELIVERY_STATUS_CHANGED    // Delivery status updated
  COURIER_LOCATION_UPDATED   // Courier GPS update (every 1 min)
  POINTS_UPDATED             // Loyalty points changed
  NEW_ORDER_NOTIFICATION     // New order alert for spot
  COURIER_REQUEST            // Courier application
  MESSAGE_RECEIVED           // Chat message
  SPOT_UPDATED               // Spot details changed
  NEWS_PUBLISHED             // New news/announcement
}
```

## Authentication

WebSocket connections require JWT authentication via connection params:

```typescript
// Client connection example
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: {
      authorization: `Bearer ${accessToken}`,
    },
  })
);
```

The server validates the token and attaches the user to the context. Invalid tokens are rejected silently.

## Available Subscriptions

### 1. Order Status Changes (Clients)

Subscribe to updates for your own orders:

```graphql
subscription OrderStatusChanged {
  orderStatusChanged
}
```

**Filters:** Only sends updates for orders belonging to the authenticated user.

**Use case:** Client app showing real-time order progress.

---

### 2. Courier Location Updates (Clients)

Subscribe to GPS updates for delivery tracking:

```graphql
subscription CourierLocation {
  courierLocationUpdated {
    deliveryId
    latitude
    longitude
    timestamp
  }
}
```

**Filters:** Only sends updates for deliveries associated with the user's orders.

**Update frequency:** Every 1 minute (when courier app sends location).

**Use case:** Live delivery tracking map in client app.

---

### 3. Points Updates (Clients)

Subscribe to loyalty points changes:

```graphql
subscription PointsUpdated {
  pointsUpdated {
    userId
    totalPoints
    availablePoints
    change
  }
}
```

**Filters:** Only sends updates for the authenticated user.

**Triggers:**
- Order completion
- Referral rewards
- Quest completion
- Prize redemption

**Use case:** Real-time points balance updates.

---

### 4. New Order Notifications (Spot Staff)

Subscribe to new orders for managed spots:

```graphql
subscription NewOrders {
  newOrderNotification
}
```

**Permissions:** SUPER_ADMIN, SPOTS_ADMIN, SPOT_ADMIN, EMPLOYEE

**Filters:**
- SUPER_ADMIN / SPOTS_ADMIN: All orders
- SPOT_ADMIN / EMPLOYEE: Only orders for their spots

**Use case:** Real-time order alerts in spot admin app with sound/vibration.

---

### 5. Delivery Status Changes (Couriers)

Subscribe to delivery updates:

```graphql
subscription DeliveryStatus {
  deliveryStatusChanged
}
```

**Permissions:** COURIER

**Filters:** Only deliveries assigned to the authenticated courier.

**Use case:** Courier app showing assigned delivery updates.

---

### 6. Order Assignments (Couriers)

Subscribe to new delivery assignments:

```graphql
subscription OrderAssigned {
  orderAssigned {
    order
    courier
  }
}
```

**Permissions:** COURIER

**Filters:** Only assignments for the authenticated courier.

**Use case:** Push notification when new delivery is assigned.

---

### 7. Courier Requests (Spot Admins)

Subscribe to courier application requests:

```graphql
subscription CourierRequests {
  courierRequest {
    spotId
    courier
  }
}
```

**Permissions:** SUPER_ADMIN, SPOTS_ADMIN, SPOT_ADMIN

**Filters:**
- SUPER_ADMIN / SPOTS_ADMIN: All requests
- SPOT_ADMIN: Only requests for their managed spots

**Use case:** Real-time courier application alerts.

---

### 8. Spot Updates (Public)

Subscribe to spot changes:

```graphql
subscription SpotUpdated {
  spotUpdated
}
```

**Permissions:** None (public)

**Triggers:**
- Hours changed
- Menu updated
- Temporarily closed

**Use case:** Update spot details in client app without refresh.

---

### 9. News Published (Public)

Subscribe to news/announcements:

```graphql
subscription NewsPublished {
  newsPublished
}
```

**Permissions:** None (public)

**Use case:** Show new announcements in client app.

## Publishing Events

### From Resolvers

```typescript
import { PubSubService } from '../services/PubSubService';

// When order status changes
await PubSubService.publishOrderStatusChanged(order);

// When courier updates location
await PubSubService.publishCourierLocationUpdated(
  deliveryId,
  latitude,
  longitude,
  new Date()
);

// When points are earned
await PubSubService.publishPointsUpdated(
  userId,
  totalPoints,
  availablePoints,
  change
);

// When new order is placed
await PubSubService.publishNewOrderNotification(spotId, order);
```

### Example: Order Flow

```typescript
// 1. Order created
const order = await prisma.order.create({ data: orderData });
await PubSubService.publishOrderCreated(order);

// 2. Spot confirms order
await prisma.order.update({
  where: { id: orderId },
  data: { status: OrderStatus.CONFIRMED },
});
await PubSubService.publishOrderStatusChanged(updatedOrder);

// 3. Courier assigned
await prisma.delivery.create({ data: deliveryData });
await PubSubService.publishOrderAssigned(order, courier);

// 4. Courier updates location (every minute)
setInterval(() => {
  await PubSubService.publishCourierLocationUpdated(
    deliveryId,
    currentLat,
    currentLng,
    new Date()
  );
}, 60000);

// 5. Order delivered
await prisma.order.update({
  where: { id: orderId },
  data: { status: OrderStatus.DELIVERED },
});
await PubSubService.publishOrderStatusChanged(updatedOrder);
await PubSubService.publishPointsUpdated(userId, ...);
```

## Client Implementation

### React Native with Apollo Client

```typescript
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  headers: {
    authorization: `Bearer ${accessToken}`,
  },
});

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: {
      authorization: `Bearer ${accessToken}`,
    },
    on: {
      connected: () => console.log('🔌 Connected to WebSocket'),
      closed: () => console.log('🔌 Disconnected from WebSocket'),
      error: (error) => console.error('❌ WebSocket error:', error),
    },
  })
);

// Split links based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Create Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
```

### Using Subscriptions in Components

```typescript
import { useSubscription, gql } from '@apollo/client';

const ORDER_STATUS_SUBSCRIPTION = gql`
  subscription OnOrderStatusChanged {
    orderStatusChanged
  }
`;

function OrderTracker({ orderId }) {
  const { data, loading } = useSubscription(ORDER_STATUS_SUBSCRIPTION);

  useEffect(() => {
    if (data?.orderStatusChanged) {
      console.log('Order status updated:', data.orderStatusChanged);
      // Update UI, show notification, etc.
    }
  }, [data]);

  return <View>...</View>;
}
```

### Courier Location Tracking

```typescript
const COURIER_LOCATION_SUBSCRIPTION = gql`
  subscription OnCourierLocation {
    courierLocationUpdated {
      deliveryId
      latitude
      longitude
      timestamp
    }
  }
`;

function DeliveryMap({ deliveryId }) {
  const { data } = useSubscription(COURIER_LOCATION_SUBSCRIPTION);

  useEffect(() => {
    if (data?.courierLocationUpdated) {
      const { latitude, longitude } = data.courierLocationUpdated;
      // Update marker position on map
      updateCourierMarker(latitude, longitude);
    }
  }, [data]);

  return <MapView>...</MapView>;
}
```

## Testing WebSockets

### Using GraphQL Playground

1. Open `http://localhost:4000/graphql` in browser
2. Click "SCHEMA" tab to see available subscriptions
3. Write subscription query:

```graphql
subscription {
  orderStatusChanged
}
```

4. Click play button
5. In another tab, trigger the event (e.g., update order status)
6. See real-time update in subscription tab

### Using wscat

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:4000/graphql -s graphql-ws

# Send connection init with auth
> {"type":"connection_init","payload":{"authorization":"Bearer YOUR_TOKEN"}}

# Subscribe to updates
> {"id":"1","type":"subscribe","payload":{"query":"subscription { orderStatusChanged }"}}

# Receive updates
< {"id":"1","type":"next","payload":{"data":{"orderStatusChanged":"..."}}}
```

### Using curl (HTTP SSE alternative)

WebSockets are required for subscriptions. HTTP polling is not supported.

## Performance Considerations

**In-Memory PubSub:**
- Current implementation uses in-memory `graphql-subscriptions`
- Works for single-server deployments
- **Not suitable for multi-server/horizontal scaling**

**For Production:**
- Use Redis PubSub: `graphql-redis-subscriptions`
- Allows multiple backend servers to share subscriptions
- Install: `npm install graphql-redis-subscriptions ioredis`

```typescript
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const options = {
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
};

const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});
```

**Connection Limits:**
- Monitor concurrent WebSocket connections
- Implement connection limits per user if needed
- Consider using connection pooling

**Bandwidth:**
- Courier location updates: ~100 bytes every 60s
- With 100 active deliveries: ~10 KB/min
- Manageable for most networks

## Security

**Authentication:**
- JWT token required in connection params
- Token validation on connection
- Token version checked (invalidation support)

**Authorization:**
- Subscription filters check user roles
- Users only receive events they're allowed to see
- SPOT_ADMIN limited to their managed spots

**Rate Limiting:**
- Consider implementing connection rate limits
- Prevent subscription spam
- Monitor for abuse

## Monitoring

**Metrics to track:**
- Active WebSocket connections
- Subscription count by type
- Event publish frequency
- Failed authentication attempts
- Connection/disconnection rate

**Logging:**
```typescript
console.log('🔌 WebSocket client connected');
console.log('🔌 WebSocket client disconnected');
console.log('📡 Published event: ORDER_STATUS_CHANGED');
```

## Troubleshooting

**Connection fails:**
- Check if WebSocket port is open
- Verify JWT token is valid
- Check firewall/proxy settings
- Ensure `ws://` protocol (not `wss://` in dev)

**Not receiving updates:**
- Verify user has permission for subscription
- Check subscription filters
- Confirm events are being published
- Test with GraphQL Playground first

**Memory leaks:**
- Ensure subscriptions are unsubscribed on unmount
- Clean up event listeners
- Monitor server memory usage

**Firewall/Proxy issues:**
- Some corporate firewalls block WebSockets
- Fallback to HTTP polling if needed (not implemented)
- Use `wss://` in production with SSL

## Production Checklist

- [ ] Switch to Redis PubSub for multi-server support
- [ ] Enable `wss://` (WebSocket Secure) with SSL certificate
- [ ] Implement connection rate limiting
- [ ] Set up monitoring for WebSocket connections
- [ ] Configure reverse proxy (nginx) for WebSocket support
- [ ] Test with high concurrent connection load
- [ ] Implement reconnection logic in mobile apps
- [ ] Add connection heartbeat/ping-pong
- [ ] Set up alerts for connection spike/drop
- [ ] Document WebSocket URLs for production

## Future Enhancements

1. **Typed Subscriptions** - Generate TypeScript types from schema
2. **Subscription Batching** - Group multiple updates
3. **Selective Updates** - Only send changed fields
4. **Presence System** - Online/offline user status
5. **Chat System** - Real-time messaging between users and spots
6. **Notification History** - Store missed events for offline users
7. **Connection Recovery** - Automatic reconnection with exponential backoff
8. **Compression** - Reduce bandwidth with message compression

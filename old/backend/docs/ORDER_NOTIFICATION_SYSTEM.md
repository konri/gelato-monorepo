# Order Notification System

Digital replacement for paper-based order number systems at food vendor locations. Vendors assign order numbers to customers and notify them when their food is ready via push notification, SMS, SSE, or a public queue screen.

## Environment Variables

| Variable                      | Default                 | Description                                    |
| ----------------------------- | ----------------------- | ---------------------------------------------- |
| `MAX_ACTIVE_ORDERS_PER_STORE` | `500`                   | Max concurrent active orders per store         |
| `ORDER_ARCHIVE_DELAY_MS`      | `1800000` (30 min)      | Delay before READY → PICKED_UP auto-transition |
| `SESSION_TTL_MS`              | `7200000` (2 hours)     | WebOrderSession expiry duration                |
| `SSE_HEARTBEAT_MS`            | `15000` (15 sec)        | SSE heartbeat interval                         |
| `ORDER_BASE_URL`              | `http://localhost:3000` | Base URL for venue QR code links               |

---

## Four Customer-Facing Modes

### Mode 1 — App User (Push Notification)

Vendor scans customer's personal QR code → order created linked to user account → push notification sent on READY.

### Mode 2 — Web Browser (SSE)

Customer scans venue QR code → anonymous session created → vendor assigns order to session → customer's browser receives real-time status via SSE.

### Mode 3 — Public Queue Screen (SSE)

Public display showing all active orders for a store, grouped by PREPARING and READY, updated in real-time via SSE.

### Mode 4 — Phone Order (SMS + Auto-detect)

Customer provides phone number (in-person or by phone) → vendor creates order → system:

- Auto-detects if user exists with that phone number
- If user exists → sends push notification (primary) + SMS (backup)
- If user doesn't exist → sends SMS with tracking link
- SMS on order created: "Zamówienie #45 przyjęte! Śledź status: https://app.easybons.com/order/track/45LW"
- SMS on READY: "🎉 Zamówienie #45 gotowe do odbioru! Kod: 45LW"

**Use Cases:**

- Customer at counter without app: "Numer telefonu?" → +48 123 456 789 → SMS
- Customer calls to order: "Poproszę pizzę, numer +48 123 456 789" → SMS
- Customer has app: System detects → Push notification + SMS backup

---

## REST Endpoints

### Create Web Session

```
POST /orders/venue/:storeId/session
```

No auth required. Creates a `WebOrderSession` for a customer who scanned the venue QR code.

**Response 200:**

```json
{ "sessionToken": "abc123...", "expiresAt": "2026-03-14T12:00:00.000Z" }
```

**Response 404:** `{ "error": "Store not found" }`

---

### Poll Session Status

```
GET /orders/session/:sessionToken
```

No auth required. Returns current order status for clients without SSE support.

**Response 200 (no order yet):** `{ "status": "PENDING" }`

**Response 200 (order exists):** `{ "status": "PREPARING", "orderNumber": 7 }`

**Response 404:** `{ "error": "Session not found or expired" }`

---

### Session SSE Stream

```
GET /orders/session/:sessionToken/status-stream
```

No auth required. Streams order status updates via Server-Sent Events.

**Events:**

- `event: status` — `{ "status": "READY", "orderNumber": 7 }`
- `event: expired` — `{}` (session TTL reached)
- `: heartbeat` — every `SSE_HEARTBEAT_MS` ms

**Response 404:** session not found or expired.

---

### Queue Snapshot

```
GET /orders/queue/:storeId
```

No auth required. Returns all active orders for today grouped by status.

**Response 200:**

```json
{ "preparing": [1, 3, 5], "ready": [2, 4], "lastReadyOrderNumber": 4 }
```

**Response 404:** `{ "error": "Store not found" }`

---

### Queue SSE Stream

```
GET /orders/queue/:storeId/stream
```

No auth required. Streams queue updates via SSE. Sends initial snapshot immediately on connect.

**Events:**

- `event: queue` — `{ "preparing": [...], "ready": [...], "lastReadyOrderNumber": N }`
- `: heartbeat` — every `SSE_HEARTBEAT_MS` ms

---

### Next PREPARING Order

```
GET /orders/:storeId/next
Authorization: Bearer <token>
Roles: OWNER, COOPERATOR, ADMIN
```

Returns the oldest PREPARING order for the store.

**Response 200:** Order object

**Response 204:** No PREPARING orders

**Response 403:** `{ "error": "Access denied" }`

---

## GraphQL API

### Mutations

#### createOrderByUserQR

Creates an order by scanning a customer's personal QR code (Mode 1).

```graphql
mutation {
  createOrderByUserQR(input: { userId: "<userId>", merchantStoreId: "<storeId>" }) {
    orderId
    orderNumber
  }
}
```

Roles: `OWNER`, `COOPERATOR`, `ADMIN`

Errors: `403` access denied, `404` user not found, `429` too many active orders.

---

#### createOrderBySession

Creates an order linked to a web session (Mode 2).

```graphql
mutation {
  createOrderBySession(input: { sessionToken: "<token>", merchantStoreId: "<storeId>" }) {
    orderId
    orderNumber
  }
}
```

Roles: `OWNER`, `COOPERATOR`, `ADMIN`

Errors: `403` access denied, `404` session not found, `410` session expired, `429` too many active orders.

---

#### createOrderByPhone

Creates an order by phone number (Mode 4). Auto-detects if user exists and sends appropriate notifications.

```graphql
mutation {
  createOrderByPhone(input: { phoneNumber: "+48123456789", merchantStoreId: "<storeId>", note: "Pizza Margherita" }) {
    orderId
    orderNumber
  }
}
```

Roles: `OWNER`, `COOPERATOR`, `ADMIN`

**Behavior:**

- Checks if user with phone number exists
- If user exists: Links order to userId (push notification on READY)
- If user doesn't exist: Creates order with phone only (SMS only)
- Sends SMS immediately: "Zamówienie #45 przyjęte w [Store Name]! Śledź status: https://..."
- On READY: Sends SMS "🎉 Zamówienie #45 gotowe do odbioru! Kod: 45LW"

Errors: `400` invalid phone, `403` access denied, `429` too many active orders.

---

#### markOrderReady

Transitions an order from PREPARING → READY. Triggers push notification (Mode 1), SSE events (Mode 2 & 3), and schedules auto-archive job.

```graphql
mutation {
  markOrderReady(input: { orderId: "<id>" }) {
    id
    orderNumber
    status
  }
}
```

Roles: `OWNER`, `COOPERATOR`, `ADMIN`

Errors: `403` access denied, `404` order not found, `409` already READY.

---

### Queries

#### activeOrders

Returns all PREPARING and READY orders for today, sorted by orderNumber.

```graphql
query {
  activeOrders(merchantStoreId: "<storeId>") {
    id
    orderNumber
    status
    userId
    sessionToken
    createdAt
  }
}
```

Roles: `OWNER`, `COOPERATOR`, `ADMIN`

---

#### venueQRCode

Returns the stable URL for the venue QR code.

```graphql
query {
  venueQRCode(merchantStoreId: "<storeId>") {
    url
    storeId
  }
}
```

Roles: `OWNER`, `COOPERATOR`, `ADMIN`

Response: `{ "url": "https://app.example.com/order/<storeId>", "storeId": "<storeId>" }`

---

#### myQRCode

Returns the customer's static `userId` encoded as the QR token. No expiry — the QR is permanent and never needs refreshing.

```graphql
query {
  myQRCode {
    token
    expiresAt
  }
}
```

Roles: `CLIENT`

Note: `token` is the user's `id`. `expiresAt` is set far in the future and can be ignored.

---

## Architecture Notes

- Order numbers are sequential per store per calendar day, generated via atomic PostgreSQL upsert — no application-level locking.
- SSE uses Redis Pub/Sub with two dedicated IORedis connections (separate from BullMQ) to avoid blocking.
- BullMQ handles two background jobs: `order-archive` (READY → PICKED_UP after delay) and `session-cleanup` (close expired sessions).
- `orderDate` is scoped to the merchant's local timezone, not UTC.
- **SMS Integration**: Uses Twilio for SMS notifications. Requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` env vars.
- **Phone Order Flow**:
  1. Vendor enters phone number
  2. System checks if user exists with that phone
  3. If user exists: order.userId set → push notification + SMS
  4. If user doesn't exist: order.phoneNumber set → SMS only
  5. SMS sent immediately on order creation
  6. SMS sent again when order marked READY
- **Public Tracking Page**: `https://app.easybons.com/order/track/{pickupCode}` — works without login, shows real-time order status via SSE.

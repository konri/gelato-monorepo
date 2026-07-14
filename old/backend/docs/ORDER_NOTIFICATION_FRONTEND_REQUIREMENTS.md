# Order Notification System — Frontend Requirements

This document describes what the **React web app** and **React Native mobile app** need to implement to support the Order Notification System. It is written from the frontend perspective and references the backend API defined in `docs/ORDER_NOTIFICATION_SYSTEM.md`.

---

## Overview

There are three distinct frontend surfaces:

| Surface                 | Platform        | Who uses it                                              |
| ----------------------- | --------------- | -------------------------------------------------------- |
| **Vendor Panel**        | Web app (React) | Vendor staff — creates orders, marks them ready          |
| **Customer Order Page** | Web app (React) | Customer — scans venue QR, watches order status          |
| **Queue Screen**        | Web app (React) | Public display — shows all active orders                 |
| **Mobile App**          | React Native    | Customer — shows personal QR, receives push notification |

---

## 1. Mobile App (React Native)

### 1.1 My Order QR Code Screen

**Purpose:** Customer shows this QR to the vendor so the vendor can scan it and create an order linked to their account.

**GraphQL query:**

```graphql
query {
  myQRCode {
    token
    expiresAt
  }
}
```

Required role: `CLIENT`

**UI requirements:**

- Display a QR code encoding the `token` value (use a library like `react-native-qrcode-svg`)
- The token is the customer's static `userId` — it never expires, no refresh needed
- No countdown timer, no auto-refresh, no "Refresh" button required
- Screen title: "My Order QR Code" (or localised equivalent)

**States to handle:**

- Loading — spinner while fetching
- Active — QR code displayed permanently
- Error — "Could not load QR code, tap to retry"

---

### 1.2 Push Notification — Order Ready

**Purpose:** Customer receives a push notification when their order status changes to READY.

**Notification payload (sent by backend via FCM):**

```json
{
  "title": "Your order is ready",
  "body": "Order #7 is ready for pickup",
  "data": {
    "type": "ORDER_READY",
    "orderId": "<uuid>",
    "orderNumber": 7
  }
}
```

**Requirements:**

- Handle `ORDER_READY` notification type in the notification handler
- On tap: navigate to an "Order Ready" screen or show an in-app banner
- Display order number prominently
- No action required from the user — notification is informational only

**Note:** Push notification infrastructure (FCM token registration, `NotificationToken` model) already exists in the app. Only the `ORDER_READY` type handling needs to be added.

---

## 2. Web App (React) — Vendor Panel

The vendor panel is the existing merchant dashboard. The following screens need to be added.

### 2.1 Create Order — Scan Customer QR (Mode 1)

**Purpose:** Vendor scans a customer's personal QR code to create an order.

**GraphQL mutation:**

```graphql
mutation CreateOrderByUserQR($input: CreateOrderByUserQRInput!) {
  createOrderByUserQR(input: $input) {
    orderId
    orderNumber
  }
}
```

Input: `{ userId: string, merchantStoreId: string }`

Required role: `OWNER`, `COOPERATOR`, or `ADMIN`

**UI requirements:**

- QR code scanner component (camera access)
- On successful scan: decode the QR value as `userId`, call the mutation
- Show the assigned order number prominently after success (e.g. "Order #7 created")
- Auto-dismiss or allow vendor to scan next customer

**Error handling:**
| Error | Message to show |
|---|---|
| 403 | "You don't have access to this store" |
| 404 | "Customer not found" |
| 429 | "Too many active orders — mark some as ready first" |

---

### 2.2 Create Order — Web Session (Mode 2)

**Purpose:** Vendor scans a session QR code (from the customer's browser) to create an order.

**GraphQL mutation:**

```graphql
mutation CreateOrderBySession($input: CreateOrderBySessionInput!) {
  createOrderBySession(input: $input) {
    orderId
    orderNumber
  }
}
```

Input: `{ sessionToken: string, merchantStoreId: string }`

Required role: `OWNER`, `COOPERATOR`, or `ADMIN`

**UI requirements:**

- Same QR scanner as Mode 1 — the scanned value is the `sessionToken`
- The vendor UI can use a single scanner screen that handles both QR types (distinguish by token format or a prefix)
- On success: show assigned order number

**Error handling:**
| Error | Message to show |
|---|---|
| 403 | "You don't have access to this store" |
| 404 | "Session not found — ask customer to re-scan venue QR" |
| 410 | "Session expired — ask customer to re-scan venue QR" |
| 429 | "Too many active orders — mark some as ready first" |

---

### 2.3 Active Orders List

**Purpose:** Vendor sees all current PREPARING and READY orders for their store.

**GraphQL query:**

```graphql
query ActiveOrders($merchantStoreId: ID!) {
  activeOrders(merchantStoreId: $merchantStoreId) {
    id
    orderNumber
    status
    createdAt
  }
}
```

Required role: `OWNER`, `COOPERATOR`, or `ADMIN`

**UI requirements:**

- List grouped by status: PREPARING section, READY section
- Each item shows: order number, time elapsed since creation
- "Mark Ready" button on each PREPARING order
- Poll or refetch on a short interval (e.g. every 10s) — or use the queue SSE stream as the data source
- Empty state: "No active orders"

---

### 2.4 Mark Order Ready

**Purpose:** Vendor marks an order as ready, triggering notifications.

**GraphQL mutation:**

```graphql
mutation MarkOrderReady($input: MarkOrderReadyInput!) {
  markOrderReady(input: $input) {
    id
    orderNumber
    status
  }
}
```

Input: `{ orderId: ID }`

Required role: `OWNER`, `COOPERATOR`, or `ADMIN`

**UI requirements:**

- Triggered from the Active Orders list (button per order)
- Optimistic UI: immediately move order to READY section
- On error: revert and show error message

**Error handling:**
| Error | Message to show |
|---|---|
| 403 | "Access denied" |
| 404 | "Order not found" |
| 409 | "Order is already marked as ready" |

---

### 2.5 Venue QR Code

**Purpose:** Vendor displays or prints the venue QR code for customers to scan.

**GraphQL query:**

```graphql
query VenueQRCode($merchantStoreId: ID!) {
  venueQRCode(merchantStoreId: $merchantStoreId) {
    url
    storeId
  }
}
```

Required role: `OWNER`, `COOPERATOR`, or `ADMIN`

**UI requirements:**

- Display QR code encoding the `url` value
- "Download" / "Print" button
- The URL is stable — no need to refresh it
- URL format: `<ORDER_BASE_URL>/order/<storeId>`

---

### 2.6 Next Order Convenience (optional)

**Purpose:** Vendor can quickly see the next order to prepare.

**REST endpoint:**

```
GET /orders/:storeId/next
Authorization: Bearer <token>
```

**Response:**

- `200` — order object with `orderNumber`, `status`, etc.
- `204` — no PREPARING orders

**UI requirements:**

- "Next Order" button or widget in the vendor panel
- Shows the lowest-numbered PREPARING order
- 204 → show "No orders waiting"

---

## 3. Web App (React) — Customer Order Page

This is a **new standalone page** (not behind auth) accessible at the URL encoded in the venue QR code:

```
<ORDER_BASE_URL>/order/<storeId>
```

### 3.1 Session Initialization

When the customer navigates to `/order/:storeId`:

1. Call `POST /orders/venue/:storeId/session` to create a session
2. Store `sessionToken` in component state (or `sessionStorage`)
3. Proceed to the waiting screen

**REST call:**

```
POST /orders/venue/:storeId/session
```

**Response:** `{ sessionToken: string, expiresAt: string }`

**Error handling:**

- 404 → "This venue was not found"
- Network error → "Could not connect, please try again"

---

### 3.2 Order Status Page (SSE)

**Purpose:** Customer waits for their order to be called.

**Primary: SSE stream**

```
GET /orders/session/:sessionToken/status-stream
```

Connect using `EventSource` or a custom hook. Handle these events:

| Event               | Data                                      | Action                             |
| ------------------- | ----------------------------------------- | ---------------------------------- |
| `status`            | `{ "status": "READY", "orderNumber": 7 }` | Show "Your order is ready!" screen |
| `expired`           | `{}`                                      | Show "Session expired" screen      |
| heartbeat (comment) | —                                         | No action (keep-alive)             |

**Fallback: polling**
If SSE is not supported or connection fails, fall back to polling:

```
GET /orders/session/:sessionToken
```

Poll every 5 seconds. Response: `{ status: "PENDING" | "PREPARING" | "READY", orderNumber?: number }`

**UI states:**

| State     | Display                                                    |
| --------- | ---------------------------------------------------------- |
| PENDING   | "Waiting for your order number..." spinner                 |
| PREPARING | "Your order number is #7 — we're preparing it"             |
| READY     | "🎉 Order #7 is ready! Please collect your order."         |
| Expired   | "Your session has expired. Please scan the QR code again." |

**Requirements:**

- No login required
- Works on mobile browsers
- Large, readable order number display
- Sound/vibration on READY transition (optional, user-triggered)
- Page title updates to reflect status (e.g. "Order #7 — Ready!")

---

### 3.3 Session Expiry Handling

- `expiresAt` is returned on session creation — show a countdown or warning when < 5 minutes remain
- On `expired` SSE event or 404 polling response: show expiry screen with a "Scan QR again" prompt
- Do not auto-redirect — customer may need to re-scan the physical QR code

---

## 4. Web App (React) — Queue Screen

This is a **new public page** for display on a TV or tablet at the venue:

```
<ORDER_BASE_URL>/queue/<storeId>
```

### 4.1 Queue Display

**Primary: SSE stream**

```
GET /orders/queue/:storeId/stream
```

The first event on connect is always the current snapshot. Subsequent events are updates.

**Event:**

```
event: queue
data: { "preparing": [1, 3, 5], "ready": [2, 4], "lastReadyOrderNumber": 4 }
```

**Fallback: snapshot polling**

```
GET /orders/queue/:storeId
```

Poll every 5 seconds.

**UI requirements:**

- Two columns: "Preparing" and "Ready"
- Large, readable order numbers (designed for display at distance)
- Animate numbers moving from Preparing → Ready
- `lastReadyOrderNumber` can be highlighted or shown separately as "Now serving: #4"
- No login required
- Auto-reconnect SSE on disconnect (exponential backoff, max 30s)
- Show connection status indicator (connected / reconnecting)

**Error handling:**

- 404 → "Queue not found for this venue"
- SSE disconnect → show "Reconnecting..." and retry

---

## 5. Shared / Cross-Cutting

### 5.1 GraphQL Client Setup

All GraphQL calls require a JWT bearer token in the `Authorization` header for vendor operations. The existing Apollo Client setup in the web app should already handle this.

Vendor mutations/queries that require auth:

- `createOrderByUserQR`
- `createOrderBySession`
- `markOrderReady`
- `activeOrders`
- `venueQRCode`

Customer queries that require auth:

- `myQRCode` (CLIENT role)

Public REST endpoints (no auth):

- `POST /orders/venue/:storeId/session`
- `GET /orders/session/:sessionToken`
- `GET /orders/session/:sessionToken/status-stream`
- `GET /orders/queue/:storeId`
- `GET /orders/queue/:storeId/stream`

---

### 5.2 SSE Connection Pattern (React hook)

Recommended pattern for SSE in React:

```tsx
function useOrderStatusStream(sessionToken: string) {
  const [status, setStatus] = useState<'PENDING' | 'PREPARING' | 'READY' | 'EXPIRED'>('PENDING')
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  useEffect(() => {
    const es = new EventSource(`/orders/session/${sessionToken}/status-stream`)

    es.addEventListener('status', (e) => {
      const data = JSON.parse(e.data)
      setStatus(data.status)
      setOrderNumber(data.orderNumber)
    })

    es.addEventListener('expired', () => {
      setStatus('EXPIRED')
      es.close()
    })

    es.onerror = () => {
      // EventSource auto-reconnects — optionally show reconnecting state
    }

    return () => es.close()
  }, [sessionToken])

  return { status, orderNumber }
}
```

Same pattern applies for the queue stream (`event: queue`).

---

### 5.3 Route Summary

| Route                 | Component         | Auth                       |
| --------------------- | ----------------- | -------------------------- |
| `/order/:storeId`     | CustomerOrderPage | None                       |
| `/queue/:storeId`     | QueueScreen       | None                       |
| `/vendor/orders`      | VendorOrdersPanel | OWNER / COOPERATOR / ADMIN |
| `/vendor/qr-scanner`  | QRScannerScreen   | OWNER / COOPERATOR / ADMIN |
| `/vendor/venue-qr`    | VenueQRCodePage   | OWNER / COOPERATOR / ADMIN |
| (mobile) Order QR tab | MyOrderQRScreen   | CLIENT                     |

---

### 5.4 QR Code Libraries

**React (web):**

- Display QR: `qrcode.react` or `react-qr-code`
- Scan QR: `react-qr-reader` or `html5-qrcode`

**React Native (mobile):**

- Display QR: `react-native-qrcode-svg`
- Scan QR: `react-native-vision-camera` + `vision-camera-code-scanner`, or `expo-barcode-scanner`

---

## 6. Out of Scope (Backend Handles)

- Order number generation and uniqueness
- Push notification delivery via FCM
- Session expiry and cleanup
- READY → PICKED_UP auto-transition
- Redis Pub/Sub for multi-instance SSE broadcasting

# Requirements Document — Order Notification System

## Introduction

This document defines the requirements for the Order Notification System — a digital replacement for the paper-based order number system used in small food vendor locations (e.g., kebab stands, food stalls). The system allows vendors to assign order numbers to customers and notify them when their food is ready.

The feature integrates with the existing Node.js/Express/TypeGraphQL/Prisma/PostgreSQL backend and supports three simultaneous customer-facing modes:

- Mobile app users (push notification)
- Web browser users (real-time status page)
- Public queue display screen

All three modes share the same underlying order data and order numbers.

Redis is available in the stack (already used for BullMQ) and may be used to store active SSE connection state, WebOrderSession metadata, or act as a Pub/Sub layer for real-time events.

## Glossary

- **OrderService**: Backend service responsible for creating orders, generating order numbers, and marking orders as ready. Implements `createOrder()`, `generateOrderNumber()`, `markOrderReady()`.
- **OrderResolver**: TypeGraphQL resolver exposing GraphQL mutations and queries for order management.
- **OrderRepository**: Data access layer responsible for all database interactions related to orders and order counters.
- **Order**: Record representing a single customer order at a vendor location, with a status of `PREPARING`, `READY`, or `PICKED_UP`.
- **OrderCounter**: Per-vendor, per-date atomic counter stored in PostgreSQL for sequential, human-readable order numbers.
- **VenueQRCode**: Static QR code associated with a specific vendor location (MerchantStore) that customers scan to open the web order page.
- **UserQRCode**: Personal QR code associated with an authenticated app user, scanned by the vendor to link an order to the user account.
- **WebOrderSession**: Temporary, anonymous session created when a customer scans a VenueQRCode, used to track order status on the web order page without requiring login.
- **QueueScreen**: Public, read-only display showing all active orders for a vendor location, grouped by status (`PREPARING` and `READY`).
- **NotificationService**: Existing service (`src/services/NotificationService.ts`) used to send push notifications via Firebase Cloud Messaging.
- **MerchantStore**: Existing model representing a physical vendor location.
- **Vendor**: User with the `OWNER` or `COOPERATOR` role operating a MerchantStore.
- **SSE**: Server-Sent Events — unidirectional HTTP streaming mechanism used to push real-time order status updates to web clients.

---

## Requirements

### Requirement 1: Order Number Generation

**User Story:** As a vendor, I want each customer to receive a unique, short, sequential order number so that customers can easily identify and track their order.

#### Acceptance Criteria

1. THE OrderService SHALL generate order numbers as sequential integers starting from 1 for each MerchantStore per calendar day.
2. WHEN multiple orders are created concurrently for the same MerchantStore on the same date, THE OrderRepository SHALL use an atomic PostgreSQL upsert (`INSERT ... ON CONFLICT ... DO UPDATE SET last_number = last_number + 1 RETURNING last_number`) to guarantee uniqueness and prevent race conditions.
3. THE OrderService SHALL never delegate order number generation to any frontend client.
4. THE System SHALL NOT explicitly reset order counters at midnight. Instead, a new OrderCounter row SHALL be created automatically for each unique `(merchantStoreId, date)` pair when the first order of that day is created, relying on the PostgreSQL upsert to start the counter at 1 naturally.

   Expected table state example:

   ```
   merchantStoreId | date       | last_number
   ------------------------------------------
   storeA          | 2026-03-13 | 87
   storeA          | 2026-03-14 | 1
   ```

5. Order numbers SHALL be scoped per MerchantStore; two different stores may independently have order number 1 on the same day without conflict.
6. `orderDate` SHALL be stored in the merchant's local timezone to define daily scoping.

---

### Requirement 2: Order Creation — App User (Mode 1)

**User Story:** As a vendor, I want to scan a customer's personal QR code to create an order linked to their account so that the customer receives a push notification when their food is ready.

#### Acceptance Criteria

1. WHEN a vendor submits a `createOrderByUserQR` mutation with a valid `UserQRCode` payload and `merchantStoreId`, THE OrderService SHALL identify the user, create an Order record with status `PREPARING`, and return the generated order number.
2. Orders created via `UserQRCode` SHALL be linked to the authenticated user's account and visible in the user's order history.
3. IF the `UserQRCode` is invalid or expired, THE System SHALL return HTTP 404 `"User not found"` or HTTP 401 `"QR code expired"` as appropriate.
4. IF the vendor lacks access to the specified `merchantStoreId`, THE System SHALL return HTTP 403 `"Access denied"`.

---

### Requirement 3: WebOrderSession Creation (Mode 2)

**User Story:** As a customer without the mobile app, I want to scan a venue QR code to create a session in my browser, so that the vendor can later assign an order number to me.

#### Acceptance Criteria

1. WHEN a customer scans a VenueQRCode and the resulting URL is opened in a browser, THE System SHALL create a WebOrderSession but SHALL NOT create an Order at that time.
2. THE System SHALL expose a REST endpoint `POST /orders/venue/:storeId/session` that creates a WebOrderSession and returns a `sessionToken`.
3. THE WebOrderSession SHALL store: `sessionToken`, `merchantStoreId`, `createdAt`, `expiresAt`.
4. THE `sessionToken` SHALL be cryptographically random and stored server-side.
5. WHEN the vendor creates an order linked to the `sessionToken`, THE OrderService SHALL create the Order, assign an order number, and link it to the session.
6. IF `storeId` does not correspond to an active MerchantStore, THE System SHALL return HTTP 404 `"Store not found"`.

---

### Requirement 3a: WebOrderSession Expiration

**User Story:** As a system operator, I want web order sessions to expire automatically so that stale session records do not accumulate indefinitely.

#### Acceptance Criteria

1. THE WebOrderSession SHALL expire automatically after a configurable TTL (recommended default: 2 hours), stored in the `expiresAt` field.
2. AFTER a WebOrderSession has expired, THE System SHALL reject any attempt to create an order for that session with HTTP 410 `"Session expired"`.
3. AFTER a WebOrderSession has expired, THE System SHALL close any active SSE connections for that session.
4. Expired WebOrderSession records MAY be cleaned up by a background job using the existing BullMQ/Redis infrastructure.

---

### Requirement 4: Real-Time Order Status Updates — Web (Mode 2)

**User Story:** As a customer using the web order page, I want my browser to automatically update when my order status changes so that I do not need to manually refresh the page.

#### Acceptance Criteria

1. THE System SHALL expose a REST endpoint `GET /orders/session/:sessionToken/status-stream` that delivers real-time order status updates to the browser using Server-Sent Events (SSE).
2. WHEN the Order associated with a `sessionToken` transitions to status `READY`, THE System SHALL push an SSE event with the payload `{ "status": "READY", "orderNumber": <number> }` to all connected clients subscribed to that session.
3. WHILE a client is connected to the SSE stream, THE System SHALL send a heartbeat event every 15 seconds (configurable) to keep the connection alive.
4. IF the `sessionToken` does not correspond to any active WebOrderSession, THE System SHALL close the SSE stream with HTTP 404.
5. THE System SHALL expose a REST endpoint `GET /orders/session/:sessionToken` that returns the current order status and order number for polling clients that do not support SSE.

---

### Requirement 5: Public Queue Screen (Mode 3)

**User Story:** As a customer at a vendor location, I want to see a public screen showing all current order numbers grouped by status so that I know when to pick up my order without needing a phone.

#### Acceptance Criteria

1. THE System SHALL expose a REST endpoint `GET /orders/queue/:storeId` that returns all active orders for the specified MerchantStore, grouped into `preparing` (status `PREPARING`) and `ready` (status `READY`) arrays of order numbers. THE response MAY include additional metadata such as `lastReadyOrderNumber` to simplify queue screen rendering.

   Example response:

   ```json
   { "preparing": [34, 35, 36], "ready": [31, 32, 33], "lastReadyOrderNumber": 33 }
   ```

2. THE System SHALL expose a REST endpoint `GET /orders/queue/:storeId/stream` that delivers real-time queue updates to the QueueScreen using Server-Sent Events (SSE).
3. WHEN any Order for a MerchantStore changes status, THE System SHALL push an updated queue payload via SSE to all clients subscribed to that store's queue stream.
4. WHILE a client is connected to the queue SSE stream, THE System SHALL send a heartbeat event every 15 seconds (configurable) to keep the connection alive.
5. IF `storeId` does not correspond to an active MerchantStore, THE System SHALL return HTTP 404 `"Store not found"`.
6. THE System SHALL include only orders created on the current calendar day in the queue response.

---

### Requirement 6: Mark Order as Ready

**User Story:** As a vendor, I want to mark an order as ready with a single action so that the customer is notified immediately.

#### Acceptance Criteria

1. WHEN a vendor submits a `markOrderReady` mutation with a valid `orderId`, THE OrderService SHALL update the Order status from `PREPARING` to `READY`.
2. WHEN an Order is marked as `READY` and linked to an authenticated user account (Mode 1), THE OrderService SHALL invoke the NotificationService to send a push notification with title `"Your order is ready"` and message `"Order #<orderNumber> is ready for pickup"`.
3. WHEN an Order is marked as `READY` and linked to a WebOrderSession (Mode 2), THE System SHALL push an SSE event to all clients subscribed to that session's status stream.
4. WHEN an Order is marked as `READY`, THE System SHALL push an updated queue payload via SSE to all clients subscribed to that store's queue stream (Mode 3).
5. IF the `orderId` does not exist, THE System SHALL return HTTP 404 `"Order not found"`.
6. IF the Order status is already `READY`, THE System SHALL return HTTP 409 `"Order is already ready"`.
7. IF the vendor does not have access to the MerchantStore associated with the Order, THE System SHALL return HTTP 403 `"Access denied"`.

---

### Requirement 7: Vendor Order Management Interface (Backend)

**User Story:** As a vendor, I want to view all active orders for my location so that I can manage the queue efficiently.

#### Acceptance Criteria

1. THE System SHALL expose a GraphQL query `activeOrders(merchantStoreId: String!)` that returns all Orders with status `PREPARING` or `READY` created today for the specified store, ordered by `orderNumber` ascending.
2. IF the vendor does not have access to the specified `merchantStoreId`, THE System SHALL return HTTP 403 `"Access denied"`.
3. THE `activeOrders` query and `markOrderReady` mutation SHALL require the `OWNER`, `COOPERATOR`, or `ADMIN` role.

---

### Requirement 8: Order Lifecycle and Data Retention

**User Story:** As a system operator, I want completed orders to be automatically archived so that the active queue remains clean and performant.

#### Acceptance Criteria

1. THE System SHALL retain Order records in the database indefinitely for audit and history purposes.
2. WHEN querying the active queue or active orders list, THE OrderService SHALL filter to include only orders created on the current calendar day.
3. THE Order model SHALL store: `id`, `merchantStoreId`, `orderNumber`, `status` (`PREPARING` | `READY` | `PICKED_UP`), `userId` (nullable, Mode 1), `sessionToken` (nullable, Mode 2), `orderDate` (calendar date in merchant-local timezone, used for daily scoping), `createdAt`, `updatedAt`.
4. THE System MAY automatically transition Orders with status `READY` to status `PICKED_UP` after a configurable duration (recommended default: 30 minutes) to keep the active queue manageable. Orders with status `PICKED_UP` SHALL be excluded from the active queue and queue screen responses.

---

### Requirement 9: Push Notification Delivery

**User Story:** As a customer using the mobile app, I want to receive a push notification when my food is ready so that I can pick it up promptly.

#### Acceptance Criteria

1. WHEN an Order linked to a user account transitions to status `READY`, THE OrderService SHALL call `NotificationService.sendPushNotification()` with `type: "ORDER_READY"`, `category: "GENERAL"`, `title: "Your order is ready"`, and `message: "Order #<orderNumber> is ready for pickup"`.
2. THE NotificationService SHALL deliver the push notification to all active FCM-registered devices for the user via the existing BullMQ notification queue.
3. IF the user has no registered active devices, THE OrderService SHALL log the event and continue without error.
4. THE `NotificationType` enum in the Prisma schema SHALL be extended to include the `ORDER_READY` value.

---

### Requirement 10: VenueQRCode Generation

**User Story:** As a vendor, I want each of my store locations to have a unique QR code so that customers can scan it to open the web order page.

#### Acceptance Criteria

1. THE System SHALL expose a GraphQL query `venueQRCode(merchantStoreId: String!)` that returns a URL in the format `<BASE_URL>/order/<storeId>` for the specified MerchantStore.
2. IF the vendor does not have access to the specified `merchantStoreId`, THE System SHALL return HTTP 403 `"Access denied"`.
3. THE VenueQRCode URL SHALL be stable and not change over time for a given MerchantStore.

---

### Requirement 11: UserQRCode Availability

**User Story:** As a customer with the mobile app, I want to display my personal QR code so that the vendor can scan it to create my order.

#### Acceptance Criteria

1. THE System SHALL expose a GraphQL query `myOrderQRCode` that returns a signed, time-limited token encoding the authenticated user's `userId`.
2. THE token SHALL be valid for a maximum of 10 minutes from the time of generation.
3. THE `myOrderQRCode` query SHALL require the `CLIENT` role.
4. WHEN a vendor scans a `UserQRCode` token that has expired, THE System SHALL return HTTP 401 `"QR code expired"`.

---

### Requirement 12: Active Order Safety Limit

**User Story:** As a system operator, I want to prevent excessive order creation so that the system remains stable under unexpected load or bugs.

#### Acceptance Criteria

1. THE System SHOULD enforce a maximum of 500 active orders (status `PREPARING` or `READY`) per MerchantStore at any given time (configurable via `MAX_ACTIVE_ORDERS_PER_STORE`, default: 500).
2. WHEN the active order count for a MerchantStore reaches the configured limit, THE OrderService SHALL reject new order creation with HTTP 429 `"Too many active orders"`.

---

### Requirement 13: Database Indexes

**User Story:** As a system operator, I want the database to have appropriate indexes so that queue queries and status updates remain fast as order volume grows.

#### Acceptance Criteria

1. THE database SHALL have an index on `orders(merchantStoreId, createdAt)` to support efficient daily queue queries.
2. THE database SHALL have an index on `orders(merchantStoreId, status)` to support efficient active order filtering.
3. THE database SHALL have an index on `orders(sessionToken)` to support fast session-based lookups.
4. THE database SHALL have an index on `orders(userId)` to support fast user order history queries.
5. THE database SHALL have a unique index on `order_counters(merchantStoreId, date)` to support the atomic counter upsert.

---

### Requirement 14: Vendor Next Order Convenience Endpoint

**User Story:** As a vendor, I want a quick way to retrieve the next order to prepare so that I can process orders efficiently without scanning the full list.

#### Acceptance Criteria

1. THE System SHALL expose a REST endpoint `GET /orders/:storeId/next` that returns the oldest Order with status `PREPARING` for the specified MerchantStore, ordered by `orderNumber` ascending.
2. IF no orders with status `PREPARING` exist for the store, THE System SHALL return HTTP 204 (No Content).
3. IF the requesting vendor does not have access to the specified `merchantStoreId`, THE System SHALL return HTTP 403 `"Access denied"`.

---

## Notes

- Redis may be used for SSE connection tracking, WebOrderSession caching, or Pub/Sub to broadcast status updates efficiently across multiple Node.js instances.
- SSE heartbeat intervals are configurable (default: 15 seconds).
- Timezones for order counters and `orderDate` are merchant-local, not UTC.
- The WebOrderSession flow should be represented in a sequence diagram in the design document for clarity.
- REST endpoints and GraphQL queries/mutations are explicitly distinguished throughout this document.

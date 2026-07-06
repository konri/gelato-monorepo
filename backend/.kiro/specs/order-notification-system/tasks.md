# Implementation Plan: Order Notification System

## Overview

Implement the Order Notification System as a self-contained module under `src/Order/`, following the existing Resolver → Service → Repository pattern. Each task builds on the previous one; no task depends on code not yet written.

## Tasks

- [x] 1. Database schema — Prisma models, enums, migration

  - [x] 1.1 Add `OrderStatus` enum and extend `NotificationType` with `ORDER_READY` in `prisma/schema.prisma`
    - Add `enum OrderStatus { PREPARING READY PICKED_UP }` before the `Order` model block
    - Append `ORDER_READY` to the existing `NotificationType` enum
    - _Requirements: 8.3, 9.4_
  - [x] 1.2 Add `Order`, `OrderCounter`, and `WebOrderSession` models to `prisma/schema.prisma`
    - `Order`: fields `id`, `merchantStoreId`, `orderNumber`, `status`, `userId?`, `sessionToken?`, `orderDate`, `createdAt`, `updatedAt`; indexes on `(merchantStoreId, createdAt)`, `(merchantStoreId, status)`, `sessionToken`, `userId`
    - `OrderCounter`: fields `id`, `merchantStoreId`, `date` (`@db.Date`), `lastNumber`, `updatedAt`; `@@unique([merchantStoreId, date])`
    - `WebOrderSession`: fields `id`, `sessionToken` (`@unique`), `merchantStoreId`, `createdAt`, `expiresAt`; indexes on `sessionToken`, `expiresAt`
    - Add `orders Order[]`, `orderCounters OrderCounter[]`, `webOrderSessions WebOrderSession[]` relations to `MerchantStore`
    - _Requirements: 8.3, 13.1–13.5_
  - [x] 1.3 Generate and apply Prisma migration
    - Run `prisma migrate dev --name add_order_notification_system` to create the migration SQL
    - Run `prisma generate` to regenerate the Prisma client
    - _Requirements: 1.2, 13.1–13.5_

- [x] 2. Core data layer — `src/Order/repository/OrderRepository.ts`

  - [x] 2.1 Implement `OrderRepository` class with all data-access methods
    - `generateOrderNumber(merchantStoreId, orderDate)`: executes the atomic raw SQL upsert (`INSERT INTO "OrderCounter" ... ON CONFLICT ... DO UPDATE SET "lastNumber" = "lastNumber" + 1 RETURNING "lastNumber"`) via `prisma.$queryRaw`; returns the new `lastNumber`
    - `createOrder(data)`: `prisma.order.create()`
    - `findOrderById(id)`: `prisma.order.findUnique()`
    - `updateOrderStatus(id, status)`: `prisma.order.update()`
    - `findActiveOrders(merchantStoreId, today)`: finds orders with status `PREPARING` or `READY` for today, ordered by `orderNumber` asc
    - `findNextOrder(merchantStoreId)`: finds the single oldest `PREPARING` order by `orderNumber` asc
    - `countActiveOrders(merchantStoreId)`: counts orders with status `PREPARING` or `READY`
    - `createWebOrderSession(data)`: `prisma.webOrderSession.create()`
    - `findWebOrderSession(sessionToken)`: `prisma.webOrderSession.findUnique()`
    - `findOrderBySessionToken(sessionToken)`: `prisma.order.findFirst()`
    - _Requirements: 1.2, 3.3, 8.3_
  - [ ]\* 2.2 Write unit tests for `OrderRepository` in `src/Order/__tests__/OrderRepository.test.ts`
    - Test atomic upsert returns sequential numbers for the same `(storeId, date)` pair
    - Test that a new date starts the counter at 1
    - Test `findActiveOrders` excludes `PICKED_UP` orders and orders from other dates
    - _Requirements: 1.1, 1.4_

- [x] 3. Business logic — `src/Order/service/OrderService.ts`

  - [x] 3.1 Implement `OrderService` with timezone-aware `createOrder` (Mode 1 — UserQR)
    - Import `dayjs` with `utc` and `timezone` plugins; compute `orderDate` as `dayjs().tz(merchantTimezone).startOf('day').toDate()`
    - Verify vendor access via `MerchantAccessService`
    - Verify `userQrToken` JWT (signed with `BE_JWT`, max age 10 min); map `JsonWebTokenError` → `ErrorWithStatus(401, 'QR code expired')`; missing user → `ErrorWithStatus(404, 'User not found')`
    - Enforce active order limit: count active orders; if `>= MAX_ACTIVE_ORDERS_PER_STORE` throw `ErrorWithStatus(429, 'Too many active orders')`
    - Call `OrderRepository.generateOrderNumber()`, then `OrderRepository.createOrder()` with `userId` set and `sessionToken` null
    - Return `{ orderId, orderNumber }`
    - _Requirements: 2.1, 2.3, 2.4, 12.1_
  - [x] 3.2 Implement `createOrder` (Mode 2 — Session) in `OrderService`
    - Look up `WebOrderSession` by `sessionToken`; throw `ErrorWithStatus(404, 'Session not found')` if missing
    - If `session.expiresAt < now()` throw `ErrorWithStatus(410, 'Session expired')`
    - Verify vendor access to `merchantStoreId`
    - Enforce active order limit
    - Call `generateOrderNumber()` and `createOrder()` with `sessionToken` set and `userId` null
    - Return `{ orderId, orderNumber }`
    - _Requirements: 3.5, 3a.2, 12.1_
  - [x] 3.3 Implement `markOrderReady` in `OrderService`
    - Find order by `id`; throw `ErrorWithStatus(404, 'Order not found')` if missing
    - If `status === READY` throw `ErrorWithStatus(409, 'Order is already ready')`
    - Verify vendor access to `order.merchantStoreId`; throw `ErrorWithStatus(403, 'Access denied')` if denied
    - Update status to `READY` via `OrderRepository.updateOrderStatus()`
    - If `order.userId` is set: call `NotificationService.sendPushNotification()` with `type: 'ORDER_READY'`, `category: 'GENERAL'`, `title: 'Your order is ready'`, `message: 'Order #<orderNumber> is ready for pickup'`
    - Publish SSE events via `SsePublisher` (session channel if `sessionToken` set; always publish to queue channel)
    - Enqueue BullMQ delayed job `archive-order` with `ORDER_ARCHIVE_DELAY_MS` delay
    - Return updated `Order`
    - _Requirements: 6.1–6.7, 9.1_
  - [x] 3.4 Implement `buildQueuePayload` and `createWebOrderSession` helpers in `OrderService`
    - `buildQueuePayload(storeId)`: queries today's `PREPARING` and `READY` orders; returns `{ preparing: number[], ready: number[], lastReadyOrderNumber?: number }`
    - `createWebOrderSession(storeId)`: verifies store exists (throw `ErrorWithStatus(404, 'Store not found')` if not); creates `WebOrderSession` with `expiresAt = now + SESSION_TTL_MS`; enqueues `cleanup-session` BullMQ job; returns `{ sessionToken, expiresAt }`
    - `getVenueQRCodeUrl(merchantStoreId)`: returns `${ORDER_BASE_URL}/order/${merchantStoreId}`
    - `generateUserQRToken(userId)`: signs `{ userId }` with `BE_JWT`, `expiresIn: '10m'`; returns `{ token, expiresAt }`
    - _Requirements: 3.1–3.4, 5.1, 10.1, 11.1, 11.2_
  - [ ]\* 3.5 Write unit tests for `OrderService` in `src/Order/__tests__/OrderService.test.ts`
    - Test `createOrder` (UserQR): expired token → 401, user not found → 404, access denied → 403, limit reached → 429, success path
    - Test `createOrder` (Session): session not found → 404, expired session → 410, success path
    - Test `markOrderReady`: order not found → 404, already READY → 409, access denied → 403, success path with push notification call, success path without userId (no push)
    - Test `buildQueuePayload` excludes `PICKED_UP` and yesterday's orders
    - _Requirements: 2.1–2.4, 3.5, 3a.2, 6.1–6.7, 9.1_

- [x] 4. Real-time layer — SSE Registry and Redis Pub/Sub

  - [x] 4.1 Implement `SseRegistry` in `src/Order/sse/SseRegistry.ts`
    - Maintain two `Map<string, Set<Response>>`: `sessionConnections` and `queueConnections`
    - `addSessionConnection(sessionToken, res)` / `removeSessionConnection(sessionToken, res)`
    - `addQueueConnection(storeId, res)` / `removeQueueConnection(storeId, res)`
    - `broadcastToSession(sessionToken, data)`: writes `event: status\ndata: <data>\n\n` to all connections for that token
    - `broadcastToQueue(storeId, data)`: writes `event: queue\ndata: <data>\n\n` to all connections for that store
    - `closeSessionConnections(sessionToken)`: writes `event: expired\ndata: {}\n\n` and calls `res.end()` for each connection, then removes the set
    - _Requirements: 4.1–4.4, 5.2–5.4, 3a.3_
  - [x] 4.2 Implement `SsePublisher` in `src/Order/sse/SsePublisher.ts`
    - Create two dedicated `IORedis` instances from `src/Config/redis.ts` config: `redisPublisher` and `redisSubscriber` (separate connections to avoid blocking)
    - `publish(channel, payload)`: calls `redisPublisher.publish(channel, JSON.stringify(payload))`
    - On module init: call `redisSubscriber.psubscribe('order:session:*', 'order:queue:*')`
    - On `pmessage`: parse channel; if `order:session:<token>` call `SseRegistry.broadcastToSession(token, message)`; if `order:queue:<storeId>` call `SseRegistry.broadcastToQueue(storeId, message)`
    - Export `publishSessionEvent(sessionToken, payload)` and `publishQueueEvent(storeId, payload)` convenience wrappers
    - _Requirements: 4.2, 5.3, 6.3, 6.4_

- [x] 5. BullMQ jobs — `src/Order/jobs/orderJobs.ts`

  - [x] 5.1 Define `orderArchiveQueue` and its worker in `src/Order/jobs/orderJobs.ts`
    - Create `Queue('order-archive', { connection: redis })` and `Worker` that processes `archive-order` jobs
    - Worker: find order by `orderId`; if `status === READY` update to `PICKED_UP` (idempotent — skip if already `PICKED_UP`)
    - _Requirements: 8.4_
  - [x] 5.2 Define `sessionCleanupQueue` and its worker in the same file
    - Create `Queue('session-cleanup', { connection: redis })` and `Worker` that processes `cleanup-session` jobs
    - Worker: find session by `sessionToken`; delete or mark expired; call `SseRegistry.closeSessionConnections(sessionToken)`
    - _Requirements: 3a.1, 3a.3, 3a.4_

- [x] 6. TypeGraphQL object types and input types

  - [x] 6.1 Create `src/Order/objectType/Order.ts`
    - `@ObjectType() Order` with fields: `id` (ID), `orderNumber` (Int), `status` (string/enum), `userId` (nullable String), `sessionToken` (nullable String), `merchantStoreId` (String), `orderDate` (Date), `createdAt` (Date), `updatedAt` (Date)
    - _Requirements: 8.3_
  - [x] 6.2 Create `src/Order/objectType/OrderQueue.ts`
    - `@ObjectType() OrderQueueResponse` with fields: `preparing` ([Int]), `ready` ([Int]), `lastReadyOrderNumber` (nullable Int)
    - _Requirements: 5.1_
  - [x] 6.3 Create `src/Order/objectType/CreateOrderResult.ts`, `VenueQRCodeResult.ts`, `UserQRCodeResult.ts`
    - `CreateOrderResult`: `orderNumber` (Int), `orderId` (ID)
    - `VenueQRCodeResult`: `url` (String), `storeId` (String)
    - `UserQRCodeResult`: `token` (String), `expiresAt` (Date)
    - _Requirements: 2.1, 10.1, 11.1_
  - [x] 6.4 Create input types: `src/Order/inputType/CreateOrderByUserQRInput.ts`, `CreateOrderBySessionInput.ts`, `MarkOrderReadyInput.ts`
    - `CreateOrderByUserQRInput`: `userQrToken` (String), `merchantStoreId` (String)
    - `CreateOrderBySessionInput`: `sessionToken` (String), `merchantStoreId` (String)
    - `MarkOrderReadyInput`: `orderId` (ID)
    - _Requirements: 2.1, 3.5, 6.1_

- [x] 7. GraphQL resolver — `src/Order/resolver/OrderResolver.ts`

  - [x] 7.1 Implement `OrderResolver` with all mutations and queries
    - `@Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN]) @Mutation(() => CreateOrderResult) createOrderByUserQR(input, ctx)`: delegates to `OrderService.createOrder()` (UserQR mode)
    - `@Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN]) @Mutation(() => CreateOrderResult) createOrderBySession(input, ctx)`: delegates to `OrderService.createOrder()` (Session mode)
    - `@Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN]) @Mutation(() => Order) markOrderReady(input, ctx)`: delegates to `OrderService.markOrderReady()`
    - `@Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN]) @Query(() => [Order]) activeOrders(merchantStoreId, ctx)`: verifies access, calls `OrderRepository.findActiveOrders()`
    - `@Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN]) @Query(() => VenueQRCodeResult) venueQRCode(merchantStoreId, ctx)`: verifies access, calls `OrderService.getVenueQRCodeUrl()`
    - `@Authorized([Role.CLIENT]) @Query(() => UserQRCodeResult) myOrderQRCode(ctx)`: calls `OrderService.generateUserQRToken(ctx.req.user!.id)`
    - _Requirements: 2.1, 3.5, 6.1, 7.1–7.3, 10.1–10.2, 11.1–11.3_
  - [ ]\* 7.2 Write unit tests for `OrderResolver` in `src/Order/__tests__/OrderResolver.test.ts`
    - Test each mutation/query delegates correctly to `OrderService`/`OrderRepository`
    - Test authorization: unauthenticated → error, wrong role → error
    - Test `venueQRCode` access denied → 403
    - _Requirements: 7.2, 7.3, 10.2_

- [x] 8. REST routes — `src/Order/routes/orderRoutes.ts`

  - [x] 8.1 Implement `POST /orders/venue/:storeId/session`
    - Call `OrderService.createWebOrderSession(storeId)`; return `{ sessionToken, expiresAt }`
    - On `ErrorWithStatus(404)` return `404 { error: 'Store not found' }`
    - _Requirements: 3.2, 3.6_
  - [x] 8.2 Implement `GET /orders/session/:sessionToken` (polling endpoint)
    - Look up session and linked order; return `{ status, orderNumber }` or `{ status: 'PENDING' }` if no order yet
    - On missing/expired session return 404
    - _Requirements: 4.5_
  - [x] 8.3 Implement `GET /orders/session/:sessionToken/status-stream` (SSE)
    - Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
    - Verify session exists and is not expired; on failure close with 404
    - Register `res` in `SseRegistry.addSessionConnection(sessionToken, res)`
    - Start heartbeat `setInterval` writing `: heartbeat\n\n` every `SSE_HEARTBEAT_MS` ms
    - On `req.on('close')`: clear interval, call `SseRegistry.removeSessionConnection(sessionToken, res)`
    - _Requirements: 4.1–4.4_
  - [x] 8.4 Implement `GET /orders/queue/:storeId` (snapshot) and `GET /orders/queue/:storeId/stream` (SSE)
    - Snapshot: verify store exists; call `OrderService.buildQueuePayload(storeId)`; return JSON
    - SSE stream: set SSE headers; verify store; register in `SseRegistry.addQueueConnection(storeId, res)`; send initial snapshot immediately; start heartbeat; clean up on close
    - On missing store return 404
    - _Requirements: 5.1–5.6_
  - [x] 8.5 Implement `GET /orders/:storeId/next` (vendor convenience endpoint)
    - Apply `AuthGuard([Role.OWNER, Role.COOPERATOR, Role.ADMIN])` middleware
    - Verify vendor access to `storeId` via `MerchantAccessService`; on failure return 403
    - Call `OrderRepository.findNextOrder(storeId)`; if null return 204; else return order JSON
    - _Requirements: 14.1–14.3_
  - [ ]\* 8.6 Write unit tests for REST routes in `src/Order/__tests__/orderRoutes.test.ts`
    - Test session creation returns `sessionToken` and `expiresAt`
    - Test SSE response headers (`Content-Type: text/event-stream`)
    - Test queue snapshot response shape `{ preparing, ready, lastReadyOrderNumber }`
    - Test `/next` returns 204 when no PREPARING orders
    - Test `/next` returns 403 for unauthorized vendor
    - _Requirements: 3.2, 4.1, 5.1, 14.1–14.3_

- [x] 9. Integration into `src/index.ts`

  - [x] 9.1 Import `OrderResolver` and add it to the `resolvers` array in `tq.buildSchema()`
    - Add `import { OrderResolver } from './Order/resolver/OrderResolver'`
    - Add `OrderResolver` to the resolvers array alongside existing resolvers
    - _Requirements: 2.1, 6.1, 7.1_
  - [x] 9.2 Import `orderRoutes` and mount at `/orders` before `server.applyMiddleware()`
    - Add `import orderRoutes from './Order/routes/orderRoutes'`
    - Add `app.use('/orders', orderRoutes)` after the `/upload` route registration
    - Import `orderJobs` to start BullMQ workers: `import './Order/jobs/orderJobs'`
    - _Requirements: 3.2, 4.1, 5.1, 8.1_

- [x] 10. Checkpoint — verify integration compiles and existing tests pass

  - Run `tsc --noEmit` to confirm no TypeScript errors across the codebase
  - Ensure all existing tests still pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Property-based tests

  - [ ] 11.1 Write property tests for `OrderService` in `src/Order/__tests__/OrderService.property.test.ts`
    - Install `fast-check` as a dev dependency: `npm install --save-dev fast-check`
    - **Property 1: Sequential order numbers per store per day** — for N orders on the same day, numbers are exactly {1..N} with no gaps or duplicates. _Validates: Requirements 1.1, 1.4, 1.5_
    - **Property 2: Concurrent order number uniqueness** — N concurrent `generateOrderNumber` calls for the same store/date produce N distinct numbers. _Validates: Requirements 1.2_
    - **Property 3: orderDate timezone correctness** — `orderDate` equals the calendar date in the merchant's local timezone, not UTC. _Validates: Requirements 1.6_
    - **Property 4: Order creation round-trip (UserQR mode)** — valid token + accessible store → `Order` with status `PREPARING`, positive `orderNumber`, correct `userId`, null `sessionToken`. _Validates: Requirements 2.1, 2.2, 8.3_
    - **Property 6: Session-linked order creation round-trip** — valid non-expired session → `Order` with correct `sessionToken`, positive `orderNumber`, status `PREPARING`, null `userId`. _Validates: Requirements 3.5_
    - **Property 7: Expired session rejects order creation** — `expiresAt` in the past → HTTP 410 `"Session expired"`. _Validates: Requirements 3a.2_
    - **Property 8: markOrderReady transitions status** — `PREPARING` → `READY` on success; already `READY` → HTTP 409. _Validates: Requirements 6.1, 6.6_
    - **Property 9: markOrderReady triggers push notification for user-linked orders** — non-null `userId` order transitions to `READY` → `NotificationService.sendPushNotification` called with `type: 'ORDER_READY'` and message containing order number. _Validates: Requirements 6.2, 9.1_
    - **Property 15: Active order limit enforced** — when active count equals `MAX_ACTIVE_ORDERS_PER_STORE`, new order creation returns HTTP 429. _Validates: Requirements 12.1_
  - [ ] 11.2 Write property tests for REST routes in `src/Order/__tests__/OrderRoutes.property.test.ts`
    - **Property 5: Session creation does not create an order** — `POST /orders/venue/:storeId/session` creates exactly one `WebOrderSession` and zero `Order` records. _Validates: Requirements 3.1, 3.3, 3.4_
    - **Property 11: Queue response partitions by status and filters to today** — mix of `PREPARING`, `READY`, `PICKED_UP` across dates → only today's `PREPARING` in `preparing`, today's `READY` in `ready`, no `PICKED_UP` in either. _Validates: Requirements 5.1, 5.6, 8.2_
    - **Property 16: Next endpoint returns lowest orderNumber PREPARING order** — at least one `PREPARING` order → returns the one with the lowest `orderNumber`; no `PREPARING` orders → HTTP 204. _Validates: Requirements 14.1, 14.2_
    - **Property 18: Session polling endpoint reflects current status** — before order linked → `{ status: 'PENDING' }`; after order linked → correct `status` and `orderNumber`. _Validates: Requirements 4.5_
  - [ ] 11.3 Write property tests for SSE in `src/Order/__tests__/SsePublisher.property.test.ts`
    - **Property 10: markOrderReady broadcasts SSE to all subscribers** — order transitions to `READY` → SSE broadcast fires on session channel (if `sessionToken` set) and store queue channel with correct payloads. _Validates: Requirements 4.2, 5.3, 6.3, 6.4_
  - [ ] 11.4 Write property tests for the resolver in `src/Order/__tests__/OrderResolver.property.test.ts`
    - **Property 12: activeOrders returns today's active orders sorted by orderNumber** — only `PREPARING`/`READY` orders from today, ordered ascending, no `PICKED_UP`. _Validates: Requirements 7.1_
    - **Property 13: venueQRCode URL format and idempotence** — URL matches `<BASE_URL>/order/<storeId>`; repeated calls return the same URL. _Validates: Requirements 10.1, 10.3_
    - **Property 14: myOrderQRCode token encodes userId** — decoded JWT contains `userId` and `exp` no more than 10 minutes in the future. _Validates: Requirements 11.1, 11.2_
    - **Property 17: Authorization checks return 403 for unauthorized vendors** — vendor without store access → HTTP 403 for all store-scoped operations. _Validates: Requirements 2.4, 6.7, 7.2, 7.3, 10.2, 14.3_

- [ ] 12. Final checkpoint — all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Documentation — `docs/ORDER_NOTIFICATION_SYSTEM.md`
  - [x] 13.1 Create `docs/ORDER_NOTIFICATION_SYSTEM.md`
    - Document all REST endpoints with request/response examples
    - Document all GraphQL mutations and queries with example payloads
    - Document the three customer-facing modes (App, Web, Queue Screen) with flow descriptions
    - Document required environment variables (`MAX_ACTIVE_ORDERS_PER_STORE`, `ORDER_ARCHIVE_DELAY_MS`, `SESSION_TTL_MS`, `SSE_HEARTBEAT_MS`, `ORDER_BASE_URL`)
    - _Requirements: all_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests require `fast-check` (`npm install --save-dev fast-check`)
- The atomic counter upsert in `OrderRepository` is the critical correctness guarantee for Requirement 1.2 — do not replace it with application-level locking
- SSE endpoints must use dedicated Redis connections (not the shared BullMQ connection) to avoid blocking
- All errors follow the existing `ErrorWithStatus` pattern handled by the Express error middleware in `src/index.ts`

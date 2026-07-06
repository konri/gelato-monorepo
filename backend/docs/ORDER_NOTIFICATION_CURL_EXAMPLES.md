# Order Notification System - cURL Examples

Token is inherited from the parent Postman collection. Replace `{{store_id}}`, `{{order_id}}`, `{{session_token}}`, `{{user_id}}` with real values.

---

## Mode 1 — App User (Push Notification)

### Get My Order QR Token (CLIENT) - no params

Returns the customer's static `userId` as the QR token. No expiry — display it as a QR code permanently.

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query { myQRCode { token expiresAt } }"
}'
```

### Create Order by User QR (OWNER/COOPERATOR/ADMIN) - requires userId, merchantStoreId

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation CreateOrderByUserQR($input: CreateOrderByUserQRInput!) { createOrderByUserQR(input: $input) { orderId orderNumber } }",
  "variables": {
    "input": {
      "userId": "{{user_id}}",
      "merchantStoreId": "{{store_id}}"
    }
  }
}'
```

---

## Mode 2 — Web Browser Session (SSE)

### Create Web Session (no auth) - requires storeId in path

```bash
curl --location --request POST '{{base_url}}/orders/venue/{{store_id}}/session'
```

### Poll Session Status (no auth) - requires sessionToken in path

```bash
curl --location '{{base_url}}/orders/session/{{session_token}}'
```

### Open Session SSE Stream (no auth) - requires sessionToken in path

```bash
curl --location --no-buffer '{{base_url}}/orders/session/{{session_token}}/status-stream'
```

### Create Order by Session (OWNER/COOPERATOR/ADMIN) - requires sessionToken, merchantStoreId

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation CreateOrderBySession($input: CreateOrderBySessionInput!) { createOrderBySession(input: $input) { orderId orderNumber } }",
  "variables": {
    "input": {
      "sessionToken": "{{session_token}}",
      "merchantStoreId": "{{store_id}}"
    }
  }
}'
```

---

## Mark Order Ready (OWNER/COOPERATOR/ADMIN) - requires orderId

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation MarkOrderReady($input: MarkOrderReadyInput!) { markOrderReady(input: $input) { id orderNumber status } }",
  "variables": {
    "input": {
      "orderId": "{{order_id}}"
    }
  }
}'
```

---

## Mode 3 — Queue Screen (SSE)

### Get Queue Snapshot (no auth) - requires storeId in path

```bash
curl --location '{{base_url}}/orders/queue/{{store_id}}'
```

### Open Queue SSE Stream (no auth) - requires storeId in path

```bash
curl --location --no-buffer '{{base_url}}/orders/queue/{{store_id}}/stream'
```

---

## Vendor Queries

### Active Orders (OWNER/COOPERATOR/ADMIN) - requires merchantStoreId

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query ActiveOrders($merchantStoreId: ID!) { activeOrders(merchantStoreId: $merchantStoreId) { id orderNumber status createdAt } }",
  "variables": {
    "merchantStoreId": "{{store_id}}"
  }
}'
```

### Venue QR Code URL (OWNER/COOPERATOR/ADMIN) - requires merchantStoreId

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query VenueQRCode($merchantStoreId: ID!) { venueQRCode(merchantStoreId: $merchantStoreId) { url storeId } }",
  "variables": {
    "merchantStoreId": "{{store_id}}"
  }
}'
```

### Next PREPARING Order (OWNER/COOPERATOR/ADMIN) - requires storeId in path

```bash
curl --location '{{base_url}}/orders/{{store_id}}/next'
```

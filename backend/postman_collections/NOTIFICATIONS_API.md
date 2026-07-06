# Notification System - Postman/cURL Examples

## Register Device (CLIENT/OWNER/COOPERATOR) - requires fcmToken, platform, deviceId

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation RegisterDevice($fcmToken: String!, $platform: String!, $deviceId: String!, $deviceName: String) { registerDevice(fcmToken: $fcmToken, platform: $platform, deviceId: $deviceId, deviceName: $deviceName) }",
  "variables": {
    "fcmToken": "fcm-token-from-mobile-app",
    "platform": "ios",
    "deviceId": "device-unique-id",
    "deviceName": "iPhone 14 Pro"
  }
}'
```

## Get My Notifications - All (CLIENT/OWNER/COOPERATOR) - no params

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query MyNotifications { myNotifications { id category type title message imageUrl metadata isRead readAt createdAt } }"
}'
```

## Get My Notifications - GENERAL Only (CLIENT/OWNER/COOPERATOR) - category filter

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query MyNotifications($category: NotificationCategory) { myNotifications(category: $category) { id category type title message isRead createdAt } }",
  "variables": {
    "category": "GENERAL"
  }
}'
```

## Get My Notifications - PROMOTIONS Only (CLIENT/OWNER/COOPERATOR) - category filter

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query MyNotifications($category: NotificationCategory) { myNotifications(category: $category) { id category type title message isRead createdAt } }",
  "variables": {
    "category": "PROMOTIONS"
  }
}'
```

## Get Unread Count - All Categories (CLIENT/OWNER/COOPERATOR) - no params

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query UnreadCount { unreadNotificationsCount }"
}'
```

## Get Unread Count - By Category (CLIENT/OWNER/COOPERATOR) - no params

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "query UnreadByCategory { unreadNotificationsByCategory { category count } }"
}'
```

## Mark Notification as Read (CLIENT/OWNER/COOPERATOR) - requires notificationId

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation MarkAsRead($notificationId: String!) { markNotificationAsRead(notificationId: $notificationId) }",
  "variables": {
    "notificationId": "notification-uuid"
  }
}'
```

## Mark All as Read - All Categories (CLIENT/OWNER/COOPERATOR) - no params

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation MarkAllAsRead { markAllNotificationsAsRead }"
}'
```

## Mark All as Read - GENERAL Only (CLIENT/OWNER/COOPERATOR) - category filter

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation MarkAllAsRead($category: NotificationCategory) { markAllNotificationsAsRead(category: $category) }",
  "variables": {
    "category": "GENERAL"
  }
}'
```

## Mark All as Read - PROMOTIONS Only (CLIENT/OWNER/COOPERATOR) - category filter

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation MarkAllAsRead($category: NotificationCategory) { markAllNotificationsAsRead(category: $category) }",
  "variables": {
    "category": "PROMOTIONS"
  }
}'
```

## Delete Notification (CLIENT/OWNER/COOPERATOR) - requires notificationId

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation DeleteNotification($notificationId: String!) { deleteNotification(notificationId: $notificationId) }",
  "variables": {
    "notificationId": "notification-uuid"
  }
}'
```

## Unregister Device (CLIENT/OWNER/COOPERATOR) - requires deviceId

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
  "query": "mutation UnregisterDevice($deviceId: String!) { unregisterDevice(deviceId: $deviceId) }",
  "variables": {
    "deviceId": "device-unique-id"
  }
}'
```

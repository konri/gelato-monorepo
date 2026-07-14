# Push Notifications - Frontend Implementation Guide

## Overview

Backend jest **w pełni gotowy** do wysyłania push notifications przez Firebase Cloud Messaging (FCM). Wszystkie kluczowe akcje użytkownika automatycznie wysyłają powiadomienia.

## Co już działa na backendzie?

### ✅ Automatyczne powiadomienia dla:

1. **Pieczątki (Stamps)**

   - Dodanie pieczątki: "🎉 Nowa pieczątka! Otrzymałeś pieczątkę w [Merchant]. Masz X/Y"
   - Ukończenie karty: "🎁 Karta ukończona! Gratulacje! Zrealizowałeś kartę w [Merchant]"

2. **Punkty (Points)**

   - Otrzymanie punktów: "💰 Otrzymano punkty! +X punktów w [Merchant]"

3. **Kupony (Coupons)**

   - Odebranie kuponu: "🎟️ Nowy kupon! [Tytuł] w [Merchant]. Ważny do [Data]"

4. **Zamówienia (Orders)**
   - Zamówienie gotowe: "✅ Zamówienie gotowe! Zamówienie #X w [Store] jest gotowe do odbioru"

### 📊 System zarządzania powiadomieniami:

- **Kategorie**: `GENERAL`, `PROMOTIONS`, `SECURITY`
- **Typy**: 20+ typów (STAMP_ADDED, POINTS_EARNED, COUPON_CLAIMED, etc.)
- **Queue system**: BullMQ + Redis dla wydajności
- **Automatic retry**: 3 próby z exponential backoff
- **Invalid token cleanup**: Automatyczne usuwanie nieaktywnych tokenów

## Frontend Implementation (Expo)

### 1. Instalacja pakietów

```bash
npx expo install expo-notifications expo-device expo-constants
```

### 2. Konfiguracja Firebase

#### a) Pobierz pliki konfiguracyjne z Firebase Console:

- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

#### b) Dodaj do `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.easybons.app"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.easybons.app"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### 3. Kod implementacji

#### `src/services/NotificationService.ts`

```typescript
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { gql } from '@apollo/client'
import { apolloClient } from './apolloClient'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

const REGISTER_DEVICE = gql`
  mutation RegisterDevice($fcmToken: String!, $platform: String!, $deviceId: String!, $deviceName: String) {
    registerDevice(fcmToken: $fcmToken, platform: $platform, deviceId: $deviceId, deviceName: $deviceName)
  }
`

const UNREGISTER_DEVICE = gql`
  mutation UnregisterDevice($deviceId: String!) {
    unregisterDevice(deviceId: $deviceId)
  }
`

export class NotificationService {
  static async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices')
      return null
    }

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission denied')
      return null
    }

    // Get FCM token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Z app.json
    })

    // Get device info
    const deviceId = Device.osInternalBuildId || Device.osBuildId || 'unknown'
    const deviceName = Device.deviceName || `${Device.brand} ${Device.modelName}`
    const platform = Platform.OS

    // Register with backend
    try {
      await apolloClient.mutate({
        mutation: REGISTER_DEVICE,
        variables: {
          fcmToken: token.data,
          platform,
          deviceId,
          deviceName,
        },
      })

      console.log('✅ Device registered for push notifications')
      return token.data
    } catch (error) {
      console.error('Failed to register device:', error)
      return null
    }
  }

  static async unregisterDevice() {
    const deviceId = Device.osInternalBuildId || Device.osBuildId || 'unknown'

    try {
      await apolloClient.mutate({
        mutation: UNREGISTER_DEVICE,
        variables: { deviceId },
      })
      console.log('✅ Device unregistered')
    } catch (error) {
      console.error('Failed to unregister device:', error)
    }
  }

  static setupNotificationListeners() {
    // Notification received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 Notification received:', notification)
      // Możesz tutaj pokazać custom UI
    })

    // User tapped on notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response)
      const data = response.notification.request.content.data

      // Navigate based on notification type
      this.handleNotificationNavigation(data)
    })

    return () => {
      foregroundSubscription.remove()
      responseSubscription.remove()
    }
  }

  static handleNotificationNavigation(data: any) {
    const { type, category, notificationId, ...metadata } = data

    switch (type) {
      case 'STAMP_ADDED':
      case 'STAMP_CARD_COMPLETED':
        // Navigate to stamp cards screen
        // navigation.navigate('StampCards')
        break

      case 'POINTS_EARNED':
        // Navigate to points screen
        // navigation.navigate('Points')
        break

      case 'COUPON_AVAILABLE':
      case 'COUPON_CLAIMED':
        // Navigate to coupons screen
        // navigation.navigate('Coupons')
        break

      case 'ORDER_READY':
        // Navigate to orders screen
        // navigation.navigate('Orders')
        break

      default:
      // Navigate to notifications screen
      // navigation.navigate('Notifications')
    }
  }
}
```

#### `App.tsx` - Inicjalizacja

```typescript
import { useEffect } from 'react'
import { NotificationService } from './services/NotificationService'

export default function App() {
  useEffect(() => {
    // Register for push notifications
    NotificationService.registerForPushNotifications()

    // Setup listeners
    const cleanup = NotificationService.setupNotificationListeners()

    return cleanup
  }, [])

  return <YourAppContent />
}
```

### 4. GraphQL Queries (opcjonalne - do wyświetlania historii)

```graphql
# Pobierz powiadomienia użytkownika
query MyNotifications($category: NotificationCategory) {
  myNotifications(category: $category) {
    id
    category
    type
    title
    message
    imageUrl
    isRead
    createdAt
  }
}

# Liczba nieprzeczytanych
query UnreadNotificationsCount($category: NotificationCategory) {
  unreadNotificationsCount(category: $category)
}

# Oznacz jako przeczytane
mutation MarkNotificationAsRead($notificationId: String!) {
  markNotificationAsRead(notificationId: $notificationId)
}

# Oznacz wszystkie jako przeczytane
mutation MarkAllNotificationsAsRead($category: NotificationCategory) {
  markAllNotificationsAsRead(category: $category)
}
```

### 5. Notification Channels (Android)

```typescript
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('general', {
      name: 'Ogólne',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promocje',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFA500',
    })
  }
}
```

## Testowanie

### 1. Expo Go (Development)

```bash
# Uruchom aplikację
npx expo start

# Skanuj QR code na fizycznym urządzeniu
# Push notifications NIE DZIAŁAJĄ w emulatorze!
```

### 2. Development Build (Recommended)

```bash
# Build dla iOS
eas build --profile development --platform ios

# Build dla Android
eas build --profile development --platform android

# Zainstaluj na urządzeniu i testuj
```

### 3. Testowanie z backendu

Backend automatycznie wysyła powiadomienia przy akcjach użytkownika. Możesz też przetestować ręcznie:

```graphql
# Admin może wysłać testowe powiadomienie (jeśli potrzebne)
mutation SendTestNotification {
  sendNotifications(data: { usersId: ["user-id"], title: "Test", text: "Test notification" })
}
```

## Notification Types Reference

```typescript
enum NotificationType {
  // GENERAL - User activities & rewards
  STAMP_ADDED = 'STAMP_ADDED',
  STAMP_CARD_COMPLETED = 'STAMP_CARD_COMPLETED',
  STAMP_MILESTONE_REACHED = 'STAMP_MILESTONE_REACHED',
  POINTS_EARNED = 'POINTS_EARNED',
  POINTS_SPENT = 'POINTS_SPENT',
  COUPON_CLAIMED = 'COUPON_CLAIMED',
  VOUCHER_PURCHASED = 'VOUCHER_PURCHASED',
  REFERRAL_COMPLETED = 'REFERRAL_COMPLETED',
  REWARD_UNLOCKED = 'REWARD_UNLOCKED',

  // PROMOTIONS - Marketing & offers
  COUPON_AVAILABLE = 'COUPON_AVAILABLE',
  COUPON_EXPIRING = 'COUPON_EXPIRING',
  VOUCHER_EXPIRING = 'VOUCHER_EXPIRING',
  MERCHANT_PROMOTION = 'MERCHANT_PROMOTION',
  SPECIAL_OFFER = 'SPECIAL_OFFER',
  NEW_REWARD_AVAILABLE = 'NEW_REWARD_AVAILABLE',

  // SYSTEM - App updates & reminders
  ORDER_READY = 'ORDER_READY',
  APP_UPDATE_AVAILABLE = 'APP_UPDATE_AVAILABLE',
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
}
```

## Troubleshooting

### Problem: "Push notifications not working"

**Rozwiązanie:**

1. Sprawdź czy używasz fizycznego urządzenia (nie emulator)
2. Sprawdź czy masz uprawnienia: `Settings > EasyBons > Notifications`
3. Sprawdź logi: `npx expo start` i zobacz console

### Problem: "Token registration failed"

**Rozwiązanie:**

1. Sprawdź czy `google-services.json` / `GoogleService-Info.plist` są w projekcie
2. Sprawdź czy `projectId` w `app.json` jest poprawny
3. Przebuduj aplikację: `eas build`

### Problem: "Notifications not showing on iOS"

**Rozwiązanie:**

1. Sprawdź czy masz Apple Developer Account
2. Sprawdź czy Push Notifications są włączone w Xcode Capabilities
3. Sprawdź czy masz Production APNs certificate w Firebase Console

## Next Steps

1. **Zaimplementuj UI dla historii powiadomień** - użyj `myNotifications` query
2. **Dodaj badge counter** - użyj `unreadNotificationsCount` query
3. **Dodaj deep linking** - rozszerz `handleNotificationNavigation()`
4. **Dodaj notification preferences** - pozwól użytkownikom wyłączyć kategorie

## Backend Endpoints (już działają!)

```graphql
# Rejestracja urządzenia
mutation RegisterDevice($fcmToken: String!, $platform: String!, $deviceId: String!, $deviceName: String) {
  registerDevice(fcmToken: $fcmToken, platform: $platform, deviceId: $deviceId, deviceName: $deviceName)
}

# Wyrejestrowanie urządzenia
mutation UnregisterDevice($deviceId: String!) {
  unregisterDevice(deviceId: $deviceId)
}

# Pobierz powiadomienia
query MyNotifications($category: NotificationCategory) {
  myNotifications(category: $category) {
    id
    category
    type
    title
    message
    imageUrl
    metadata
    isRead
    readAt
    createdAt
  }
}

# Liczba nieprzeczytanych
query UnreadNotificationsCount($category: NotificationCategory) {
  unreadNotificationsCount(category: $category)
}

# Liczba nieprzeczytanych per kategoria
query UnreadNotificationsByCategory {
  unreadNotificationsByCategory {
    category
    count
  }
}

# Oznacz jako przeczytane
mutation MarkNotificationAsRead($notificationId: String!) {
  markNotificationAsRead(notificationId: $notificationId)
}

# Oznacz wszystkie jako przeczytane
mutation MarkAllNotificationsAsRead($category: NotificationCategory) {
  markAllNotificationsAsRead(category: $category)
}

# Usuń powiadomienie
mutation DeleteNotification($notificationId: String!) {
  deleteNotification(notificationId: $notificationId)
}
```

## Summary

✅ **Backend gotowy** - wszystkie powiadomienia działają automatycznie
✅ **Firebase skonfigurowany** - FCM + BullMQ + Redis
✅ **Queue system** - wydajne wysyłanie z retry
✅ **Automatic cleanup** - nieaktywne tokeny są usuwane

🎯 **Frontend TODO:**

1. Zainstaluj `expo-notifications`
2. Dodaj Firebase config files
3. Zaimplementuj `NotificationService`
4. Zarejestruj urządzenie przy logowaniu
5. Dodaj UI dla historii powiadomień

**Czas implementacji: ~2-3 godziny** 🚀

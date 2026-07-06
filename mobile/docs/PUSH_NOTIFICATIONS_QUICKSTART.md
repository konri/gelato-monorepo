# Push Notifications - Quick Start

## Szybki Start dla Developerów

### 1. Instalacja (już zrobione ✅)
```bash
npm install expo-notifications expo-device
```

### 2. Konfiguracja Firebase

#### Android
1. Pobierz `google-services.json` z [Firebase Console](https://console.firebase.google.com)
2. Umieść w: `android/app/google-services.json`

#### iOS
1. Pobierz `GoogleService-Info.plist` z [Firebase Console](https://console.firebase.google.com)
2. Umieść w: `ios/GoogleService-Info.plist`

### 3. Build aplikacji
```bash
# iOS
npm run ios

# Android
npm run android
```

**WAŻNE:** Push notyfikacje **NIE DZIAŁAJĄ** w Expo Go! Wymagany jest native build.

## Jak to działa?

### Automatyczna rejestracja
Po zalogowaniu użytkownika, aplikacja automatycznie:
1. Requestuje uprawnienia do notyfikacji
2. Pobiera FCM token
3. Rejestruje urządzenie na backendzie

### Otrzymywanie notyfikacji
Backend automatycznie wysyła notyfikacje gdy:
- Użytkownik otrzyma pieczątkę
- Użytkownik otrzyma punkty
- Nowy kupon jest dostępny
- Kupon wygasa wkrótce
- Zamówienie jest gotowe
- Referral został zrealizowany

### Wyświetlanie notyfikacji
- Badge z liczbą nieprzeczytanych w Profile Header
- Pełna historia w `/notifications`
- Filtrowanie po kategoriach (All, General, Promotions, Security)

## Użycie w kodzie

### Hook do zarządzania notyfikacjami
```typescript
import { useNotifications } from '@/hooks/useNotifications';

const MyComponent = () => {
  const { 
    notifications,        // Lista notyfikacji
    unreadCount,         // Liczba nieprzeczytanych
    loading,             // Stan ładowania
    markNotificationAsRead,  // Oznacz jako przeczytane
    refetchNotifications,    // Odśwież listę
  } = useNotifications('PROMOTIONS'); // Opcjonalnie: kategoria

  return (
    <View>
      <Text>Nieprzeczytane: {unreadCount}</Text>
      {notifications.map(notif => (
        <NotificationItem 
          key={notif.id} 
          notification={notif}
          onPress={() => markNotificationAsRead(notif.id)}
        />
      ))}
    </View>
  );
};
```

### Komponent listy notyfikacji
```typescript
import { NotificationsList } from '@/components/molecules/NotificationsList';

<NotificationsList 
  category="PROMOTIONS"  // Opcjonalnie
  onNotificationPress={(notification) => {
    // Handle notification tap
    console.log('Tapped:', notification);
  }}
/>
```

## Testing

### 1. Sprawdź rejestrację
```typescript
// W konsoli powinno pojawić się:
// "Push notifications registered successfully"
```

### 2. Testuj na fizycznym urządzeniu
- iOS: Podłącz iPhone przez USB
- Android: Podłącz telefon przez USB lub użyj wireless debugging

### 3. Wywołaj akcję na backendzie
- Dodaj pieczątkę przez admin panel
- Sprawdź czy notyfikacja przyszła
- Sprawdź badge count w aplikacji

## Troubleshooting

### "Push notifications only work on physical devices"
✅ To normalne - użyj fizycznego urządzenia

### Token nie jest generowany
1. Sprawdź czy masz `google-services.json` (Android) lub `GoogleService-Info.plist` (iOS)
2. Zrób rebuild: `npm run ios` lub `npm run android`
3. Sprawdź czy użytkownik zaakceptował uprawnienia

### Notyfikacje nie przychodzą
1. Sprawdź logi backendu
2. Sprawdź czy token jest w bazie danych
3. Sprawdź czy Firebase credentials są poprawne na backendzie

## Pliki do sprawdzenia

### Główne pliki
- `services/notificationService.ts` - Service zarządzający notyfikacjami
- `hooks/useNotifications.ts` - Hook do użycia w komponentach
- `hooks/useNotificationInitialization.ts` - Inicjalizacja przy starcie
- `app/_layout.tsx` - Integracja z aplikacją

### GraphQL
- `shared/api-client/src/graphql/mutations/notifications/registerDevice.ts`
- `shared/api-client/src/graphql/queries/notifications/myNotifications.ts`

### UI Components
- `components/molecules/NotificationsList/index.tsx`
- `app/notifications/index.tsx`
- `components/molecules/Profile/ProfileHeader.tsx` (badge)

## Backend Endpoints

Wszystkie endpointy są już zaimplementowane na backendzie:

```graphql
# Rejestracja urządzenia (automatyczne)
mutation RegisterDevice($fcmToken: String!, $platform: String!, $deviceId: String!, $deviceName: String)

# Pobierz notyfikacje
query MyNotifications($category: NotificationCategory)

# Liczba nieprzeczytanych
query UnreadNotificationsCount($category: NotificationCategory)

# Oznacz jako przeczytane
mutation MarkNotificationAsRead($notificationId: String!)
```

## Gotowe! 🎉

Notyfikacje są w pełni zintegrowane i działają automatycznie. Backend wysyła powiadomienia, aplikacja je odbiera i wyświetla.

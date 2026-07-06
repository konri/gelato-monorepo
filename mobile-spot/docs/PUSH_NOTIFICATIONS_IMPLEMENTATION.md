# Push Notifications - Implementacja Frontend

## ✅ Co zostało zaimplementowane

### 1. Podstawowa infrastruktura
- ✅ `NotificationService` - Singleton zarządzający notyfikacjami
- ✅ `useNotificationRegistration` - Hook rejestrujący urządzenie
- ✅ `useNotificationInitialization` - Hook inicjalizujący przy starcie
- ✅ GraphQL mutations i queries
- ✅ Konfiguracja Firebase w `app.json`
- ✅ Tłumaczenia (PL/EN)

### 2. Pliki utworzone

#### Services
- `services/notificationService.ts` - Główny serwis notyfikacji

#### Hooks
- `hooks/useNotificationRegistration.ts` - Rejestracja urządzenia na backendzie
- `hooks/useNotificationInitialization.ts` - Inicjalizacja przy starcie aplikacji

#### GraphQL
- `shared/api-client/src/graphql/mutations/notifications/registerDevice.ts`
- `shared/api-client/src/graphql/queries/notifications/myNotifications.ts`

#### Dokumentacja
- `docs/PUSH_NOTIFICATIONS_SETUP.md` - Pełna dokumentacja
- `docs/PUSH_NOTIFICATIONS_QUICKSTART.md` - Quick start guide
- `docs/PUSH_NOTIFICATIONS_IMPLEMENTATION.md` - Ten plik

### 3. Integracja z aplikacją
- ✅ Automatyczna rejestracja przy starcie w `app/_layout.tsx`
- ✅ Ikona notyfikacji w Profile Header (przygotowana do rozbudowy)

## 🔧 Wymagane kroki do pełnego uruchomienia

### 1. Dodaj pliki Firebase

#### Android
Pobierz `google-services.json` z Firebase Console i umieść w:
```
android/app/google-services.json
```

#### iOS  
Pobierz `GoogleService-Info.plist` z Firebase Console i umieść w:
```
ios/GoogleService-Info.plist
```

### 2. Zbuduj aplikację natywnie
```bash
# iOS
npm run ios

# Android
npm run android
```

**WAŻNE:** Push notyfikacje NIE DZIAŁAJĄ w Expo Go!

### 3. Testowanie
1. Zaloguj się do aplikacji
2. Sprawdź logi: "Push notifications registered successfully"
3. Wykonaj akcję na backendzie (np. dodaj pieczątkę)
4. Sprawdź czy notyfikacja przyszła

## 📋 Co działa automatycznie

### Rejestracja urządzenia
Po zalogowaniu użytkownika, aplikacja automatycznie:
1. Requestuje uprawnienia do notyfikacji
2. Pobiera Expo Push Token
3. Wysyła token do backendu wraz z informacjami o urządzeniu

### Otrzymywanie notyfikacji
Backend automatycznie wysyła powiadomienia gdy:
- Użytkownik otrzyma pieczątkę (`STAMP_ADDED`)
- Użytkownik otrzyma punkty (`POINTS_EARNED`)
- Nowy kupon jest dostępny (`NEW_COUPON_AVAILABLE`)
- Kupon wygasa wkrótce (`COUPON_EXPIRING`)
- Zamówienie jest gotowe (`ORDER_READY`)
- Referral został zrealizowany (`REFERRAL_COMPLETED`)

## 🚀 Przyszłe rozszerzenia (opcjonalne)

### 1. UI dla historii notyfikacji
Można dodać ekran z pełną historią notyfikacji:
- Lista wszystkich notyfikacji
- Filtrowanie po kategoriach (General, Promotions, Security)
- Oznaczanie jako przeczytane
- Badge count w ikonie

### 2. Deep linking
Nawigacja do konkretnych ekranów po kliknięciu w notyfikację:
- Notyfikacja o pieczątce → ekran sklepu
- Notyfikacja o kuponie → ekran kuponu
- Notyfikacja o punktach → ekran nagród

### 3. Rich notifications
- Obrazki w notyfikacjach
- Action buttons (np. "Zobacz", "Odrzuć")
- Custom sounds

### 4. Preferencje użytkownika
- Włącz/wyłącz kategorie notyfikacji
- Quiet hours (godziny ciszy)
- Częstotliwość powiadomień

## 📝 Przykład użycia w kodzie

### Sprawdzenie czy notyfikacje są zarejestrowane
```typescript
import { useNotificationRegistration } from '@/hooks/useNotificationRegistration';

const MyComponent = () => {
  const { isRegistered } = useNotificationRegistration();
  
  return (
    <Text>
      Notyfikacje: {isRegistered ? 'Włączone' : 'Wyłączone'}
    </Text>
  );
};
```

### Bezpośrednie użycie NotificationService
```typescript
import NotificationService from '@/services/notificationService';

// Ustaw badge count
await NotificationService.setBadgeCount(5);

// Wyczyść badge
await NotificationService.clearBadge();

// Pobierz token
const token = await NotificationService.getFCMToken();

// Setup listenerów
const cleanup = NotificationService.setupNotificationListeners(
  (notification) => {
    console.log('Otrzymano:', notification);
  },
  (response) => {
    console.log('Kliknięto:', response);
  }
);

// Cleanup
cleanup();
```

## 🐛 Troubleshooting

### Token nie jest generowany
1. Sprawdź czy `expo-notifications` i `expo-device` są zainstalowane
2. Sprawdź czy EAS projectId jest w `app.json`
3. Zrób rebuild aplikacji
4. Sprawdź czy użytkownik zaakceptował uprawnienia

### Notyfikacje nie przychodzą
1. Sprawdź logi backendu (BullMQ queue)
2. Sprawdź czy token jest zapisany w bazie danych
3. Sprawdź czy Firebase credentials są poprawne na backendzie
4. Sprawdź czy urządzenie ma połączenie z internetem

### "Push notifications only work on physical devices"
To normalne - użyj fizycznego urządzenia do testowania.

## 📚 Dodatkowe zasoby

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Backend Documentation](../backend/docs/PUSH_NOTIFICATIONS_FRONTEND.md)

## ✨ Podsumowanie

Podstawowa infrastruktura push notyfikacji jest w pełni zaimplementowana i gotowa do użycia. Backend automatycznie wysyła powiadomienia, a aplikacja je odbiera. Dodatkowe funkcje (UI, deep linking, preferencje) mogą być dodane w przyszłości według potrzeb.

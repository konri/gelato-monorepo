# Push Notifications - Podsumowanie Implementacji

## ✅ Zaimplementowano

### 1. Podstawowa infrastruktura
- **NotificationService** (`services/notificationService.ts`)
  - Singleton zarządzający notyfikacjami
  - Requestowanie uprawnień
  - Pobieranie Expo Push Token
  - Setup listenerów notyfikacji
  - Zarządzanie badge count

- **useNotificationRegistration** (`hooks/useNotificationRegistration.ts`)
  - Automatyczna rejestracja urządzenia na backendzie
  - Wysyłanie FCM tokenu wraz z informacjami o urządzeniu
  - Wykonywane automatycznie przy starcie aplikacji (jeśli użytkownik zalogowany)

- **useNotifications** (`hooks/useNotifications.ts`)
  - Hook dla ekranu onboardingu notyfikacji
  - Obsługa przycisku "Pozwól" i "Później"

### 2. GraphQL Integration
- **Mutations:**
  - `registerDevice` - Rejestracja urządzenia z FCM tokenem

- **Queries:**
  - `myNotifications` - Pobieranie historii notyfikacji (przygotowane)
  - `unreadNotificationsCount` - Liczba nieprzeczytanych (przygotowane)
  - `markNotificationAsRead` - Oznaczanie jako przeczytane (przygotowane)

### 3. Konfiguracja
- **app.json** - Dodano konfigurację Firebase dla iOS i Android
- **.env** - Firebase credentials już skonfigurowane
- **Tłumaczenia** - Dodano klucze PL/EN dla notyfikacji

### 4. Integracja z aplikacją
- **app/_layout.tsx** - Automatyczna inicjalizacja przy starcie
- **app/(auth)/notifications/index.tsx** - Ekran onboardingu
- **components/molecules/Profile/ProfileHeader.tsx** - Ikona notyfikacji (przygotowana)

## 📦 Zainstalowane pakiety
- `expo-notifications` - Obsługa notyfikacji
- `expo-device` - Informacje o urządzeniu

## 🚀 Jak to działa

### 1. Przy starcie aplikacji
```
app/_layout.tsx
  ↓
useNotificationInitialization()
  ↓
useNotificationRegistration()
  ↓
NotificationService.getFCMToken()
  ↓
executeGraphQLQuery(REGISTER_DEVICE)
  ↓
Backend zapisuje token
```

### 2. Gdy backend wysyła notyfikację
```
Backend Action (np. dodanie pieczątki)
  ↓
PushNotificationHelper
  ↓
BullMQ Queue
  ↓
Firebase Cloud Messaging
  ↓
Expo Push Notification Service
  ↓
Urządzenie użytkownika
```

### 3. Gdy użytkownik otrzymuje notyfikację
```
Notyfikacja przychodzi
  ↓
NotificationService.setupNotificationListeners()
  ↓
onNotificationReceived() - app w foreground
lub
onNotificationTapped() - użytkownik kliknął
```

## 📋 Wymagane kroki do uruchomienia

### 1. Dodaj pliki Firebase

#### Android
```bash
# Pobierz z Firebase Console → Project Settings → Android app
# Umieść w:
android/app/google-services.json
```

#### iOS
```bash
# Pobierz z Firebase Console → Project Settings → iOS app
# Umieść w:
ios/GoogleService-Info.plist
```

### 2. Zbuduj aplikację natywnie
```bash
# iOS
npm run ios

# Android
npm run android
```

**WAŻNE:** Push notyfikacje **NIE DZIAŁAJĄ** w Expo Go!

### 3. Testowanie
1. Zaloguj się do aplikacji
2. Sprawdź logi konsoli: `"Push notifications registered successfully"`
3. Sprawdź w bazie danych czy token został zapisany
4. Wykonaj akcję na backendzie (np. dodaj pieczątkę przez admin panel)
5. Sprawdź czy notyfikacja przyszła na urządzenie

## 📁 Struktura plików

```
mobile/
├── services/
│   └── notificationService.ts          # Główny serwis
├── hooks/
│   ├── useNotificationRegistration.ts  # Rejestracja urządzenia
│   ├── useNotificationInitialization.ts # Inicjalizacja
│   └── useNotifications.ts             # Hook dla onboardingu
├── shared/api-client/src/graphql/
│   ├── mutations/notifications/
│   │   └── registerDevice.ts           # Mutation rejestracji
│   └── queries/notifications/
│       └── myNotifications.ts          # Queries notyfikacji
├── app/
│   ├── _layout.tsx                     # Inicjalizacja przy starcie
│   └── (auth)/notifications/
│       └── index.tsx                   # Ekran onboardingu
├── docs/
│   ├── PUSH_NOTIFICATIONS_README.md    # Ten plik
│   ├── PUSH_NOTIFICATIONS_SETUP.md     # Pełna dokumentacja
│   ├── PUSH_NOTIFICATIONS_QUICKSTART.md # Quick start
│   └── PUSH_NOTIFICATIONS_IMPLEMENTATION.md # Szczegóły implementacji
└── .env                                # Firebase credentials
```

## 🎯 Co działa automatycznie

✅ Rejestracja urządzenia przy pierwszym uruchomieniu  
✅ Requestowanie uprawnień do notyfikacji  
✅ Pobieranie i wysyłanie FCM tokenu  
✅ Odbieranie notyfikacji z backendu  
✅ Wyświetlanie notyfikacji gdy app w foreground  
✅ Wyświetlanie notyfikacji gdy app w background  
✅ Obsługa kliknięcia w notyfikację  

## 🔮 Przyszłe rozszerzenia (opcjonalne)

### UI dla historii notyfikacji
- Ekran z listą wszystkich notyfikacji
- Filtrowanie po kategoriach (General, Promotions, Security)
- Oznaczanie jako przeczytane
- Badge count w ikonie profilu

### Deep linking
- Nawigacja do konkretnych ekranów po kliknięciu
- Np. notyfikacja o pieczątce → ekran sklepu

### Rich notifications
- Obrazki w notyfikacjach
- Action buttons
- Custom sounds

### Preferencje użytkownika
- Włącz/wyłącz kategorie
- Quiet hours
- Częstotliwość

## 🐛 Troubleshooting

### "Push notifications only work on physical devices"
✅ To normalne - użyj fizycznego urządzenia

### Token nie jest generowany
1. Sprawdź czy `expo-notifications` i `expo-device` są zainstalowane
2. Sprawdź czy EAS projectId jest w `app.json` (✅ jest: `5c499f13-b9f0-48dc-9888-daf664d07485`)
3. Zrób rebuild: `npm run ios` lub `npm run android`
4. Sprawdź czy użytkownik zaakceptował uprawnienia

### Notyfikacje nie przychodzą
1. Sprawdź logi backendu (BullMQ queue)
2. Sprawdź czy token jest w bazie danych
3. Sprawdź czy Firebase credentials są poprawne na backendzie
4. Sprawdź połączenie z internetem

### Backend nie wysyła notyfikacji
1. Sprawdź czy `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` są ustawione
2. Sprawdź czy Redis działa (BullMQ queue)
3. Sprawdź logi workera notyfikacji

## 📚 Dokumentacja

- **PUSH_NOTIFICATIONS_SETUP.md** - Pełna dokumentacja techniczna
- **PUSH_NOTIFICATIONS_QUICKSTART.md** - Szybki start dla developerów
- **PUSH_NOTIFICATIONS_IMPLEMENTATION.md** - Szczegóły implementacji

## 🎉 Podsumowanie

Podstawowa infrastruktura push notyfikacji jest **w pełni zaimplementowana i gotowa do użycia**. 

Backend automatycznie wysyła powiadomienia przy kluczowych akcjach użytkownika (pieczątki, punkty, kupony, zamówienia, referrals), a aplikacja mobilna je odbiera i wyświetla.

Wystarczy dodać pliki Firebase (`google-services.json` i `GoogleService-Info.plist`) i zbudować aplikację natywnie.

Dodatkowe funkcje (UI historii, deep linking, preferencje) mogą być dodane w przyszłości według potrzeb biznesowych.

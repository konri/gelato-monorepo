# Push Notifications - Konfiguracja

## Architektura

```
Mobile App → getDevicePushTokenAsync() → natywny FCM token
     ↓
Backend (registerDevice mutation) → zapisuje token w DB
     ↓
Backend (Firebase Admin SDK) → admin.messaging().sendEachForMulticast()
     ↓
FCM/APNs → Urządzenie
```

**Kluczowe:** Używamy `getDevicePushTokenAsync()` (natywny token FCM/APNs), NIE `getExpoPushTokenAsync()` (Expo Push Service). Backend wysyła bezpośrednio przez Firebase Admin SDK.

---

## Status

### Android ✅ DZIAŁA
- `google-services.json` - skonfigurowany
- Firebase plugin w Gradle - skonfigurowany
- Natywny FCM token - działa
- Notyfikacje z backendu - działają

### iOS ⏳ DO ZROBIENIA
- `ios/GoogleService-Info.plist` - **wymagany** (pobierz z Firebase Console)
- APNs credentials - **wymagane** (przez EAS CLI lub Apple Developer Portal)

---

## Pliki konfiguracyjne

### Android
- `android/app/google-services.json` - Firebase config dla Androida
- `android/build.gradle` - zawiera `classpath('com.google.gms:google-services:4.4.0')`
- `android/app/build.gradle` - zawiera `apply plugin: 'com.google.gms.google-services'`
- `app.json` - zawiera `"useNextNotificationsApi": true`

### iOS (do dodania)
- `ios/GoogleService-Info.plist` - Firebase config dla iOS
- APNs Key (.p8) - credentials do wysyłania notyfikacji przez Apple

---

## Komponenty frontendowe

### `services/notificationService.ts`
Główny serwis. Kluczowa metoda:
```typescript
// Pobiera natywny FCM token (nie Expo Push Token!)
const nativeToken = await Notifications.getDevicePushTokenAsync();
this.fcmToken = nativeToken.data as string;
```

### `hooks/useNotificationRegistration.ts`
- Rejestruje urządzenie w backendzie po zalogowaniu
- Ustawia listenery na przychodzące notyfikacje

### `utils/testNotification.ts`
- Lokalne testowanie notyfikacji (bez backendu)
- Przycisk testowy w profilu (tylko `__DEV__`)

---

## Konfiguracja iOS (do zrobienia)

### Krok 1: GoogleService-Info.plist
1. Wejdź na [Firebase Console](https://console.firebase.google.com) → projekt "bonapka"
2. Project Settings → Your apps
3. Dodaj aplikację iOS (jeśli nie ma) - Bundle ID: `com.bonapka.app`
4. Pobierz `GoogleService-Info.plist`
5. Umieść w: `ios/GoogleService-Info.plist`
6. Dodaj do `app.json`:
```json
"ios": {
  "googleServicesFile": "./ios/GoogleService-Info.plist"
}
```
7. Przebuduj: `npx expo run:ios`

### Krok 2: APNs Credentials

#### Opcja A: EAS CLI (automatyczne)
```bash
npm install -g eas-cli
eas login
eas credentials
# Wybierz: iOS → Push Notifications → Let EAS handle it
```
Wymaga Apple Developer Account.

#### Opcja B: Ręcznie
1. [Apple Developer Portal](https://developer.apple.com/account) → Keys → Create new key
2. Zaznacz "Apple Push Notifications service (APNs)"
3. Pobierz .p8 file
4. Skonfiguruj w Firebase Console → Project Settings → Cloud Messaging → APNs Authentication Key

---

## Testowanie

### Android (działa teraz)
```bash
# Uruchom emulator
emulator -avd Pixel_9

# Uruchom aplikację
npx expo run:android

# Dodaj punkty przez backend → notyfikacja przyjdzie automatycznie
```

### Lokalne (bez backendu)
- Zakładka Profile → przycisk "🧪 Test Notification" (tylko dev mode)

### Przez backend
```bash
curl --location 'https://api-dev.easybons.com/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TWOJ_TOKEN' \
--data '{
  "query": "mutation($amount: Float!, $description: String!) { addPoints(amount: $amount, description: $description) { totalPoints } }",
  "variables": {"amount": 100, "description": "Test"}
}'
```

---

## Debugging

### Logi aplikacji
```
LOG  🔔 Starting notification registration...
LOG  🔔 Setting up notification listeners...
LOG  ✅ Push notifications registered successfully
LOG  📬 Notification received (foreground): {...}
LOG  👆 Notification tapped: {...}
```

### Typowe problemy

**"FirebaseApp is not initialized" (Android)**
- Brakuje `google-services.json` lub Google Services plugin w Gradle
- Rozwiązanie: sprawdź `android/build.gradle` i `android/app/build.gradle`
- Wymagany pełny rebuild: `npx expo run:android`

**Token null**
- Brak uprawnień do notyfikacji
- Na iOS: symulator nie obsługuje push notifications

**Notyfikacja nie przychodzi mimo "Notification sent: 1"**
- Sprawdź czy backend wysyła natywny FCM token, nie `ExponentPushToken`
- `ExponentPushToken` działa tylko z Expo Push Service, nie z Firebase Admin SDK

---

## Przed produkcją

- [ ] Skonfigurować iOS (GoogleService-Info.plist + APNs)
- [ ] Usunąć przycisk testowy z profilu (`__DEV__` guard już jest)
- [ ] Przetestować na fizycznym iPhone
- [ ] Dodać obsługę deep linking przy kliknięciu notyfikacji (opcjonalnie)

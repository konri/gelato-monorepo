# iOS Push Notifications - Do dokończenia

## Co już jest zrobione
- ✅ `ios/Bonapka/GoogleService-Info.plist` - dodany
- ✅ `app.json` - skonfigurowany z `googleServicesFile`
- ✅ Kod aplikacji - gotowy (używa `getDevicePushTokenAsync()`)

## Co trzeba zrobić

### Krok 1: Apple Developer Account

1. Wejdź na [developer.apple.com](https://developer.apple.com)
2. Kliknij **"Account"** → zaloguj się Apple ID
3. Zaakceptuj umowę developerską
4. Gotowe - masz darmowe konto (wystarczy do testów)

---

### Krok 2: APNs Key w Apple Developer Portal

1. Wejdź na [developer.apple.com/account](https://developer.apple.com/account)
2. **Certificates, Identifiers & Profiles**
3. **Keys** (lewy panel) → **"+"** (utwórz nowy)
4. Nazwa: np. `Bonapka APNs Key`
5. Zaznacz **"Apple Push Notifications service (APNs)"**
6. **Continue** → **Register**
7. **Download** - pobierz plik `.p8` (tylko raz można pobrać!)
8. Zapisz też **Key ID** (widoczny na stronie)

---

### Krok 3: Dodaj APNs Key do Firebase

1. [Firebase Console](https://console.firebase.google.com) → projekt "bonapka"
2. **Project Settings** (koło zębate) → zakładka **"Cloud Messaging"**
3. Sekcja **"Apple app configuration"**
4. **"APNs Authentication Key"** → **Upload**
5. Wgraj plik `.p8`
6. Podaj **Key ID** i **Team ID**
   - Team ID znajdziesz w Apple Developer Portal → **Membership**

---

### Krok 4: Uruchom na fizycznym iPhone

Podłącz iPhone do Maca kablem, potem:

```bash
npx expo run:ios --device
```

Xcode zapyta o signing - zaloguj się Apple ID i wybierz swój team.

---

### Krok 5: Test

Po uruchomieniu na telefonie:
1. Zaloguj się w aplikacji
2. Sprawdź logi - pojawi się natywny APNs token
3. Wyślij punkty z backendu → notyfikacja powinna przyjść

---

## Uwagi

- Symulator iOS **nie obsługuje** push notifications - wymagany fizyczny iPhone
- Darmowe Apple Developer Account działa do testów (bez limitu dla push notifications)
- Płatne konto ($99/rok) potrzebne tylko do publikacji w App Store

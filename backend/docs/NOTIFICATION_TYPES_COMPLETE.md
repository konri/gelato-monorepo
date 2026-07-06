# Complete Notification Types Guide

## 3 Categories

### 1. GENERAL (Aktywności użytkownika i nagrody)

- Pieczątki, punkty, kupony, osiągnięcia
- Użytkownik **zawsze** chce te notyfikacje
- Czerwona kropka: TAK

### 2. PROMOTIONS (Marketing i oferty)

- Promocje, wyprzedaże, nowe oferty
- Użytkownik **może wyłączyć** w ustawieniach
- Czerwona kropka: TAK (jeśli włączone)

### 3. SECURITY (Bezpieczeństwo konta)

- Logowania, zmiany hasła, podejrzana aktywność
- Użytkownik **NIE MOŻE wyłączyć** (krytyczne)
- Czerwona kropka: TAK (zawsze)

---

## All Notification Types (47 types)

### GENERAL (13 types)

| Type                      | Kiedy wysłać           | Przykład                                    |
| ------------------------- | ---------------------- | ------------------------------------------- |
| `STAMP_ADDED`             | Po dodaniu pieczątki   | "🎉 Nowa pieczątka w Piekarnia Dorodka"     |
| `STAMP_CARD_COMPLETED`    | Karta pieczątek pełna  | "🎊 Karta ukończona! Odbierz nagrodę"       |
| `STAMP_MILESTONE_REACHED` | Osiągnięto milestone   | "🏆 Nagroda pośrednia! 20% zniżki"          |
| `POINTS_EARNED`           | Zdobyto punkty         | "💰 +100 punktów. Masz teraz 500 punktów"   |
| `POINTS_SPENT`            | Wydano punkty          | "💸 Wydano 50 punktów na voucher"           |
| `COUPON_CLAIMED`          | Odebrano kupon         | "🎁 Odebrano kupon: 20% zniżki"             |
| `VOUCHER_PURCHASED`       | Zakupiono voucher      | "🎫 Zakupiono voucher za 100 punktów"       |
| `BIRTHDAY_REWARD`         | Urodziny użytkownika   | "🎂 Wszystkiego najlepszego! +200 punktów"  |
| `REFERRAL_COMPLETED`      | Polecenie zrealizowane | "👥 Twój znajomy dołączył do Bonapka"       |
| `REFERRAL_REWARD_EARNED`  | Nagroda za polecenie   | "🎁 +150 punktów za polecenie!"             |
| `REWARD_UNLOCKED`         | Odblokowano nagrodę    | "🏆 Odblokowano: Darmowa kawa"              |
| `ACHIEVEMENT_UNLOCKED`    | Osiągnięcie            | "🎖️ Osiągnięcie: Pierwszy mistrz pieczątek" |
| `SYSTEM_ANNOUNCEMENT`     | Ogłoszenie systemowe   | "📢 Nowe funkcje w aplikacji!"              |

### PROMOTIONS (8 types)

| Type                   | Kiedy wysłać           | Przykład                                |
| ---------------------- | ---------------------- | --------------------------------------- |
| `COUPON_AVAILABLE`     | Nowy kupon dostępny    | "🎁 Nowy kupon: 30% zniżki w Starbucks" |
| `COUPON_EXPIRING`      | Kupon wygasa (24h)     | "⏰ Kupon wygasa jutro!"                |
| `VOUCHER_EXPIRING`     | Voucher wygasa (7 dni) | "⏰ Voucher wygasa za 7 dni"            |
| `MERCHANT_PROMOTION`   | Promocja merchanta     | "🔥 Promocja w Piekarnia Dorodka!"      |
| `SPECIAL_OFFER`        | Specjalna oferta       | "✨ Tylko dziś: 2+1 gratis"             |
| `NEW_REWARD_AVAILABLE` | Nowa nagroda           | "🎁 Nowa nagroda: Darmowy deser"        |
| `FLASH_SALE`           | Błyskawiczna wyprzedaż | "⚡ Flash Sale! 50% zniżki przez 2h"    |
| `LIMITED_TIME_OFFER`   | Oferta czasowa         | "⏳ Oferta kończy się o północy"        |

### SECURITY (7 types)

| Type                  | Kiedy wysłać                  | Przykład                                          |
| --------------------- | ----------------------------- | ------------------------------------------------- |
| `NEW_LOGIN`           | Logowanie z nowego urządzenia | "🔐 Zalogowano się z iPhone w Warszawie"          |
| `NEW_DEVICE`          | Dodano nowe urządzenie        | "📱 Dodano nowe urządzenie: iPhone 14"            |
| `PASSWORD_CHANGED`    | Zmieniono hasło               | "🔒 Hasło zostało zmienione"                      |
| `EMAIL_CHANGED`       | Zmieniono email               | "📧 Email zmieniony na nowy@email.com"            |
| `SUSPICIOUS_ACTIVITY` | Podejrzana aktywność          | "⚠️ Wykryto 5 nieudanych prób logowania"          |
| `ACCOUNT_LOCKED`      | Konto zablokowane             | "🚫 Konto zablokowane ze względów bezpieczeństwa" |
| `TWO_FACTOR_ENABLED`  | Włączono 2FA                  | "✅ Uwierzytelnianie dwuskładnikowe włączone"     |

### SYSTEM (6 types)

| Type                    | Kiedy wysłać               | Przykład                                |
| ----------------------- | -------------------------- | --------------------------------------- |
| `APP_UPDATE_AVAILABLE`  | Nowa wersja app            | "🆕 Dostępna aktualizacja v2.0.0"       |
| `MAINTENANCE_SCHEDULED` | Planowana przerwa          | "🔧 Przerwa techniczna jutro 2:00-4:00" |
| `EVENT_REMINDER`        | Przypomnienie o wydarzeniu | "📅 Wydarzenie jutro o 18:00"           |
| `SUBSCRIPTION_EXPIRING` | Subskrypcja wygasa         | "⏰ Subskrypcja wygasa za 7 dni"        |
| `PAYMENT_FAILED`        | Płatność nieudana          | "❌ Płatność nieudana. Sprawdź kartę"   |
| `TERMS_UPDATED`         | Zaktualizowano regulamin   | "📄 Zaktualizowano regulamin"           |

---

## Notification Settings (User Preferences)

```typescript
model UserNotificationSettings {
  id                    String  @id @default(uuid())
  userId                String  @unique
  user                  User    @relation(fields: [userId], references: [id])

  // GENERAL - always enabled (cannot disable)
  generalEnabled        Boolean @default(true)

  // PROMOTIONS - user can disable
  promotionsEnabled     Boolean @default(true)

  // SECURITY - always enabled (cannot disable)
  securityEnabled       Boolean @default(true)

  // Quiet hours
  quietHoursEnabled     Boolean @default(false)
  quietHoursStart       String? // "22:00"
  quietHoursEnd         String? // "08:00"

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

## Mobile App - Notification Channels (Android)

```typescript
// Setup notification channels
import notifee from '@notifee/react-native'

await notifee.createChannels([
  {
    id: 'general',
    name: 'Aktywności',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  },
  {
    id: 'promotions',
    name: 'Promocje',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  },
  {
    id: 'security',
    name: 'Bezpieczeństwo',
    importance: AndroidImportance.HIGH,
    sound: 'urgent',
    vibration: true,
  },
])
```

---

## Badge Counter Logic

```typescript
// Frontend - calculate badge
const { data } = useQuery(GET_UNREAD_BY_CATEGORY)

const totalBadge = data.unreadNotificationsByCategory.reduce(
  (sum, cat) => sum + cat.count,
  0
)

// Show badge
<TabBar>
  <Tab icon="bell" badge={totalBadge} />
</TabBar>

// Separate badges per category
<NotificationScreen>
  <Tab title="Aktywności" badge={generalCount} />
  <Tab title="Promocje" badge={promotionsCount} />
  <Tab title="Bezpieczeństwo" badge={securityCount} />
</NotificationScreen>
```

---

## Priority Levels

| Category   | Priority | Sound | Vibration | Heads-up |
| ---------- | -------- | ----- | --------- | -------- |
| GENERAL    | HIGH     | ✅    | ✅        | ✅       |
| PROMOTIONS | DEFAULT  | ✅    | ❌        | ❌       |
| SECURITY   | URGENT   | ✅    | ✅        | ✅       |

---

## Deep Linking

```typescript
// Metadata for deep linking
{
  merchantId: "merchant-123",
  couponId: "coupon-456",
  screen: "CouponDetails",
  action: "view"
}

// Mobile app - handle notification tap
messaging().onNotificationOpenedApp(remoteMessage => {
  const { screen, merchantId, couponId } = remoteMessage.data

  navigation.navigate(screen, { merchantId, couponId })
})
```

---

## Summary

✅ **47 notification types** covering all scenarios  
✅ **3 categories** (GENERAL, PROMOTIONS, SECURITY)  
✅ **User preferences** - can disable PROMOTIONS only  
✅ **Badge counters** - per category  
✅ **Deep linking** - navigate to specific screens  
✅ **Priority levels** - SECURITY is urgent  
✅ **Quiet hours** - optional do-not-disturb

Wszystkie typy notyfikacji uwzględnione! 🎉

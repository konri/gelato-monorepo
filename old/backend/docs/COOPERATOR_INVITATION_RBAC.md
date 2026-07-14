# Cooperator Invitation + RBAC (Store Scope)

## Założenia

- Zaproszenie kooperatora tworzy owner po emailu.
- Zaproszony użytkownik może nie mieć konta w momencie wysłania.
- Zaproszenie zawiera web URL oraz deeplink.
- Po akceptacji użytkownik zachowuje dotychczasowe role i otrzymuje `COOPERATOR`.
- Dostęp kooperatora:
  - `FULL_MERCHANT`
  - `STORE_SCOPED` z `storeScopeAll` lub listą `storeIds`.

## Konfiguracja merchanta vs nadpisania per sklep (API)

- Mutacje zmieniające **definicje globalne** merchanta (profil, `create`/`update` kuponu/nagrody/szablonu/streaka w wersji bazowej, zapis programu punktowego) wymagają **`scopeMode === FULL_MERCHANT`** oraz odpowiedniego uprawnienia z grupy `MERCHANT_BASE_CONFIG_PERMISSIONS` (np. `COUPON_BASE_WRITE`). Realizuje to `MerchantAccessService.canEditMerchantWideBaseConfig`.
- Kooperator **`STORE_SCOPED`** — nawet z `storeScopeAll` — **nie** może edytować tych globalnych definicji; może używać mutacji **nadpisań sklepowych** (`upsert*StoreOverride`, `delete*StoreOverride`), jeśli ma `*_OVERRIDE_WRITE` i `ensureStoreAccess` dla danego `storeId`.
- W GraphQL flagi edycji są w zagnieżdżonym obiekcie `editCapabilities` na każdym `merchantScope`. Pole `canEditMerchantBaseConfig` jest `true` tylko przy **`FULL_MERCHANT`** i gdy w `permissions` jest którekolwiek z uprawnień bazowej konfiguracji; nadpisania sklepowe nadal opierają się na `*_OVERRIDE_WRITE`.

## Nowe mutacje i query

### Create Invitation (OWNER)

```graphql
mutation CreateCooperatorInvitation($data: CreateCooperatorInvitationInput!) {
  createCooperatorInvitation(data: $data) {
    invitation {
      id
      email
      accessLevel
      storeScopeAll
      storeIds
      merchantId
      expiresAt
    }
    webUrl
    deeplinkUrl
  }
}
```

Przykładowe `variables`:

```json
{
  "data": {
    "email": "worker@example.com",
    "accessLevel": "STORE_SCOPED",
    "storeScopeAll": false,
    "storeIds": ["store-id-1", "store-id-2"],
    "expiresInHours": 72
  }
}
```

### List Invitations (OWNER)

```graphql
query MyCooperatorInvitations($status: CooperatorInvitationStatus) {
  myCooperatorInvitations(status: $status) {
    id
    email
    accessLevel
    storeScopeAll
    storeIds
    expiresAt
    acceptedAt
    revokedAt
  }
}
```

### Revoke Invitation (OWNER)

```graphql
mutation RevokeCooperatorInvitation($invitationId: String!) {
  revokeCooperatorInvitation(invitationId: $invitationId) {
    id
    revokedAt
  }
}
```

### Preview Invitation (Public)

```graphql
query PreviewCooperatorInvitation($token: String!) {
  previewCooperatorInvitation(token: $token) {
    valid
    email
    merchantId
    merchantName
    accessLevel
    storeScopeAll
    storeIds
    expiresAt
  }
}
```

### Accept Invitation (Logged user)

```graphql
mutation AcceptCooperatorInvitation($token: String!) {
  acceptCooperatorInvitation(token: $token) {
    merchantId
    merchantName
    accessLevel
    storeScopeAll
    storeIds
    cooperatorId
  }
}
```

### Update Cooperator Access (OWNER)

```graphql
mutation UpdateCooperatorAccess($data: UpdateCooperatorAccessInput!) {
  updateCooperatorAccess(data: $data) {
    id
    accessLevel
    storeScopeAll
  }
}
```

## Test scenariusze manualne

1. Owner tworzy zaproszenie dla emaila bez konta.
2. Użytkownik rejestruje konto i akceptuje token.
3. Użytkownik dostaje `COOPERATOR` bez utraty poprzednich ról.
4. `STORE_SCOPED` ogranicza operacje do przypiętych sklepów.
5. Owner zmienia zakres dostępu kooperatora przez `updateCooperatorAccess`.
6. Akceptacja drugi raz zwraca błąd biznesowy.

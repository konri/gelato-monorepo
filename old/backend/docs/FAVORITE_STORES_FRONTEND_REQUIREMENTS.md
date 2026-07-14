# Favorite Stores - Wymagania dla Frontendu

> **Ważne dla agenta:** Trzymaj się konwencji istniejącego kodu. Wszystkie zapytania do API przez GraphQL — patrz jak to jest zrobione w innych miejscach w projekcie i rób analogicznie. Nie wymyślaj innego podejścia.

---

## Endpoint

Wszystkie operacje: `POST /graphql`  
Wymagany nagłówek: `Authorization: Bearer <token>` (user musi być zalogowany jako CLIENT)

---

## 1. Mapa — ikonka "ulubione" na markerze stora

Przy pobieraniu storów przez `unifiedSearch` lub `searchByLocation` każdy store w tablicy `stores` ma teraz pole `isFavorite: Boolean`.

Jeśli `isFavorite === true`, w rogu ikonki markera na mapie należy wyświetlić małą nakładkę z ikoną:

- PNG do nakładki na mapie: `/api/static/categories/favorite.png`
- SVG (UI poza mapą): `/api/static/categories/favorite.svg`

Te URL-e są też zwracane bezpośrednio w odpowiedzi jako `favoriteIconUrl` i `favoriteIconPngUrl` — nie hardkoduj ich, czytaj z odpowiedzi API.

### Query — pobieranie storów z flagą isFavorite

```bash
curl -X POST $base_url/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query UnifiedSearch($filters: UnifiedSearchInput!) { unifiedSearch(filters: $filters) { stores { store { id name address city latitude longitude logoUrl } merchant { id name logoUrl } distanceKm isFavorite favoriteIconUrl favoriteIconPngUrl } searchLatitude searchLongitude } }",
    "variables": {
      "filters": {
        "location": { "latitude": 50.0647, "longitude": 19.945, "radiusKm": 10 }
      }
    }
  }'
```

**Fragment odpowiedzi:**

```json
{
  "data": {
    "unifiedSearch": {
      "stores": [
        {
          "store": { "id": "store-uuid-1", "name": "Pizza Roma - Centrum", "latitude": 50.061, "longitude": 19.937 },
          "merchant": { "id": "merchant-uuid-1", "name": "Pizza Roma", "logoUrl": "https://..." },
          "distanceKm": 0.8,
          "isFavorite": true,
          "favoriteIconUrl": "/api/static/categories/favorite.svg",
          "favoriteIconPngUrl": "/api/static/categories/favorite.png"
        },
        {
          "store": { "id": "store-uuid-2", "name": "Burger House" },
          "distanceKm": 1.4,
          "isFavorite": false,
          "favoriteIconUrl": "/api/static/categories/favorite.svg",
          "favoriteIconPngUrl": "/api/static/categories/favorite.png"
        }
      ]
    }
  }
}
```

**Logika na mapie:**

- Marker stora renderuj normalnie z logo merchanta
- Jeśli `isFavorite === true` — nałóż małą ikonkę `favoriteIconPngUrl` w rogu markera
- Jeśli `isFavorite === false` — marker bez nakładki

---

## 2. Ekran merchanta / stora — przycisk "Dodaj do ulubionych"

Na ekranie szczegółów stora wyświetl przycisk toggle (dodaj/usuń z ulubionych).

Stan przycisku inicjalizuj na podstawie `isFavorite` z danych stora (już pobrane przy search).

### Mutation — dodaj do ulubionych

```bash
curl -X POST $base_url/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation AddFavoriteStore($merchantStoreId: String!) { addFavoriteStore(merchantStoreId: $merchantStoreId) { id merchantStoreId createdAt } }",
    "variables": {
      "merchantStoreId": "store-uuid-1"
    }
  }'
```

**Odpowiedź (sukces):**

```json
{
  "data": {
    "addFavoriteStore": {
      "id": "fav-uuid-1",
      "merchantStoreId": "store-uuid-1",
      "createdAt": "2026-03-19T10:00:00.000Z"
    }
  }
}
```

### Mutation — usuń z ulubionych

```bash
curl -X POST $base_url/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation RemoveFavoriteStore($merchantStoreId: String!) { removeFavoriteStore(merchantStoreId: $merchantStoreId) }",
    "variables": {
      "merchantStoreId": "store-uuid-1"
    }
  }'
```

**Odpowiedź (sukces):**

```json
{
  "data": {
    "removeFavoriteStore": true
  }
}
```

**Obsługa błędów:**

```json
{ "errors": [{ "message": "Store already in favorites" }] }
{ "errors": [{ "message": "Store not in favorites" }] }
{ "errors": [{ "message": "Store not found" }] }
```

**UX przycisku:**

- Przed requestem — optimistic update (od razu zmień stan przycisku)
- Jeśli request się nie powiedzie — cofnij stan i pokaż błąd
- Ikona aktywna: `favoriteIconUrl` (SVG) w kolorze / wypełniona
- Ikona nieaktywna: ta sama ikona, wyszarzona / outline

---

## 3. Ekran główny — sekcja "Ulubione"

Sekcja na ekranie głównym wyświetla loga ulubionych storów usera. Funkcjonalność już istnieje w UI (podgląd), teraz trzeba ją podpiąć pod API.

### Query — pobierz ulubione story usera

```bash
curl -X POST $base_url/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query MyFavoriteStores { myFavoriteStores { id merchantStoreId createdAt merchantStore { id name city logoUrl merchant { id name logoUrl } } } }"
  }'
```

**Odpowiedź:**

```json
{
  "data": {
    "myFavoriteStores": [
      {
        "id": "fav-uuid-1",
        "merchantStoreId": "store-uuid-1",
        "createdAt": "2026-03-19T10:00:00.000Z",
        "merchantStore": {
          "id": "store-uuid-1",
          "name": "Pizza Roma - Centrum",
          "city": "Kraków",
          "logoUrl": "https://cdn.easybons.com/logos/pizza-roma.png",
          "merchant": {
            "id": "merchant-uuid-1",
            "name": "Pizza Roma",
            "logoUrl": "https://cdn.easybons.com/logos/pizza-roma.png"
          }
        }
      }
    ]
  }
}
```

**Logika sekcji:**

- Pobierz `myFavoriteStores` przy ładowaniu ekranu głównego
- Jeśli lista pusta — ukryj sekcję lub pokaż placeholder "Brak ulubionych"
- Wyświetl loga storów (`merchantStore.logoUrl` lub fallback na `merchantStore.merchant.logoUrl`)
- Kliknięcie w logo → przejście do ekranu szczegółów tego stora
- Po dodaniu/usunięciu ze ulubionych na ekranie stora — odśwież tę sekcję (refetch `myFavoriteStores`)

---

## Podsumowanie operacji

| Operacja              | Typ      | Wymaga auth                                          | Opis                          |
| --------------------- | -------- | ---------------------------------------------------- | ----------------------------- |
| `unifiedSearch`       | Query    | nie (ale `isFavorite` działa tylko dla zalogowanych) | Stores z flagą `isFavorite`   |
| `myFavoriteStores`    | Query    | tak (CLIENT)                                         | Lista ulubionych storów usera |
| `addFavoriteStore`    | Mutation | tak (CLIENT)                                         | Dodaj store do ulubionych     |
| `removeFavoriteStore` | Mutation | tak (CLIENT)                                         | Usuń store z ulubionych       |

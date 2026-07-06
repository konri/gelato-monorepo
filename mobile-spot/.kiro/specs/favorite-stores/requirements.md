# Requirements Document

## Introduction

The Favorite Stores feature allows authenticated CLIENT users to mark merchant stores as favorites, view them on the home screen, and see visual indicators on the map. It connects three existing UI surfaces — the map, the store details screen, and the home screen — to real API data via GraphQL mutations and queries.

## Glossary

- **App**: The React Native / Expo mobile application
- **Client**: An authenticated user with the CLIENT role
- **FavoriteMerchantsSection**: Existing UI component on the home screen that currently renders hardcoded data
- **ActionButtons**: Existing component on the store details screen containing the "Add to Favorites" button
- **UnifiedSearch**: The existing GraphQL query used to fetch stores for the map and nearby lists
- **StoreResult**: A single store entry returned by `unifiedSearch`, containing store, merchant, and distance data
- **FavoriteStore**: A record linking a Client to a merchant store, returned by `myFavoriteStores`
- **MerchantStore**: A store entity with id, name, city, logoUrl, and nested merchant data
- **favoriteIconUrl**: SVG icon URL for the favorite indicator, returned per-store from the API
- **favoriteIconPngUrl**: PNG icon URL for the favorite indicator, returned per-store from the API
- **Optimistic Update**: Immediately updating UI state before the API response arrives, then reverting on failure

---

## Requirements

### Requirement 1: Extend UnifiedSearch with Favorite Fields

**User Story:** As a Client, I want stores returned by search to include my favorite status, so that the map and lists can reflect which stores I have favorited.

#### Acceptance Criteria

1. THE App SHALL include `isFavorite`, `favoriteIconUrl`, and `favoriteIconPngUrl` fields in the `stores` array of the `UNIFIED_SEARCH_FULL_QUERY` GraphQL query document.
2. THE `StoreResult` type SHALL be extended with `isFavorite: boolean`, `favoriteIconUrl?: string`, and `favoriteIconPngUrl?: string` fields.
3. THE `useUnifiedSearch` hook SHALL expose `isFavorite`, `favoriteIconUrl`, and `favoriteIconPngUrl` on each mapped store object in the `stores` array.
4. WHEN `isFavorite` is not present in the API response (e.g., unauthenticated user), THE App SHALL treat the value as `false`.

---

### Requirement 2: Map Marker Favorite Overlay

**User Story:** As a Client, I want to see a visual indicator on map markers for my favorite stores, so that I can quickly identify them on the map.

#### Acceptance Criteria

1. WHEN a store marker is rendered on the map and `isFavorite === true`, THE App SHALL overlay the image from `favoriteIconPngUrl` in the corner of the marker.
2. WHEN a store marker is rendered on the map and `isFavorite === false`, THE App SHALL render the marker without any overlay icon.
3. THE App SHALL read the overlay icon URL from the `favoriteIconPngUrl` field of the store result and SHALL NOT use a hardcoded URL.
4. IF `favoriteIconPngUrl` is absent or empty and `isFavorite === true`, THEN THE App SHALL render the marker without the overlay rather than showing a broken image.

---

### Requirement 3: Add and Remove Favorite Store Mutations

**User Story:** As a Client, I want to add or remove a store from my favorites, so that I can manage my personal list of favorite stores.

#### Acceptance Criteria

1. THE App SHALL implement an `addFavoriteStore` GraphQL mutation that accepts `merchantStoreId: String!` and returns `{ id, merchantStoreId, createdAt }`.
2. THE App SHALL implement a `removeFavoriteStore` GraphQL mutation that accepts `merchantStoreId: String!`.
3. THE App SHALL implement typed functions (`addFavoriteStore`, `removeFavoriteStore`) following the existing mutation function pattern (see `claimCouponFunction.ts`).
4. IF the API returns the error `"Store already in favorites"`, THEN THE App SHALL treat the add operation as a no-op and revert the optimistic update.
5. IF the API returns the error `"Store not in favorites"`, THEN THE App SHALL treat the remove operation as a no-op and revert the optimistic update.
6. IF the API returns the error `"Store not found"`, THEN THE App SHALL revert the optimistic update and display an error message to the user.

---

### Requirement 4: Store Details Screen — Favorite Toggle Button

**User Story:** As a Client, I want a toggle button on the store details screen to add or remove the store from my favorites, so that I can manage favorites while browsing a store.

#### Acceptance Criteria

1. THE `ActionButtons` component SHALL accept `isFavorite: boolean`, `favoriteIconUrl?: string`, `onToggleFavorite: () => void`, and `isTogglingFavorite: boolean` props.
2. WHEN `isFavorite === true`, THE `ActionButtons` component SHALL display the favorite button in an active/filled state using the icon from `favoriteIconUrl`.
3. WHEN `isFavorite === false`, THE `ActionButtons` component SHALL display the favorite button in an inactive/grayed-out state.
4. WHEN the user presses the favorite toggle button, THE App SHALL perform an optimistic update by immediately toggling the local `isFavorite` state before the API call completes.
5. IF the API call fails after an optimistic update, THEN THE App SHALL revert `isFavorite` to its previous value and display an error message.
6. THE store details screen (`app/merchant_store/[id].tsx`) SHALL initialize the `isFavorite` state from the `isFavorite` field passed via navigation params or fetched store data.
7. WHILE a favorite toggle request is in progress, THE `ActionButtons` component SHALL disable the favorite button to prevent duplicate requests.

---

### Requirement 5: Fetch User's Favorite Stores

**User Story:** As a Client, I want the app to fetch my favorite stores from the API, so that the home screen can display an up-to-date list.

#### Acceptance Criteria

1. THE App SHALL implement a `myFavoriteStores` GraphQL query that returns `{ id, merchantStoreId, createdAt, merchantStore { id, name, city, logoUrl, merchant { id, name, logoUrl } } }`.
2. THE App SHALL implement a `useFavoriteStores` hook that fetches `myFavoriteStores` using the authenticated token, following the pattern of `useStoreDetails`.
3. THE `useFavoriteStores` hook SHALL expose `data`, `loading`, `error`, and `refetch` fields.
4. WHEN the `myFavoriteStores` query returns an empty array, THE `useFavoriteStores` hook SHALL return an empty array in `data` (not null).

---

### Requirement 6: Home Screen — Favorites Section

**User Story:** As a Client, I want to see my favorite stores on the home screen, so that I can quickly navigate to stores I care about.

#### Acceptance Criteria

1. THE `FavoriteMerchantsSection` component SHALL accept `favorites`, `loading`, and `onStorePress` props and SHALL NOT use hardcoded store data.
2. WHEN `loading === true`, THE `FavoriteMerchantsSection` component SHALL render a loading placeholder.
3. WHEN the favorites list is empty and `loading === false`, THE `FavoriteMerchantsSection` component SHALL hide the section or display a placeholder text sourced from the translation file.
4. WHEN displaying a favorite store, THE App SHALL use `merchantStore.logoUrl` as the primary logo image, with fallback to `merchantStore.merchant.logoUrl`.
5. WHEN the user taps a store logo in the favorites section, THE App SHALL navigate to the store details screen for that store.
6. THE home screen (`app/(tabs)/index.tsx` via `MainContent`) SHALL call `useFavoriteStores` on mount and pass the result to `FavoriteMerchantsSection`.
7. WHEN the user adds or removes a favorite on the store details screen and navigates back, THE App SHALL refetch `myFavoriteStores` so the home screen section reflects the updated list.

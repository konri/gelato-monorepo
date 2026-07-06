# Implementation Plan: Favorite Stores

## Overview

Wire three existing UI surfaces (store details, home screen, map) to real GraphQL data via new queries, mutations, and two hooks.

## Tasks

- [x] 1. Add favorite fields to unifiedSearch GraphQL layer
  - [x] 1.1 Extend `StoreResult` type with `isFavorite`, `favoriteIconUrl`, `favoriteIconPngUrl`
    - Modify `shared/api-client/src/graphql/queries/unifiedSearch/types.ts`
    - _Requirements: 1.2_
  - [x] 1.2 Add three fields to `stores {}` in `UNIFIED_SEARCH_FULL_QUERY`
    - Modify `shared/api-client/src/graphql/queries/unifiedSearch/unifiedSearch.ts`
    - _Requirements: 1.1_
  - [x] 1.3 Pass through new fields in `useUnifiedSearch` stores map
    - Modify `hooks/useUnifiedSearch.ts`
    - _Requirements: 1.3, 1.4_

- [x] 2. Create favoriteStores query
  - [x] 2.1 Create `myFavoriteStores` query document and types
    - Create `shared/api-client/src/graphql/queries/favoriteStores/query.ts`
    - Create `shared/api-client/src/graphql/queries/favoriteStores/types.ts`
    - _Requirements: 5.1_
  - [x] 2.2 Create `getFavoriteStores` function via `createGraphQLFunction`
    - Create `shared/api-client/src/graphql/queries/favoriteStores/index.ts`
    - _Requirements: 5.2_

- [x] 3. Create addFavoriteStore and removeFavoriteStore mutations
  - [x] 3.1 Create `ADD_FAVORITE_STORE_MUTATION` document and function
    - Create `shared/api-client/src/graphql/mutations/addFavoriteStore.ts`
    - Create `shared/api-client/src/graphql/mutations/addFavoriteStoreFunction.ts`
    - _Requirements: 3.1, 3.3_
  - [x] 3.2 Create `REMOVE_FAVORITE_STORE_MUTATION` document and function
    - Create `shared/api-client/src/graphql/mutations/removeFavoriteStore.ts`
    - Create `shared/api-client/src/graphql/mutations/removeFavoriteStoreFunction.ts`
    - _Requirements: 3.2, 3.3_

- [x] 4. Create useFavoriteStores hook
  - Create `hooks/useFavoriteStores.ts` following `useStoreDetails` pattern
  - Expose `data`, `loading`, `error`, `refetch`; default `data` to `[]`
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 5. Create useFavoriteToggle hook with optimistic update
  - Create `hooks/useFavoriteToggle.ts`
  - Implement optimistic flip, revert on error, handle known no-op errors silently
  - _Requirements: 3.4, 3.5, 3.6, 4.4, 4.5_

- [x] 6. Update ActionButtons to accept favorite props
  - Modify `components/molecules/MerchantStore/ActionButtons.tsx`
  - Accept `isFavorite`, `favoriteIconUrl`, `isTogglingFavorite`, `onToggleFavorite`
  - Show filled star when `isFavorite === true`, disable when toggling
  - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [x] 7. Wire useFavoriteToggle into merchant store screen
  - Modify `app/merchant_store/[id].tsx`
  - Instantiate `useFavoriteToggle` from store data, pass props to `ActionButtons`
  - _Requirements: 4.6_

- [x] 8. Update FavoriteMerchantsSection to use real data
  - Modify `components/molecules/FavoriteMerchantsSection.tsx`
  - Accept `favorites`, `loading`, `onStorePress` props; remove hardcoded data
  - Show loading placeholder, hide section when empty
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Wire useFavoriteStores into MainContent
  - Modify `components/molecules/MainContent.tsx`
  - Call `useFavoriteStores`, pass result + navigation handler to `FavoriteMerchantsSection`
  - _Requirements: 6.6_

- [x] 10. Add favorite overlay to map markers
  - Modify `components/molecules/Mapbox/MapboxSection.tsx`
  - Add `favoriteIconPngUrl` to GeoJSON properties; load overlay images; add overlay `SymbolLayer`
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 11. Add translation keys for new UI text
  - Add `noFavorites` key to `Sections` in `translations/resources/en.ts` and `translations/resources/pl.ts`
  - Add `removeFromFavorites` key to `MerchantStore` in both files
  - _Requirements: 6.3, 4.2_

- [x] 12. Checkpoint — Ensure all tests pass, ask the user if questions arise.

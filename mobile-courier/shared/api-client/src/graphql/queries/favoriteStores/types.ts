export interface FavoriteMerchantStore {
  id: string;
  name: string;
  city: string;
  logoUrl?: string;
  merchant: {
    id: string;
    name: string;
    logoUrl?: string;
  };
}

export interface FavoriteStore {
  id: string;
  merchantStoreId: string;
  createdAt: string;
  merchantStore: FavoriteMerchantStore;
}

export interface MyFavoriteStoresResponse {
  myFavoriteStores: FavoriteStore[];
}

export interface AddFavoriteStoreResponse {
  addFavoriteStore: {
    id: string;
    merchantStoreId: string;
    createdAt: string;
  };
}

export interface AddFavoriteStoreOptions {
  merchantStoreId: string;
  token?: string;
}

export interface RemoveFavoriteStoreOptions {
  merchantStoreId: string;
  token?: string;
}

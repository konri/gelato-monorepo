import { gql } from '@apollo/client';

export const GET_STORES_FOR_MAP_QUERY = gql`
    query GetStoresForMap($latitude: Float, $longitude: Float, $radiusKm: Float) {
        getStoresForMap(latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm) {
            id
            name
            address
            phone
            latitude
            longitude
            logoUrl
            images {
                url
                type
                alt
            }
            category {
                iconUrl
                iconPngUrl
                name
            }
            merchant {
                name
            }
            availablePromotions {
                hasPromotions
                vouchers {
                    id
                    pointsCost
                }
                stampCards {
                    id
                    stampsRequired
                }
            }
            isFavorite
            favoriteIconPngUrl
        }
    }
`;

export const GET_STORE_DETAILS_QUERY = gql`
    query GetStoreDetails($id: String!) {
        getStore(id: $id) {
            id
            name
            description
            address
            city
            country
            postalCode
            phone
            email
            openingHours
            latitude
            longitude
            logoUrl
            images {
                url
                type
                alt
            }
            category {
                id
                name
                slug
                iconUrl
                iconPngUrl
            }
            merchant {
                id
                name
                slug
                logoUrl
            }
            stampCard {
                current
                required
                reward
                isUsed
                isActive
                canRedeem
                canActivate
                templateId
            }
            userPoints
            promotions {
                id
                title
                description
                imageUrl
                value
                pointsCost
            }
            redeemableRewards {
                id
                type
                title
                description
                pointsCost
                userPoints
                pointsNeeded
                stampsCollected
                stampsRequired
                stampsNeeded
                canRedeem
                stampCoverUrl
                stampStickerIconUrl
                imageUrl
            }
            createdAt
            updatedAt
        }
    }
`;

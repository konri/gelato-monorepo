import { gql } from '@apollo/client';

export const GET_MERCHANTS_QUERY = gql`
    query GetMerchants($search: String, $categoryIds: [String!], $page: Int, $pageSize: Int) {
        getMerchants(search: $search, categoryIds: $categoryIds, page: $page, pageSize: $pageSize) {
            id name slug description logoUrl iconUrl
            category
            { id name }
            stores
            { id name city address phone }
            vouchers
            { id title description value pointsCost imageUrl }
        }
    }
`;

import { gql } from '@apollo/client';

export const GET_BOTTOM_MENU_IMAGES_QUERY = gql`
    query GetBottomMenuImages {
        bottomMenuImages {
            home
            award
            qrCode
            merchant
            user
        }
    }
`;

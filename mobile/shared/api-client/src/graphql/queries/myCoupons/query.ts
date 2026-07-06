import { gql } from '@apollo/client';

export const MY_COUPONS_QUERY = gql`
  query MyCoupons {
    myCoupons {
      id
      qrCode
      isUsed
      usedAt
      createdAt
      coupon {
        id
        code
        title
        description
        imageUrl
        couponType
        discountType
        discountValue
        validFrom
        validUntil
        merchant {
          id
          name
          logoUrl
        }
      }
    }
  }
`;
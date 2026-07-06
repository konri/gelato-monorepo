import { gql } from '@apollo/client';

export const CLAIM_COUPON_MUTATION = gql`
  mutation ClaimCoupon($couponId: String!) {
    claimCoupon(couponId: $couponId) {
      id
      qrCode
      isUsed
      createdAt
      coupon {
        id
        code
        title
        description
        imageUrl
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
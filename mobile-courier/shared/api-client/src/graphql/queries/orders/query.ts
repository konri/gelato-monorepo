import { gql } from '@apollo/client';

// The current user's orders (list view).
export const MY_ORDERS_QUERY = gql`
  query MyOrders {
    myOrders {
      id
      orderNumber
      status
      total
      createdAt
      deliveryAddress
      spot {
        id
        name
      }
      items {
        id
        quantity
      }
    }
  }
`;

// Single order with everything the tracking screen needs.
export const ORDER_DETAIL_QUERY = gql`
  query OrderDetail($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      status
      subtotal
      discount
      deliveryFee
      total
      paymentStatus
      deliveryAddress
      deliveryLatitude
      deliveryLongitude
      scheduledFor
      createdAt
      spot {
        id
        name
        address
        latitude
        longitude
        phone
        logoUrl
      }
      courierLocation {
        latitude
        longitude
        timestamp
      }
      items {
        id
        tasteId
        productId
        quantity
        pricePerUnit
        total
      }
    }
  }
`;

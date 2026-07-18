import { gql } from '@apollo/client';

// The current user's orders (list view).
export const MY_ORDERS_QUERY = gql`
  query MyOrders {
    myOrders {
      id
      orderNumber
      status
      fulfillmentType
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
      fulfillmentType
      subtotal
      discount
      deliveryFee
      total
      paymentStatus
      paymentMethod
      deliveryAddress
      deliveryLatitude
      deliveryLongitude
      scheduledFor
      createdAt
      courierName
      courierPhoto
      deliveryPin
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

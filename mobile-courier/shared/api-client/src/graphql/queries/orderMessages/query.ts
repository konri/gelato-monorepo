import { gql } from '@apollo/client';

const MESSAGE_FIELDS = `
  id
  orderId
  userId
  asSpotId
  asCourierId
  body
  senderName
  senderAvatar
  senderRole
  createdAt
`;

export const ORDER_MESSAGES_QUERY = gql`
  query OrderMessages($orderId: ID!) {
    orderMessages(orderId: $orderId) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const POST_ORDER_MESSAGE_MUTATION = gql`
  mutation PostOrderMessage($orderId: ID!, $body: String!) {
    postOrderMessage(orderId: $orderId, body: $body) {
      ${MESSAGE_FIELDS}
    }
  }
`;

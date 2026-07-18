import { gql } from '@apollo/client';

export const SPOT_COMPLAINTS_QUERY = gql`
  query SpotComplaints($spotId: ID!, $status: String) {
    spotComplaints(spotId: $spotId, status: $status) {
      id
      orderId
      orderNumber
      customerName
      subject
      message
      status
      resolution
      resolvedAt
      createdAt
    }
  }
`;

export const RESOLVE_COMPLAINT_MUTATION = gql`
  mutation ResolveComplaint($id: ID!, $resolution: String!) {
    resolveComplaint(id: $id, resolution: $resolution) {
      id
      status
    }
  }
`;

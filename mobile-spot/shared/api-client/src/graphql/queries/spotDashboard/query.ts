import { gql } from '@apollo/client';

export const SPOT_DASHBOARD_QUERY = gql`
  query SpotDashboard($spotId: ID!, $from: String!, $to: String!, $preparedById: ID) {
    spotDashboard(spotId: $spotId, from: $from, to: $to, preparedById: $preparedById) {
      revenue
      orders
      averageOrder
      byEmployee {
        preparedById
        name
        orders
        revenue
      }
      daily {
        date
        revenue
        orders
      }
    }
  }
`;

export const SPOT_EMPLOYEES_QUERY = gql`
  query SpotEmployeesForDashboard($spotId: ID!) {
    spotEmployees(spotId: $spotId) {
      id
      name
      firstName
      surname
      email
    }
  }
`;

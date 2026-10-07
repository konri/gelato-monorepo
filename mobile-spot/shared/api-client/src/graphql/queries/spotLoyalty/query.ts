import { gql } from '@apollo/client';

export const SPOT_POINT_TEMPLATES_QUERY = gql`
  query SpotPointTemplates($spotId: ID!) {
    spotPointTemplates(spotId: $spotId, includeInactive: true) {
      id
      spotId
      name
      nameLocal
      points
      isActive
    }
  }
`;

export const CREATE_POINT_TEMPLATE_MUTATION = gql`
  mutation CreatePointTemplate($spotId: ID!, $name: String!, $points: Int!) {
    createPointTemplate(spotId: $spotId, name: $name, points: $points) {
      id
    }
  }
`;

export const UPDATE_POINT_TEMPLATE_MUTATION = gql`
  mutation UpdatePointTemplate($id: ID!, $name: String, $points: Int, $isActive: Boolean) {
    updatePointTemplate(id: $id, name: $name, points: $points, isActive: $isActive) {
      id
    }
  }
`;

export const DELETE_POINT_TEMPLATE_MUTATION = gql`
  mutation DeletePointTemplate($id: ID!) {
    deletePointTemplate(id: $id)
  }
`;

export type SearchSuggestion = {
  name: string;
  mapbox_id: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
};

export type SearchSuggestResponse = {
  suggestions: SearchSuggestion[];
  attribution: string;
};

export type SearchRetrieveFeature = {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    name: string;
    mapbox_id: string;
    full_address?: string;
    place_formatted?: string;
    coordinates: {
      longitude: number;
      latitude: number;
    };
  };
};

export type SearchRetrieveResponse = {
  type: "FeatureCollection";
  features: SearchRetrieveFeature[];
  attribution: string;
};

export type MapboxLocationPickerProps = {
  onLocationSelect: (latitude: number, longitude: number) => void;
  initialLatitude?: number | string;
  initialLongitude?: number | string;
  label?: string;
  editable?: boolean;
};

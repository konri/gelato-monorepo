// Cities are meant to be defined in the admin panel. Until a `cities` query
// exists in the backend, we surface the seeded set from the project plan.
// TODO: replace with a GraphQL `cities` query once the endpoint is available.
export const AVAILABLE_CITIES = ['Warszawa', 'Kraków', 'Lwów'] as const;

export type City = (typeof AVAILABLE_CITIES)[number];

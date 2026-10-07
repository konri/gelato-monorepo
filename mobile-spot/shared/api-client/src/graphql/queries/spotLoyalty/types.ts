export type PointTemplate = {
  id: string;
  spotId: string;
  name: string;
  /** `{ pl, en, ua }` names (the admin panel may set them). */
  nameLocal?: Record<string, string | null | undefined> | null;
  points: number;
  isActive: boolean;
};

export type SpotPointTemplatesResponse = { spotPointTemplates: PointTemplate[] };

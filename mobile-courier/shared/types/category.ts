export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
  merchants: {
    id: string;
    name: string;
    iconUrl: string;
  }[];
};

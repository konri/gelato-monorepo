export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
};

export type GetCategoriesResponse = {
  getCategories: Category[];
};

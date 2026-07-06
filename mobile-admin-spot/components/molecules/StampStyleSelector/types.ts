import type { Category } from "@/shared/api-client/src/graphql/queries/categories";

export type StampStyleSelectorProps = {
  label: string;
  categories: Category[];
  disabled?: boolean;
  required?: boolean;
};

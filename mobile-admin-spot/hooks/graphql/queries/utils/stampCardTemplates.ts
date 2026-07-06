import type { StampCardTemplateDetails } from "@/shared/api-client/src/graphql/queries/stampCardTemplates";
import { resolveStampTemplateAwardConfig } from "@/utils/stampTemplateAward";

export type StampCardTemplateDetailsForEdit = StampCardTemplateDetails & {
  formAwardType: "visit" | "amount";
  formMinimumAmount: string;
};

export const normalizeTemplatesForEdit = (
  templates: StampCardTemplateDetails[]
): StampCardTemplateDetailsForEdit[] => {
  return templates.map((template) => {
    const award = resolveStampTemplateAwardConfig({
      awardType: template.awardType,
      minimumAmount: template.minimumAmount,
    });

    return {
      ...template,
      formAwardType: award.awardType,
      formMinimumAmount: award.minimumAmount,
    };
  });
};

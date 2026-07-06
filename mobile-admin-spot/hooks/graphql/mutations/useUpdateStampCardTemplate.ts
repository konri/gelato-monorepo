import {
  CreateStampCardTemplateInput,
  UPDATE_STAMP_CARD_TEMPLATE_MUTATION,
  UpdateStampCardTemplateResponse,
} from "@/shared/api-client/src/graphql/mutations/stampCardTemplate";
import { GET_MY_STAMP_CARD_TEMPLATES_QUERY } from "@/shared/api-client/src/graphql/queries/stampCardTemplates";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

type UpdateStampCardTemplateVariables = {
  data: CreateStampCardTemplateInput;
  id: string;
};

export const useUpdateStampCardTemplate = () => {
  return useMutationWithErrorHandling<
    UpdateStampCardTemplateResponse,
    UpdateStampCardTemplateVariables
  >(UPDATE_STAMP_CARD_TEMPLATE_MUTATION, {
    operationName: "UpdateStampCardTemplate",
    refetchQueries: [{ query: GET_MY_STAMP_CARD_TEMPLATES_QUERY }],
  });
};

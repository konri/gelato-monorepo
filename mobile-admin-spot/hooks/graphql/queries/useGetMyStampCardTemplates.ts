import {
  GET_MY_STAMP_CARD_TEMPLATES_DETAILS_QUERY,
  GET_MY_STAMP_CARD_TEMPLATES_QUERY,
  type StampCardTemplateDetails,
  GetMyStampCardTemplatesDetailsResponse,
  GetMyStampCardTemplatesResponse,
} from "@/shared/api-client/src/graphql/queries/stampCardTemplates";
import { useMemo } from "react";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

import { UseQueryOptions } from "./types";
import {
  normalizeTemplatesForEdit,
  type StampCardTemplateDetailsForEdit,
} from "./utils/stampCardTemplates";

export const useGetMyStampCardTemplates = (options?: UseQueryOptions) => {
  return useQueryWithErrorHandling<GetMyStampCardTemplatesResponse>(
    GET_MY_STAMP_CARD_TEMPLATES_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: options?.skip,
      operationName: "GetMyStampCardTemplates",
    }
  );
};

export const useGetMyStampCardTemplatesDetails = (options?: UseQueryOptions) => {
  const queryResult =
    useQueryWithErrorHandling<GetMyStampCardTemplatesDetailsResponse>(
    GET_MY_STAMP_CARD_TEMPLATES_DETAILS_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: options?.skip,
      operationName: "GetMyStampCardTemplatesDetails",
    }
  );

  const completeTemplates = useMemo<StampCardTemplateDetails[]>(
    () =>
      queryResult.dataState === "complete"
        ? queryResult.data?.myStampCardTemplates ?? []
        : [],
    [queryResult.data?.myStampCardTemplates, queryResult.dataState]
  );

  const normalizedTemplates = useMemo<StampCardTemplateDetailsForEdit[]>(
    () => normalizeTemplatesForEdit(completeTemplates),
    [completeTemplates]
  );

  return {
    ...queryResult,
    normalizedTemplates,
  };
};

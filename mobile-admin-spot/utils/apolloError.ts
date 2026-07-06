type TranslateFn = (key: string) => string;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const getFirstGraphQLErrorCode = (error: unknown): string | undefined => {
  if (!isRecord(error)) {
    return undefined;
  }

  const graphQLErrors = error.graphQLErrors;
  if (!Array.isArray(graphQLErrors) || graphQLErrors.length === 0) {
    return undefined;
  }

  const firstError = graphQLErrors[0];
  if (!isRecord(firstError) || typeof firstError.message !== "string") {
    return undefined;
  }

  return firstError.message;
};

export const getErrorMessage = (error: unknown): string | undefined => {
  if (!isRecord(error) || typeof error.message !== "string" || error.message.length === 0) {
    return undefined;
  }
  return error.message;
};

export const isAccessDeniedGraphQlMessage = (message: string): boolean => {
  const m = message.toLowerCase();
  return m.includes("access denied") || m.includes("don't have permission");
};

export const isAccessDeniedLikeError = (error: unknown): boolean => {
  const fromMessage = getErrorMessage(error);
  const fromGqlCode = getFirstGraphQLErrorCode(error);
  if (
    (fromMessage && isAccessDeniedGraphQlMessage(fromMessage)) ||
    (fromGqlCode && isAccessDeniedGraphQlMessage(fromGqlCode))
  ) {
    return true;
  }
  if (isRecord(error) && Array.isArray(error.graphQLErrors)) {
    for (const ge of error.graphQLErrors) {
      if (
        isRecord(ge) &&
        typeof ge.message === "string" &&
        isAccessDeniedGraphQlMessage(ge.message)
      ) {
        return true;
      }
    }
  }
  return false;
};

export const getMappedApolloErrorMessage = (
  error: unknown,
  t: TranslateFn,
  codeToTranslationKey: Record<string, string>,
  fallbackTranslationKey: string,
): string => {
  const graphQLErrorCode = getFirstGraphQLErrorCode(error);
  if (graphQLErrorCode) {
    const translationKey = codeToTranslationKey[graphQLErrorCode];
    if (translationKey) {
      return t(translationKey);
    }
  }

  const message = getErrorMessage(error);
  if (message) {
    return message;
  }

  return t(fallbackTranslationKey);
};

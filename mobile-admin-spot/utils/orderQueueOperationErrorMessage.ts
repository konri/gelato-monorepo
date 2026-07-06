import { getErrorMessage, getFirstGraphQLErrorCode } from "@/utils/apolloError";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const BACKEND_MESSAGE_TO_I18N_KEY: Record<string, string> = {
  "too many active orders": "OrderQueue.errorTooManyActiveOrders",
};

const collectGraphQlMessages = (error: unknown): string[] => {
  const out: string[] = [];
  const first = getFirstGraphQLErrorCode(error);
  if (first) {
    out.push(first);
  }
  if (isRecord(error) && Array.isArray(error.graphQLErrors)) {
    for (const ge of error.graphQLErrors) {
      if (isRecord(ge) && typeof ge.message === "string") {
        out.push(ge.message);
      }
    }
  }
  return out;
};

export const resolveOrderQueueOperationErrorMessage = (
  error: unknown,
  t: (key: string) => string,
): string => {
  for (const raw of collectGraphQlMessages(error)) {
    const key = BACKEND_MESSAGE_TO_I18N_KEY[raw.trim().toLowerCase()];
    if (key) {
      return t(key);
    }
  }
  const top = getErrorMessage(error);
  if (top) {
    const key = BACKEND_MESSAGE_TO_I18N_KEY[top.trim().toLowerCase()];
    if (key) {
      return t(key);
    }
    return top;
  }
  return t("Common.somethingWentWrong");
};

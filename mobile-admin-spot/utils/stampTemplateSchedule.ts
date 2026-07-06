import type { TFunction } from "i18next";

export type StampTemplateScheduleRow = {
  isActive: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
};

export function isStampTemplateEarnableNow(
  template: StampTemplateScheduleRow,
  referenceMs: number = Date.now(),
): boolean {
  if (!template.isActive) {
    return false;
  }
  if (template.validFrom) {
    const fromMs = new Date(template.validFrom).getTime();
    if (Number.isFinite(fromMs) && referenceMs < fromMs) {
      return false;
    }
  }
  if (template.validUntil) {
    const untilMs = new Date(template.validUntil).getTime();
    if (Number.isFinite(untilMs) && referenceMs > untilMs) {
      return false;
    }
  }
  return true;
}

export type StampTemplatePreviewScheduleInput = {
  isActive?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
};

export type StampTemplatePreviewScheduleStatus =
  | "inactive"
  | "not_yet_active"
  | "expired";

export function getStampTemplatePreviewScheduleStatus(
  input: StampTemplatePreviewScheduleInput,
  referenceMs: number = Date.now(),
): StampTemplatePreviewScheduleStatus | null {
  if (input.isActive === false) {
    return "inactive";
  }
  if (input.validFrom) {
    const fromMs = new Date(input.validFrom).getTime();
    if (Number.isFinite(fromMs) && referenceMs < fromMs) {
      return "not_yet_active";
    }
  }
  if (input.validUntil) {
    const untilMs = new Date(input.validUntil).getTime();
    if (Number.isFinite(untilMs) && referenceMs > untilMs) {
      return "expired";
    }
  }
  return null;
}

export function getStampTemplatePreviewScheduleMessage(
  t: TFunction,
  input: StampTemplatePreviewScheduleInput,
  referenceMs: number = Date.now(),
): string | null {
  const status = getStampTemplatePreviewScheduleStatus(input, referenceMs);
  if (!status) {
    return null;
  }
  if (status === "inactive") {
    return t("Loyalty.stampTemplatePreviewInactive");
  }
  if (status === "not_yet_active") {
    return t("Loyalty.stampTemplatePreviewNotYetActive");
  }
  return t("Loyalty.stampTemplatePreviewExpired");
}

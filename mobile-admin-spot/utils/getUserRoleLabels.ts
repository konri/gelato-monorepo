import type { TFunction } from "i18next";

const KNOWN_ORDER = ["OWNER", "CLIENT", "ADMIN", "NEW_USER", "OPERATOR"] as const;

const humanizeRoleCode = (role: string) =>
  role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const orderIndex = (role: string) => {
  const i = (KNOWN_ORDER as readonly string[]).indexOf(role);
  return i === -1 ? KNOWN_ORDER.length : i;
};

const translateRole = (role: string, t: TFunction) => {
  const key = `AccountHub.role_${role}`;
  const direct = t(key, { defaultValue: "" });
  if (direct) {
    return direct;
  }
  return t("AccountHub.roleOther", { role: humanizeRoleCode(role) });
};

export const getDistinctUserRoleLabels = (
  roles: string[] | undefined,
  t: TFunction,
): string[] => {
  if (!roles?.length) {
    return [];
  }

  const distinct = [
    ...new Set(roles.map((r) => r.trim().toUpperCase()).filter(Boolean)),
  ];

  distinct.sort((a, b) => {
    const d = orderIndex(a) - orderIndex(b);
    return d !== 0 ? d : a.localeCompare(b);
  });

  return distinct.map((role) => translateRole(role, t));
};

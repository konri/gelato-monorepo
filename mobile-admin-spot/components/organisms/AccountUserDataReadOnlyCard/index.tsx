import { Typography } from "@/components/atoms/Typography";
import { SettingsReadOnlySection } from "@/components/molecules/SettingsReadOnlySection";
import type { SettingsReadOnlySectionRow } from "@/components/molecules/SettingsReadOnlySection/types";
import { SettingsSectionCard } from "@/components/molecules/SettingsSectionCard";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { AccountUserDataReadOnlyCardProps } from "./types";

const dash = "—";

const displayOrDash = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : dash;
};

export const AccountUserDataReadOnlyCard = ({
  user,
  merchants,
  roleLabels,
}: AccountUserDataReadOnlyCardProps) => {
  const { t } = useTranslation();

  const rows = useMemo((): SettingsReadOnlySectionRow[] => {
    const baseRows: SettingsReadOnlySectionRow[] = [
      {
        id: "firstName",
        label: t("AccountHub.fieldFirstName"),
        value: displayOrDash(user.firstName),
      },
      {
        id: "surname",
        label: t("AccountHub.fieldSurname"),
        value: displayOrDash(user.surname),
      },
      {
        id: "phone",
        label: t("AccountHub.fieldPhone"),
        value: displayOrDash(user.phone),
      },
      {
        id: "birthDate",
        label: t("AccountHub.fieldBirthDate"),
        value: displayOrDash(user.birthDate),
      },
      {
        id: "email",
        label: t("AccountHub.fieldEmail"),
        value: user.email ?? dash,
      },
    ];

    const roleRow: SettingsReadOnlySectionRow =
      roleLabels.length === 0
        ? {
            id: "role",
            label: t("AccountHub.fieldRole"),
            value: dash,
          }
        : {
            id: "role",
            label: t("AccountHub.fieldRole"),
            children: (
              <View className="gap-1.5">
                {roleLabels.map((label, index) => (
                  <View key={`${index}-${label}`} className="flex-row gap-2 items-start">
                    <Typography
                      variant="text-16-regular"
                      className="text-gray-400 font-normal leading-6"
                    >
                      ·
                    </Typography>
                    <Typography
                      variant="text-16-regular"
                      className="text-gray-900 flex-1 font-normal"
                    >
                      {label}
                    </Typography>
                  </View>
                ))}
              </View>
            ),
          };

    const companiesRow: SettingsReadOnlySectionRow =
      merchants.length === 0
        ? {
            id: "companies",
            label: t("AccountHub.companiesHeading"),
            value: t("AccountHub.noCompanies"),
            valueTone: "muted",
            className: "pb-4",
          }
        : {
            id: "companies",
            label: t("AccountHub.companiesHeading"),
            className: "pb-4",
            children: (
              <View className="gap-1.5">
                {merchants.map((m, index) => (
                  <Typography
                    key={m.id ?? `merchant-${index}`}
                    variant="text-16-regular"
                    className="text-gray-900 font-normal"
                  >
                    {m.name ?? ""}
                  </Typography>
                ))}
              </View>
            ),
          };

    return [...baseRows, roleRow, companiesRow];
  }, [user, merchants, roleLabels, t]);

  const header = (
    <Typography variant="text-14-regular-spaced" className="text-gray-600 font-normal">
      {t("AccountHub.userDataHint")}
    </Typography>
  );

  return (
    <SettingsSectionCard>
      <SettingsReadOnlySection header={header} rows={rows} />
    </SettingsSectionCard>
  );
};

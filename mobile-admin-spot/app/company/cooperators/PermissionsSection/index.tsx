import { Typography } from "@/components/atoms/Typography";
import { OperatorPermissionMatrix } from "@/components/molecules/OperatorPermissionMatrix";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { PermissionsSectionProps } from "./types";

export const PermissionsSection = ({
  selectedPermissions,
  onToggle,
}: PermissionsSectionProps) => {
  const { t } = useTranslation();

  return (
    <OperatorPermissionMatrix
      mode="editable"
      selectedPermissions={selectedPermissions}
      onToggle={onToggle}
      intro={
        <View className="gap-1">
          <Typography variant="text-14-bold" className="text-black">
            {t("Cooperators.permissions")}
          </Typography>
          <Typography variant="text-12-regular" className="text-gray-600">
            {t("Cooperators.permissionsTableHint")}
          </Typography>
        </View>
      }
    />
  );
};

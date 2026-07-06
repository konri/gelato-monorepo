import { Checkbox } from "@/components/atoms/Checkbox";
import { Typography } from "@/components/atoms/Typography";
import { PERMISSION_MATRIX_ROWS } from "@/app/company/cooperators/constants";
import { OPERATOR_PERMISSION_LABEL_KEYS } from "@/constants/operatorPermissions";
import type { OperatorPermission } from "@/shared/api-client/src/graphql/types/operatorAccess";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { OperatorPermissionMatrixProps } from "./types";

const COLUMN_KEYS = ["read", "global", "override"] as const;

type MatrixColumnKey = (typeof COLUMN_KEYS)[number];

const COLUMN_CONFIG: Record<
  MatrixColumnKey,
  {
    headerKey: string;
    getPermission: (row: (typeof PERMISSION_MATRIX_ROWS)[number]) => OperatorPermission | undefined;
  }
> = {
  read: {
    headerKey: "Cooperators.permissionsColumnRead",
    getPermission: (row) => row.readPermission,
  },
  global: {
    headerKey: "Cooperators.permissionsColumnGlobal",
    getPermission: (row) => row.globalPermission,
  },
  override: {
    headerKey: "Cooperators.permissionsColumnOverride",
    getPermission: (row) => row.overridePermission,
  },
};

type MatrixCellProps =
  | {
      mode: "readOnly";
      granted: readonly OperatorPermission[];
      permission: OperatorPermission | undefined;
    }
  | {
      mode: "editable";
      selectedPermissions: OperatorPermission[];
      onToggle: (permission: OperatorPermission) => void;
      permission: OperatorPermission | undefined;
    };

const MatrixCell = (props: MatrixCellProps) => {
  const { t } = useTranslation();
  const { permission } = props;

  if (!permission) {
    return (
      <View className="h-6 w-6 items-center justify-center">
        <Typography variant="text-14-regular-spaced" className="text-gray-400">
          -
        </Typography>
      </View>
    );
  }

  if (props.mode === "readOnly") {
    const checked = props.granted.includes(permission);
    return (
      <Checkbox
        checked={checked}
        onToggle={() => {}}
        disabled
        variant="cell"
        accessibilityLabel={t(OPERATOR_PERMISSION_LABEL_KEYS[permission])}
      />
    );
  }

  const checked = props.selectedPermissions.includes(permission);
  return (
    <Checkbox
      checked={checked}
      onToggle={() => props.onToggle(permission)}
      variant="cell"
      accessibilityLabel={t(OPERATOR_PERMISSION_LABEL_KEYS[permission])}
    />
  );
};

export const OperatorPermissionMatrix = (props: OperatorPermissionMatrixProps) => {
  const { t } = useTranslation();
  const { intro } = props;

  return (
    <View className="gap-3">
      {intro}
      <View className="flex-row flex-wrap items-center gap-3 rounded-lg bg-gray-100 px-3 py-2">
        <Typography variant="text-12-regular" className="text-gray-700">
          {t("Cooperators.permissionsLegendRead")}
        </Typography>
        <Typography variant="text-12-regular" className="text-gray-700">
          {t("Cooperators.permissionsLegendGlobal")}
        </Typography>
        <Typography variant="text-12-regular" className="text-gray-700">
          {t("Cooperators.permissionsLegendOverride")}
        </Typography>
      </View>

      <View className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <View className="flex-row items-center bg-gray-100 px-3 py-2.5">
          <View className="flex-1">
            <Typography variant="text-12-bold" className="text-gray-700">
              {t("Cooperators.permissionsColumnFeature")}
            </Typography>
          </View>
          {COLUMN_KEYS.map((key) => (
            <View key={key} className="w-10 items-center">
              <Typography variant="text-12-bold" className="text-gray-700">
                {t(COLUMN_CONFIG[key].headerKey)}
              </Typography>
            </View>
          ))}
        </View>

        {PERMISSION_MATRIX_ROWS.map((row) => (
          <View
            key={row.featureLabelKey}
            className="flex-row items-center border-t border-gray-100 px-3 py-2.5"
          >
            <View className="flex-1 pr-2">
              <Typography variant="text-14-regular-spaced" className="text-black">
                {t(row.featureLabelKey)}
              </Typography>
            </View>
            {COLUMN_KEYS.map((key) => {
              const permission = COLUMN_CONFIG[key].getPermission(row);
              return (
                <View key={key} className="w-10 items-center">
                  {props.mode === "readOnly" ? (
                    <MatrixCell
                      mode="readOnly"
                      granted={props.granted}
                      permission={permission}
                    />
                  ) : (
                    <MatrixCell
                      mode="editable"
                      selectedPermissions={props.selectedPermissions}
                      onToggle={props.onToggle}
                      permission={permission}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

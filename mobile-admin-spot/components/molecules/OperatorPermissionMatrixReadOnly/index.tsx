import { Typography } from "@/components/atoms/Typography";
import { OperatorPermissionMatrix } from "@/components/molecules/OperatorPermissionMatrix";
import React from "react";
import { useTranslation } from "react-i18next";
import type { OperatorPermissionMatrixReadOnlyProps } from "./types";

export const OperatorPermissionMatrixReadOnly = ({
  permissions,
}: OperatorPermissionMatrixReadOnlyProps) => {
  const { t } = useTranslation();

  return (
    <OperatorPermissionMatrix
      mode="readOnly"
      granted={permissions}
      intro={
        <Typography variant="text-12-regular" className="text-gray-600">
          {t("AccountHub.operatorMatrixReadOnlyHint")}
        </Typography>
      }
    />
  );
};

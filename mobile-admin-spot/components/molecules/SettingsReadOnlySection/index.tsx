import { SettingsReadOnlyFieldRow } from "@/components/molecules/SettingsReadOnlyFieldRow";
import React from "react";
import { View } from "react-native";
import type { SettingsReadOnlySectionProps } from "./types";

export const SettingsReadOnlySection = ({ header, rows }: SettingsReadOnlySectionProps) => (
  <>
    {header ? (
      <>
        <View className="px-4 pt-4 pb-3">{header}</View>
        <View className="h-px bg-gray-50-light mx-4" />
      </>
    ) : null}
    {rows.map((row, index) => (
      <React.Fragment key={row.id}>
        {index > 0 ? <View className="h-px bg-gray-50-light mx-4" /> : null}
        {"children" in row ? (
          <SettingsReadOnlyFieldRow label={row.label} className={row.className}>
            {row.children}
          </SettingsReadOnlyFieldRow>
        ) : (
          <SettingsReadOnlyFieldRow
            label={row.label}
            value={row.value}
            valueTone={row.valueTone}
            className={row.className}
          />
        )}
      </React.Fragment>
    ))}
  </>
);

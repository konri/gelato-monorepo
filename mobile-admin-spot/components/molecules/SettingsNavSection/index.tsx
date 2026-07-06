import { SettingsNavRow } from "@/components/molecules/SettingsNavRow";
import { SettingsSectionCard } from "@/components/molecules/SettingsSectionCard";
import { SettingsSectionHeading } from "@/components/molecules/SettingsSectionHeading";
import React from "react";
import { View } from "react-native";
import type { SettingsNavSectionProps } from "./types";

export const SettingsNavSection = ({
  title,
  items,
  headingClassName,
  hideHeading = false,
  wrapInCard = true,
  cardFooter,
}: SettingsNavSectionProps) => (
  <>
    {!hideHeading ? (
      <SettingsSectionHeading title={title} className={headingClassName} />
    ) : null}
    {wrapInCard ? (
      <SettingsSectionCard>
        {items.map((item, index) => (
          <SettingsNavRow
            key={`${title}-${index}`}
            title={item.title}
            onPress={item.onPress}
            leftIcon={item.leftIcon}
            trailingLabel={item.trailingLabel}
            variant={item.variant}
            showDivider={index < items.length - 1}
          />
        ))}
        {cardFooter ? (
          <>
            <View className="h-px bg-gray-lighter" />
            {cardFooter}
          </>
        ) : null}
      </SettingsSectionCard>
    ) : (
      <>
        {items.map((item, index) => (
          <SettingsNavRow
            key={`${title}-${index}`}
            title={item.title}
            onPress={item.onPress}
            leftIcon={item.leftIcon}
            trailingLabel={item.trailingLabel}
            variant={item.variant}
            showDivider={index < items.length - 1}
          />
        ))}
        {cardFooter ? (
          <>
            <View className="h-px bg-gray-lighter" />
            {cardFooter}
          </>
        ) : null}
      </>
    )}
  </>
);

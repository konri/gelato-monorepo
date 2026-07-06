import { Typography } from "@/components/atoms/Typography";
import type { StampCardFormData } from "@/components/organisms/StampCardPreview/types";
import type { Category } from "@/shared/api-client/src/graphql/queries/categories";
import { getFullApiUrl } from "@/utils/urlUtils";
import React, { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SvgUri } from "react-native-svg";
import { twMerge } from "tailwind-merge";
import type { StampStyleSelectorProps } from "./types";

type StampStyleListProps = {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  categories: Category[];
  disabled: boolean;
};

type StampIconProps = {
  url: string;
  isSelected: boolean;
  onPress: () => void;
  categoryName: string;
};

const StampIcon = ({
  url,
  isSelected,
  onPress,
  categoryName,
}: StampIconProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <Pressable onPress={onPress} className="items-center justify-center">
      <View
        className={twMerge(
          "w-16 h-16 items-center justify-center rounded-full",
          isSelected && "bg-blue-400",
        )}
        style={isSelected ? styles.selected : styles.unselected}
      >
        {loading && !error && (
          <ActivityIndicator
            size="small"
            color="#1e3a8a"
            className="absolute"
          />
        )}
        {error ? (
          <Typography
            variant="text-12-regular"
            className="text-gray-500 text-center px-1"
          >
            {categoryName.slice(0, 3)}
          </Typography>
        ) : (
          <SvgUri
            uri={url}
            width={56}
            height={56}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </View>
    </Pressable>
  );
};

const StampStyleList = ({
  label,
  value,
  onChange,
  categories,
  disabled,
}: StampStyleListProps) => {
  const categoriesWithIcons = categories.filter((category) => category.iconUrl);

  const itemWidth = 64;
  const itemSpacing = 1;

  return (
    <View className="gap-4">
      <Typography variant="text-14-regular-spaced" className="text-black">
        {label}
      </Typography>
      <FlatList
        data={categoriesWithIcons}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item: category }) => {
          const fullIconUrl = getFullApiUrl(category.iconUrl);
          if (!fullIconUrl) {
            return null;
          }
          const isSelected =
            (!!value && value === fullIconUrl) ||
            (!!value && value === category.iconUrl);
          return (
            <View
              style={{
                width: itemWidth,
                marginRight: itemSpacing,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StampIcon
                url={fullIconUrl}
                isSelected={isSelected}
                onPress={() => {
                  if (disabled) {
                    return;
                  }
                  onChange(fullIconUrl);
                }}
                categoryName={category.name}
              />
            </View>
          );
        }}
        decelerationRate="normal"
        pagingEnabled={false}
      />
    </View>
  );
};

export const StampStyleSelector = ({
  label,
  categories,
  disabled = false,
  required = true,
}: StampStyleSelectorProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext<StampCardFormData>();

  return (
    <Controller
      name="stampStyle"
      control={control}
      rules={
        required
          ? {
              validate: (v: string | undefined) => {
                if (v == null || String(v).trim() === "") {
                  return t("Validation.fieldRequired");
                }
                return true;
              },
            }
          : undefined
      }
      render={({ field, fieldState }) => (
        <View className="gap-1">
          <StampStyleList
            label={label}
            value={field.value}
            onChange={field.onChange}
            categories={categories}
            disabled={disabled}
          />
          {fieldState.error?.message ? (
            <Typography variant="text-12-regular" className="text-red-500">
              {fieldState.error.message}
            </Typography>
          ) : null}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  selected: {
    shadowColor: "#1A4196",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  unselected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

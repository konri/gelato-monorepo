import { FormInput } from "@/components/atoms/FormInput";
import { Typography } from "@/components/atoms/Typography";
import { useSearchUsersByEmail } from "@/hooks/graphql/queries/useSearchUsersByEmail";
import type { CouponFormData } from "@/utils/couponForm";
import React, { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";
import type { CouponAssignUserFieldProps } from "./types";

type UserSuggestion = {
  id: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  surname?: string | null;
};

type UserSuggestionItemProps = {
  user: UserSuggestion;
  disabled: boolean;
  onSelect: (user: UserSuggestion) => void;
};

const UserSuggestionItem = ({
  user,
  disabled,
  onSelect,
}: UserSuggestionItemProps) => {
  const displayName =
    user.name ||
    [user.firstName, user.surname]
      .filter((value) => Boolean(value))
      .join(" ");

  return (
    <Pressable
      className="px-4 py-3 border-b border-gray-100 last:border-b-0"
      disabled={disabled}
      onPress={() => onSelect(user)}
    >
      <Typography variant="text-14-regular-spaced" className="text-black">
        {user.email}
      </Typography>
      {!!displayName && (
        <Typography variant="text-12-regular" className="text-black-47">
          {displayName}
        </Typography>
      )}
    </Pressable>
  );
};

export const CouponAssignUserField = ({
  disabled = false,
}: CouponAssignUserFieldProps) => {
  const { t } = useTranslation();
  const form = useFormContext<CouponFormData>();
  const [assignToUserId, assignToUserEmail] = useWatch({
    control: form.control,
    name: ["assignToUserId", "assignToUserEmail"],
  });
  const [debouncedAssignToUserEmail, setDebouncedAssignToUserEmail] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedAssignToUserEmail((assignToUserEmail ?? "").trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [assignToUserEmail]);

  const normalizedSearch = useMemo(
    () => debouncedAssignToUserEmail.trim(),
    [debouncedAssignToUserEmail],
  );
  const shouldSearchUsers = normalizedSearch.length >= 3 && !assignToUserId;
  const { data: userSearchData, loading: isUserSearchLoading } =
    useSearchUsersByEmail({
      email: normalizedSearch,
      skip: !shouldSearchUsers,
    });
  const userSuggestions = (userSearchData?.searchUsersByEmail ?? []).filter(
    (user): user is UserSuggestion => Boolean(user?.id && user?.email),
  );

  return (
    <View className="gap-2">
      <FormInput
        name="assignToUserEmail"
        label={t("Coupon.assignToUserId")}
        placeholder={t("Coupon.assignToUserIdPlaceholder")}
        type="email"
        variant="compact"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        helperText={t("Coupon.assignToUserIdHelper")}
        editable={!disabled}
        onChangeText={() => {
          if (assignToUserId) {
            form.setValue("assignToUserId", undefined, { shouldDirty: true });
          }
        }}
      />
      {shouldSearchUsers && (
        <View className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
          {isUserSearchLoading ? (
            <View className="py-3 items-center justify-center">
              <ActivityIndicator size="small" color="#1A4196" />
            </View>
          ) : userSuggestions.length > 0 ? (
            userSuggestions.map((user) => (
              <UserSuggestionItem
                key={user.id}
                user={user}
                disabled={disabled}
                onSelect={(selectedUser) => {
                  form.setValue("assignToUserId", selectedUser.id, {
                    shouldDirty: true,
                  });
                  form.setValue("assignToUserEmail", selectedUser.email, {
                    shouldDirty: true,
                  });
                }}
              />
            ))
          ) : (
            <Typography variant="text-12-regular" className="px-4 py-3 text-black-47">
              {t("Coupon.assignToUserNoResults")}
            </Typography>
          )}
        </View>
      )}
    </View>
  );
};

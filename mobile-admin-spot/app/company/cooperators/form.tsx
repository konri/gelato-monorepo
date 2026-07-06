import { Button } from "@/components/atoms/Button";
import { FormInput } from "@/components/atoms/FormInput";
import { Select } from "@/components/atoms/Select";
import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { DeleteButton } from "@/components/molecules/DeleteButton";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import { useCreateCooperatorInvitation } from "@/hooks/graphql/mutations/useCreateCooperatorInvitation";
import { useDeleteCooperatorFromCompany } from "@/hooks/graphql/mutations/useDeleteCooperatorFromCompany";
import { useUpdateCooperatorAccess } from "@/hooks/graphql/mutations/useUpdateCooperatorAccess";
import { useMyCooperators } from "@/hooks/graphql/queries/useMyCooperators";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import type {
  AccessScopeMode,
  OperatorPermission,
} from "@/shared/api-client/src/graphql/types/operatorAccess";
import type { MyCooperator } from "@/shared/api-client/src/graphql/queries/myCooperators";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";
import {
  DEFAULT_ACCESS_CONFIG,
  sanitizeCooperatorPermissions,
  SCOPE_OPTIONS,
} from "./constants";
import { PermissionsSection } from "./PermissionsSection";
import { OperatorStoreScopePanel } from "@/components/molecules/OperatorStoreScopePanel";
import type { AccessConfigState } from "./types";
import { buildStoreIds } from "./utils";

type InvitationFormValues = {
  email: string;
};

export default function CooperatorAccessFormScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    mode?: string;
    cooperatorId?: string;
  }>();
  const mode = params.mode === "edit" ? "edit" : "create";
  const cooperatorId =
    typeof params.cooperatorId === "string" ? params.cooperatorId : "";

  const { availableStores } = useOperatorAccess();
  const invitationForm = useForm<InvitationFormValues>({
    defaultValues: { email: "" },
  });
  const [accessConfig, setAccessConfig] =
    useState<AccessConfigState>(DEFAULT_ACCESS_CONFIG);
  const [didPrefill, setDidPrefill] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [createInvitation, { loading: creatingInvitation }] =
    useCreateCooperatorInvitation();
  const [deleteCooperatorFromCompany, { loading: deletingCooperator }] =
    useDeleteCooperatorFromCompany();
  const [updateCooperatorAccess, { loading: updatingAccess }] =
    useUpdateCooperatorAccess();
  const { data: cooperatorsData, loading: loadingCooperators } =
    useMyCooperators({ skip: mode !== "edit" });

  const cooperators = useMemo(
    () =>
      (cooperatorsData?.myCooperators ?? []).filter(
        (cooperator): cooperator is MyCooperator =>
          typeof cooperator?.id === "string" &&
          typeof cooperator?.scopeMode === "string" &&
          Array.isArray(cooperator?.permissions) &&
          typeof cooperator?.storeScopeAll === "boolean" &&
          Array.isArray(cooperator?.storeIds) &&
          typeof cooperator?.cooperator?.id === "string" &&
          typeof cooperator?.cooperator?.user?.email === "string",
      ),
    [cooperatorsData?.myCooperators],
  );
  const selectedCooperator = useMemo(
    () =>
      cooperators.find(
        (cooperator) => cooperator.cooperator.id === cooperatorId,
      ) ?? null,
    [cooperators, cooperatorId],
  );
  const selectedCooperatorEmail =
    selectedCooperator?.cooperator?.user?.email ?? "";

  useEffect(() => {
    if (mode !== "edit" || !selectedCooperator || didPrefill) return;
    setAccessConfig({
      scopeMode: selectedCooperator.scopeMode,
      selectedPermissions: sanitizeCooperatorPermissions(
        selectedCooperator.permissions,
      ),
      storeScopeAll: selectedCooperator.storeScopeAll,
      selectedStoreIds:
        selectedCooperator.scopeMode === "STORE_SCOPED" &&
        !selectedCooperator.storeScopeAll
          ? selectedCooperator.storeIds
          : [],
    });
    setDidPrefill(true);
  }, [didPrefill, mode, selectedCooperator]);

  const togglePermission = (permission: OperatorPermission) => {
    setAccessConfig((previous) => ({
      ...previous,
      selectedPermissions: previous.selectedPermissions.includes(permission)
        ? previous.selectedPermissions.filter((item) => item !== permission)
        : [...previous.selectedPermissions, permission],
    }));
  };

  const toggleStoreId = (storeId: string) => {
    setAccessConfig((previous) => ({
      ...previous,
      selectedStoreIds: previous.selectedStoreIds.includes(storeId)
        ? previous.selectedStoreIds.filter((item) => item !== storeId)
        : [...previous.selectedStoreIds, storeId],
    }));
  };

  const handleScopeChange = (value: AccessScopeMode) => {
    setAccessConfig((previous) => ({
      ...previous,
      scopeMode: value,
      storeScopeAll: value === "FULL_MERCHANT" ? true : previous.storeScopeAll,
      selectedStoreIds:
        value === "FULL_MERCHANT" ? [] : previous.selectedStoreIds,
    }));
  };

  const canSubmitAccessConfig = useMemo(() => {
    const hasPermissions = accessConfig.selectedPermissions.length > 0;
    const hasStoreSelection =
      accessConfig.scopeMode !== "STORE_SCOPED" ||
      accessConfig.storeScopeAll ||
      accessConfig.selectedStoreIds.length > 0;
    return hasPermissions && hasStoreSelection;
  }, [accessConfig]);

  const handleCreateInvitation = invitationForm.handleSubmit(async (values) => {
    if (!canSubmitAccessConfig) {
      Alert.alert(t("Common.error"), t("Cooperators.validationSelectRequired"));
      return;
    }
    await createInvitation({
      variables: {
        data: {
          email: values.email.trim().toLowerCase(),
          scopeMode: accessConfig.scopeMode,
          permissions: sanitizeCooperatorPermissions(
            accessConfig.selectedPermissions,
          ),
          storeScopeAll: accessConfig.storeScopeAll,
          storeIds: buildStoreIds(accessConfig),
          expiresInHours: 72,
        },
      },
    });
    router.back();
  });

  const handleUpdateAccess = async () => {
    if (!cooperatorId || !canSubmitAccessConfig) return;
    await updateCooperatorAccess({
      variables: {
        data: {
          cooperatorId,
          scopeMode: accessConfig.scopeMode,
          permissions: sanitizeCooperatorPermissions(
            accessConfig.selectedPermissions,
          ),
          storeScopeAll: accessConfig.storeScopeAll,
          storeIds: buildStoreIds(accessConfig),
        },
      },
    });
    router.back();
  };

  const handleDeleteCooperator = async () => {
    if (!cooperatorId) return;
    try {
      await deleteCooperatorFromCompany({
        variables: { cooperatorId },
      });
      setIsDeleteModalOpen(false);
      router.back();
    } catch {
      setIsDeleteModalOpen(false);
      Alert.alert(t("Common.error"), t("Cooperators.deleteCooperatorError"));
    }
  };

  if (mode === "edit" && loadingCooperators) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4196" />
      </View>
    );
  }

  if (mode === "edit" && !selectedCooperator) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50-light px-6 gap-4">
        <Typography variant="text-16-bold" className="text-black text-center">
          {t("Cooperators.cooperatorNotFound")}
        </Typography>
        <Button title={t("Common.back")} onPress={() => router.back()} />
      </View>
    );
  }

  const isSubmitting = creatingInvitation || updatingAccess || deletingCooperator;
  const createEmail = invitationForm.watch("email").trim();
  const canSubmit =
    canSubmitAccessConfig &&
    (mode === "edit" || createEmail.length > 0) &&
    !isSubmitting;

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-gray-50-light"
      contentContainerClassName="p-6 gap-4"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between">
        <Typography variant="text-20-bold" className="text-black">
          {mode === "edit"
            ? t("Cooperators.editCooperatorAccessTitle")
            : t("Cooperators.inviteCooperator")}
        </Typography>
        {mode === "edit" && selectedCooperator && (
          <DeleteButton
            onPress={() => setIsDeleteModalOpen(true)}
            disabled={isSubmitting}
          />
        )}
      </View>

      {mode === "edit" && selectedCooperator && (
        <View className="bg-white rounded-2xl px-4 py-3">
          <Typography variant="text-12-regular" className="text-gray-500">
            {t("Cooperators.cooperatorLabel")}
          </Typography>
          <Typography variant="text-14-bold" className="text-black">
            {selectedCooperatorEmail}
          </Typography>
        </View>
      )}

      {mode === "create" && (
        <View className="bg-white rounded-2xl p-4">
          <FormProvider {...invitationForm}>
            <FormInput
              name="email"
              label={t("Cooperators.email")}
              placeholder={t("Cooperators.emailPlaceholder")}
              required
              variant="compact"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </FormProvider>
        </View>
      )}

      <Select
        label={t("Cooperators.scopeMode")}
        placeholder={t("Cooperators.selectScope")}
        value={accessConfig.scopeMode}
        options={SCOPE_OPTIONS.map((option) => ({
          label: t(option.labelKey),
          value: option.value,
        }))}
        onChange={handleScopeChange}
        variant="compact"
      />

      <PermissionsSection
        selectedPermissions={accessConfig.selectedPermissions}
        onToggle={togglePermission}
      />

      {accessConfig.scopeMode === "STORE_SCOPED" && (
        <OperatorStoreScopePanel
          mode="editable"
          storeScopeAll={accessConfig.storeScopeAll}
          selectedStoreIds={accessConfig.selectedStoreIds}
          availableStores={availableStores}
          onToggleStoreScopeAll={() =>
            setAccessConfig((previous) => ({
              ...previous,
              storeScopeAll: !previous.storeScopeAll,
            }))
          }
          onToggleStoreId={toggleStoreId}
        />
      )}

      <ActionButtons
        onSubmit={
          mode === "edit" ? handleUpdateAccess : handleCreateInvitation
        }
        onCancel={() => router.back()}
        submitButtonText={
          mode === "edit"
            ? t("Cooperators.updateAccess")
            : t("Cooperators.sendInvitation")
        }
        cancelButtonText={t("Common.cancel")}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
      />

      <ConfirmModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCooperator}
        title={t("Cooperators.deleteCooperatorTitle")}
        message={t("Cooperators.deleteCooperatorConfirmation", {
          email: selectedCooperatorEmail,
        })}
        confirmText={t("Common.delete")}
        cancelText={t("Common.cancel")}
        confirmVariant="danger"
        isLoading={deletingCooperator}
      />
    </KeyboardAwareScrollView>
  );
}

import { Button } from "@/components/atoms/Button";
import { CircularIconButton } from "@/components/atoms/CircularIconButton";
import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { DeleteButton } from "@/components/molecules/DeleteButton";
import { SCOPE_MODE_LABEL_KEYS } from "@/constants/operatorPermissions";
import { shadows } from "@/constants/shadows";
import { useDeleteCooperatorFromCompany } from "@/hooks/graphql/mutations/useDeleteCooperatorFromCompany";
import { useRevokeCooperatorInvitation } from "@/hooks/graphql/mutations/useRevokeCooperatorInvitation";
import { useMyCooperatorInvitations } from "@/hooks/graphql/queries/useMyCooperatorInvitations";
import { useMyCooperators } from "@/hooks/graphql/queries/useMyCooperators";
import type {
  CooperatorInvitation,
  CooperatorInvitationStatus,
} from "@/shared/api-client/src/graphql/queries/cooperatorInvitations";
import type { MyCooperator } from "@/shared/api-client/src/graphql/queries/myCooperators";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import {
  INVITATION_STATUS_PILL_STYLES,
  INVITATION_STATUS_LABEL_KEYS,
  STATUS_SORT_OPTIONS,
} from "./constants";
import {
  deriveInvitationStatus,
} from "./utils";

type InvitationCardProps = {
  invitation: CooperatorInvitation;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
};

const InvitationCard = ({
  invitation,
  onRevoke,
  isRevoking,
}: InvitationCardProps) => {
  const { t } = useTranslation();
  const status = deriveInvitationStatus(invitation);
  const statusPillStyle = INVITATION_STATUS_PILL_STYLES[status];

  return (
    <View className="bg-white rounded-2xl p-3 gap-2" style={shadows.sm}>
      <Typography variant="text-14-bold" className="text-black">
        {invitation.email}
      </Typography>
      <View
        className={`self-start rounded-full border px-3 py-1 ${statusPillStyle.containerClassName}`}
      >
        <Typography
          variant="text-12-bold"
          className={statusPillStyle.textClassName}
        >
          {t(INVITATION_STATUS_LABEL_KEYS[status])}
        </Typography>
      </View>
      <Typography variant="text-12-regular" className="text-gray-600">
        {t("Cooperators.scopeValue", {
          scope: t(SCOPE_MODE_LABEL_KEYS[invitation.scopeMode]),
        })}
      </Typography>
      {status === "ACTIVE" && (
        <Button
          title={t("Cooperators.revokeInvitation")}
          onPress={() => onRevoke(invitation.id)}
          disabled={isRevoking}
          variant="outlineSecondary"
          size="sm"
        />
      )}
    </View>
  );
};

type CooperatorCardProps = {
  cooperator: MyCooperator;
  onEditAccess: (cooperatorId: string) => void;
  onDelete: (cooperatorId: string, email: string) => void;
  isDeleting: boolean;
};

const CooperatorCard = ({
  cooperator,
  onEditAccess,
  onDelete,
  isDeleting,
}: CooperatorCardProps) => {
  const { t } = useTranslation();
  const email = cooperator.cooperator.user.email;
  const avatarLetter = email.charAt(0).toUpperCase();

  return (
    <View className="bg-white rounded-2xl p-3 gap-2 flex-row items-center" style={shadows.sm}>
      <Pressable
        onPress={() => onEditAccess(cooperator.cooperator.id)}
        className="flex-1 gap-2"
      >
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-900/10">
            <Typography variant="text-14-bold" className="text-blue-900">
              {avatarLetter}
            </Typography>
          </View>
          <View className="flex-1">
            <Typography variant="text-14-bold" className="text-black">
              {email}
            </Typography>
          </View>
        </View>
        <Typography variant="text-12-regular" className="text-gray-600">
          {t("Cooperators.scopeValue", {
            scope: t(SCOPE_MODE_LABEL_KEYS[cooperator.scopeMode]),
          })}
        </Typography>
      </Pressable>
      <View className="ml-2 items-center justify-between py-0.5">
        <DeleteButton
          onPress={() => onDelete(cooperator.cooperator.id, email)}
          disabled={isDeleting}
        />
        <View className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-forward" size={18} color="#B3B3B3" />
        </View>
      </View>
    </View>
  );
};

export default function CooperatorsScreen() {
  const { t } = useTranslation();
  const [statusSort, setStatusSort] = useState<CooperatorInvitationStatus | "">(
    "",
  );
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [deleteCooperatorTarget, setDeleteCooperatorTarget] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [deleteCooperatorFromCompany, { loading: deletingCooperator }] =
    useDeleteCooperatorFromCompany();
  const [revokeInvitation, { loading: revokingInvitation }] =
    useRevokeCooperatorInvitation();
  const { data: cooperatorsData, loading: loadingCooperators } =
    useMyCooperators();
  const { data: allInvitationsData, loading: loadingInvitations } = useMyCooperatorInvitations({
    status: statusSort || undefined,
  });

  const allInvitations = useMemo(
    () =>
      (allInvitationsData?.myCooperatorInvitations ?? []).filter(
        (invitation): invitation is CooperatorInvitation =>
          typeof invitation?.id === "string" &&
          typeof invitation?.email === "string" &&
          typeof invitation?.scopeMode === "string" &&
          Array.isArray(invitation?.permissions) &&
          typeof invitation?.storeScopeAll === "boolean" &&
          Array.isArray(invitation?.storeIds) &&
          typeof invitation?.expiresAt === "string" &&
          typeof invitation?.createdAt === "string",
      ),
    [allInvitationsData?.myCooperatorInvitations],
  );

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
  const activeFilterCount = statusSort ? 1 : 0;

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    await revokeInvitation({ variables: { invitationId: revokeTarget } });
    setRevokeTarget(null);
  };

  const handleAddCooperator = () => {
    router.push("/company/cooperators/form?mode=create");
  };

  const handleDeleteCooperatorConfirm = async () => {
    if (!deleteCooperatorTarget) return;
    try {
      await deleteCooperatorFromCompany({
        variables: { cooperatorId: deleteCooperatorTarget.id },
      });
      setDeleteCooperatorTarget(null);
    } catch {
      setDeleteCooperatorTarget(null);
      Alert.alert(t("Common.error"), t("Cooperators.deleteCooperatorError"));
    }
  };

  const handleEditAccess = (cooperatorId: string) => {
    router.push({
      pathname: "/company/cooperators/form",
      params: { mode: "edit", cooperatorId },
    });
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-gray-50-light"
      contentContainerClassName="p-6 gap-4"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row justify-between items-center">
        <Typography variant="text-20-bold" className="text-black">
          {t("Company.employeesAndPermissions")}
        </Typography>
        <CircularIconButton
          onPress={handleAddCooperator}
          size={32}
          backgroundColor="bg-blue-900"
        />
      </View>

      <View className="gap-3">
        <Typography variant="text-16-bold" className="text-black">
          {t("Cooperators.cooperatorsList")}
        </Typography>
        {loadingCooperators ? (
          <View className="items-center py-4">
            <ActivityIndicator size="large" color="#1A4196" />
          </View>
        ) : cooperators.length === 0 ? (
          <Typography
            variant="text-14-regular-spaced"
            className="text-gray-600"
          >
            {t("Cooperators.emptyCooperators")}
          </Typography>
        ) : (
          cooperators.map((cooperator) => (
            <CooperatorCard
              key={`cooperator-${cooperator.id}`}
              cooperator={cooperator}
              onEditAccess={handleEditAccess}
              onDelete={(id, email) => setDeleteCooperatorTarget({ id, email })}
              isDeleting={deletingCooperator}
            />
          ))
        )}
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Typography variant="text-16-bold" className="text-black">
            {t("Cooperators.invitationsManagement")}
          </Typography>
          <View className="relative">
            <Pressable
              onPress={() => setIsSortOpen((previous) => !previous)}
              className="flex-row items-center gap-2 rounded-full bg-white/50 px-3.5 py-1"
            >
              <Ionicons name="options-outline" size={14} color="#000000" />
              <Typography
                variant="text-14-semibold"
                className="text-black"
              >
                {t("Cooperators.filter")}
              </Typography>
              {activeFilterCount > 0 && (
                <View className="h-4 w-4 items-center justify-center rounded-full bg-red-500">
                  <Typography
                    variant="text-12-semibold"
                    className="text-white"
                  >
                    {activeFilterCount}
                  </Typography>
                </View>
              )}
            </Pressable>

            {isSortOpen && (
              <View className="absolute right-0 top-10 z-20 min-w-44 rounded-xl border border-gray-200 bg-white p-1" style={shadows.sm}>
                {STATUS_SORT_OPTIONS.map((option) => {
                  const isSelected = option.value === statusSort;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setStatusSort(option.value);
                        setIsSortOpen(false);
                      }}
                      className={`flex-row items-center justify-between rounded-lg px-3 py-2 ${isSelected ? "bg-gray-50" : ""
                        }`}
                    >
                      <Typography
                        variant="text-14-regular-spaced"
                        className={isSelected ? "text-blue-900" : "text-black"}
                      >
                        {t(option.labelKey)}
                      </Typography>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#1A4196" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {loadingInvitations ? (
          <View className="items-center py-4">
            <ActivityIndicator size="large" color="#1A4196" />
          </View>
        ) : allInvitations.length === 0 ? (
          <Typography
            variant="text-14-regular-spaced"
            className="text-gray-600"
          >
            {t("Cooperators.emptyInvitations")}
          </Typography>
        ) : (
          allInvitations.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              onRevoke={setRevokeTarget}
              isRevoking={revokingInvitation}
            />
          ))
        )}
      </View>

      <ConfirmModal
        visible={!!deleteCooperatorTarget}
        onClose={() => setDeleteCooperatorTarget(null)}
        onConfirm={handleDeleteCooperatorConfirm}
        title={t("Cooperators.deleteCooperatorTitle")}
        message={t("Cooperators.deleteCooperatorConfirmation", {
          email: deleteCooperatorTarget?.email,
        })}
        confirmText={t("Common.delete")}
        cancelText={t("Common.cancel")}
        confirmVariant="danger"
        isLoading={deletingCooperator}
      />

      <ConfirmModal
        visible={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevokeConfirm}
        title={t("Cooperators.revokeInvitationTitle")}
        message={t("Cooperators.revokeInvitationConfirmation")}
        confirmText={t("Cooperators.revokeInvitation")}
        cancelText={t("Common.cancel")}
        isLoading={revokingInvitation}
      />
    </KeyboardAwareScrollView>
  );
}

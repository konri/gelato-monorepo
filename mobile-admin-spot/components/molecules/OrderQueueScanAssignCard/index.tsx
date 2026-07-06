import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { OrderQueueTicketNumber } from "@/components/atoms/OrderQueueTicketNumber";
import { InputField } from "@/components/InputField";
import { OrderQueueTicketFace } from "@/components/molecules/OrderQueueTicketFace";
import { useCreateOrderBySession } from "@/hooks/graphql/mutations/useCreateOrderBySession";
import { useCreateOrderByUserQR } from "@/hooks/graphql/mutations/useCreateOrderByUserQR";
import type { CreateOrderBySessionResponse } from "@/shared/api-client/src/graphql/mutations/createOrderBySession";
import type { CreateOrderByUserQRResponse } from "@/shared/api-client/src/graphql/mutations/createOrderByUserQR";
import { getErrorMessage } from "@/utils/apolloError";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import type { OrderQueueScanAssignCardProps } from "./types";

export const OrderQueueScanAssignCard = ({
  userId,
  venueSession,
  merchantStoreId,
  canSubmit,
}: OrderQueueScanAssignCardProps) => {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [assignedNumber, setAssignedNumber] = useState<number | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const venueStoreMismatch = useMemo(
    () =>
      venueSession != null && venueSession.merchantStoreId !== merchantStoreId,
    [merchantStoreId, venueSession],
  );

  const isSessionFlow = venueSession != null && !venueStoreMismatch;

  const userQrOptions = useMemo(
    () => ({
      onCompleted: (data: CreateOrderByUserQRResponse) => {
        const created = data.createOrderByUserQR;
        if (created != null) {
          setAssignedNumber(created.orderNumber);
          setNote(created.note ?? "");
        }
      },
      onError: (error: unknown) => {
        setAssignError(getErrorMessage(error) ?? t("OrderQueue.assignScanError"));
      },
    }),
    [t],
  );

  const sessionOptions = useMemo(
    () => ({
      onCompleted: (data: CreateOrderBySessionResponse) => {
        const created = data.createOrderBySession;
        if (created != null) {
          setAssignedNumber(created.orderNumber);
          setNote(created.note ?? "");
        }
      },
      onError: (error: unknown) => {
        setAssignError(getErrorMessage(error) ?? t("OrderQueue.assignScanError"));
      },
    }),
    [t],
  );

  const [createOrderByUser, { loading: loadingUser }] = useCreateOrderByUserQR(
    merchantStoreId,
    userQrOptions,
  );

  const [createOrderBySession, { loading: loadingSession }] = useCreateOrderBySession(
    merchantStoreId,
    sessionOptions,
  );

  const loading = loadingUser || loadingSession;

  useEffect(() => {
    setNote("");
    setAssignedNumber(null);
    setAssignError(null);
  }, [userId, merchantStoreId, venueSession?.sessionToken, venueSession?.merchantStoreId]);

  useEffect(() => {
    if (venueStoreMismatch) {
      setAssignError(t("OrderQueue.venueSessionWrongStore"));
    }
  }, [t, venueStoreMismatch]);

  const handleAssign = useCallback(() => {
    setAssignError(null);
    if (venueStoreMismatch) {
      return;
    }
    if (isSessionFlow && venueSession != null) {
      const trimmedSessionNote = note.trim();
      void createOrderBySession({
        variables: {
          input: {
            merchantStoreId,
            sessionToken: venueSession.sessionToken,
            note: trimmedSessionNote === "" ? null : trimmedSessionNote,
          },
        },
      });
      return;
    }
    const trimmed = note.trim();
    void createOrderByUser({
      variables: {
        input: {
          merchantStoreId,
          note: trimmed === "" ? null : trimmed,
          userId: userId ?? null,
        },
      },
    });
  }, [
    createOrderBySession,
    createOrderByUser,
    isSessionFlow,
    merchantStoreId,
    note,
    userId,
    venueSession,
    venueStoreMismatch,
  ]);

  const pending = assignedNumber == null;
  const blockSubmit =
    !canSubmit || !pending || loading || venueStoreMismatch;

  return (
    <View className="w-full max-w-86 self-center rounded-2xl bg-white p-4 gap-3">
      <Typography
        variant="text-18-bold"
        className="self-stretch text-center text-gray-900 tracking-0.2"
      >
        {t("OrderQueue.assignScanCardTitle")}
      </Typography>

      <View className="flex-row gap-2.5 self-stretch items-stretch">
        <View className="min-w-0 flex-[3]">
          <OrderQueueTicketFace tone="chrome" className="w-full min-h-25">
            <View className="min-h-0 w-full flex-1 flex-col self-stretch justify-between">
              <Typography
                variant="text-14-semibold"
                className="self-stretch pr-8 text-steel-muted uppercase"
              >
                {pending
                  ? t("OrderQueue.assignScanNewNumberCaption")
                  : t("OrderQueue.assignScanAssignedCaption")}
              </Typography>
              <View className="w-1/2 min-w-0 self-start shrink-0 pt-1">
                <OrderQueueTicketNumber
                  orderNumber={assignedNumber}
                  className="text-steel-muted"
                />
              </View>
            </View>
          </OrderQueueTicketFace>
        </View>

        <View className="min-w-0 flex-[2] rounded-14 border border-chrome-soft-edge bg-white p-2 gap-1 shadow-chrome-soft">
          <Typography variant="text-12-semibold" className="text-steel-muted">
            {t("OrderQueue.assignScanNoteLabel")}
          </Typography>
          <InputField
            label=""
            placeholder={t("OrderQueue.assignScanNotePlaceholder")}
            value={note}
            onChangeText={setNote}
            variant="compact"
            editable={pending}
            numberOfLines={3}
            multiline
            scrollEnabled
          />
        </View>
      </View>

      {assignError != null ? (
        <Typography
          variant="text-14-regular-spaced"
          className="text-red-600 text-center"
        >
          {assignError}
        </Typography>
      ) : null}

      <Button
        title={t("OrderQueue.assignScanSubmitCta")}
        onPress={handleAssign}
        variant="primary"
        height={40}
        size="sm"
        disabled={blockSubmit}
        leftIcon={
          loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : undefined
        }
      />
    </View>
  );
};

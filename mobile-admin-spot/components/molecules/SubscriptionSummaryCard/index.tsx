import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { SubscriptionSummaryCardProps } from "./types";

export const SubscriptionSummaryCard = ({
  planName,
  isActive,
  renewalDate,
  paymentMethodLast4,
  lastInvoiceName,
  onChangePlan,
  onCancelSubscription,
  onDownloadInvoice,
}: SubscriptionSummaryCardProps) => {
  const { t } = useTranslation();

  return (
    <View className="bg-white rounded-3xl shadow-settings-card p-5 gap-3.5">
      <View className="flex-row justify-between items-start">
        <View className="gap-1">
          <Typography
            variant="text-12-regular"
            className="text-cool-gray uppercase"
            style={{ letterSpacing: 0.6 }}
          >
            {t("AccountHub.subscriptionCurrentPlan")}
          </Typography>
          <Typography variant="text-20-bold" className="text-navy">
            {planName}
          </Typography>
        </View>
        {isActive && (
          <View className="bg-emerald-50 rounded-full px-3 py-1">
            <Typography
              variant="text-10-medium"
              className="text-emerald-700 uppercase"
              style={{ letterSpacing: 1 }}
            >
              {t("AccountHub.planActive")}
            </Typography>
          </View>
        )}
      </View>

      <View className="flex-row">
        <View className="flex-1">
          <Typography
            variant="text-10-medium"
            className="text-cool-gray uppercase"
            style={{ letterSpacing: 0.5 }}
          >
            {t("AccountHub.subscriptionRenewal")}
          </Typography>
          <Typography
            variant="text-12-bold"
            className="text-dark"
            style={{ lineHeight: 20 }}
          >
            {renewalDate}
          </Typography>
        </View>
        <View className="flex-1">
          <Typography
            variant="text-10-medium"
            className="text-cool-gray uppercase"
            style={{ letterSpacing: 0.5 }}
          >
            {t("AccountHub.subscriptionPayment")}
          </Typography>
          <View className="flex-row items-center gap-1">
            <Ionicons name="card" size={10} color="#131B2E" />
            <Typography
              variant="text-12-bold"
              className="text-dark"
              style={{ lineHeight: 20 }}
            >
              •••• {paymentMethodLast4}
            </Typography>
          </View>
        </View>
      </View>

      <View
        className="pt-4 gap-3"
        style={{ borderTopWidth: 1, borderTopColor: "rgba(195, 198, 211, 0.1)" }}
      >
        <Typography
          variant="text-12-regular"
          className="text-cool-gray uppercase"
          style={{ letterSpacing: 0.6 }}
        >
          {t("AccountHub.subscriptionInvoices")}
        </Typography>
        <Pressable
          onPress={onDownloadInvoice}
          className="bg-indigo-50 rounded-xl flex-row items-center justify-between px-3 py-3"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="document-text" size={20} color="#00387E" />
            <Typography variant="text-12-bold" className="text-dark">
              {lastInvoiceName}
            </Typography>
          </View>
          <Ionicons name="chevron-forward" size={10} color="#737783" />
        </Pressable>
      </View>

      <View className="pt-2 gap-4">
        <Button
          title={t("AccountHub.subscriptionChangePlan")}
          onPress={onChangePlan}
          variant="primary"
          size="sm"
          height={43}
        />
        <Pressable onPress={onCancelSubscription} className="items-center py-1">
          <Typography
            variant="text-12-bold"
            className="text-cool-gray uppercase"
            style={{ letterSpacing: 1.2 }}
          >
            {t("AccountHub.subscriptionCancel")}
          </Typography>
        </Pressable>
      </View>
    </View>
  );
};

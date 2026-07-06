import { Typography } from "@/components/atoms/Typography";
import type { MerchantStatsInsightItem } from "@/utils/merchantStatsInsights/types";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { StatsInsightCalloutVariant, StatsInsightListProps } from "./types";

const variantClass: Record<StatsInsightCalloutVariant, string> = {
  good: "bg-emerald-50 border-emerald-200",
  warn: "bg-amber-50 border-amber-200",
  bad: "bg-red-50 border-red-200",
  info: "bg-blue-50 border-blue-200",
};

const titleClass: Record<StatsInsightCalloutVariant, string> = {
  good: "text-emerald-900",
  warn: "text-amber-900",
  bad: "text-red-900",
  info: "text-blue-950",
};

const bodyClass: Record<StatsInsightCalloutVariant, string> = {
  good: "text-emerald-800",
  warn: "text-amber-900",
  bad: "text-red-800",
  info: "text-blue-900",
};

type CalloutProps = {
  variant: StatsInsightCalloutVariant;
  title: string;
  body: string;
};

const StatsInsightCallout = ({ variant, title, body }: CalloutProps) => (
  <View className={`rounded-2xl border p-3.5 gap-2 ${variantClass[variant]}`}>
    <Typography variant="text-12-bold" className={titleClass[variant]}>
      {title}
    </Typography>
    <Typography variant="text-12-regular" className={`leading-snug ${bodyClass[variant]}`}>
      {body}
    </Typography>
  </View>
);

const insightKey = (item: MerchantStatsInsightItem, index: number) =>
  `${item.titleKey}-${item.bodyKey}-${index}`;

export const StatsInsightList = ({ items, showDisclaimer = true }: StatsInsightListProps) => {
  const { t } = useTranslation();
  const rendered = useMemo(
    () =>
      items.map((it, i) => (
        <StatsInsightCallout
          key={insightKey(it, i)}
          variant={it.variant}
          title={t(it.titleKey, it.params)}
          body={t(it.bodyKey, it.params)}
        />
      )),
    [items, t],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      {rendered}
      {showDisclaimer ? (
        <Typography variant="text-12-regular" className="text-gray-500 leading-snug px-0.5">
          {t("MerchantStats.insightDisclaimer")}
        </Typography>
      ) : null}
    </View>
  );
};

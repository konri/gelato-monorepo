import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useGetMyStampCardTemplatesDetails } from "@/hooks/graphql/queries/useGetMyStampCardTemplates";
import { useGetMyStreakPrograms } from "@/hooks/graphql/queries/useGetMyStreakPrograms";
import {
  useMerchantStats,
  type MerchantStatsStoreFilterInput,
} from "@/hooks/useMerchantStats";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";
import type { StatsCompareMode } from "@/shared/api-client/src/stats/types";
import type { StatsPeriodPresetId } from "@/utils/merchantStatsPeriod";
import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type MerchantStatsSessionPickerItem = {
  id: string;
  title: string;
};

export type MerchantStatsSessionContextValue = {
  canReadMerchant: boolean;
  accessLoading: boolean;
  statsMerchantId: string | null;
  selectedMerchantName: string | null;
  statsEnabled: boolean;
  storeFilter: MerchantStatsStoreFilterInput;
  preset: StatsPeriodPresetId;
  setPreset: (v: StatsPeriodPresetId) => void;
  compareMode: StatsCompareMode;
  setCompareMode: (v: StatsCompareMode) => void;
  storeScope: "network" | "context_store";
  setStoreScope: (v: "network" | "context_store") => void;
  loyaltyCardTemplateId: string | null;
  setLoyaltyCardTemplateId: (v: string | null) => void;
  streakProgramId: string | null;
  setStreakProgramId: (v: string | null) => void;
  customFromIso: string;
  setCustomFromIso: (v: string) => void;
  customToIso: string;
  setCustomToIso: (v: string) => void;
  filtersSheetOpen: boolean;
  setFiltersSheetOpen: (v: boolean) => void;
  templateModalOpen: boolean;
  setTemplateModalOpen: (v: boolean) => void;
  streakModalOpen: boolean;
  setStreakModalOpen: (v: boolean) => void;
  fromPickerOpen: boolean;
  setFromPickerOpen: (v: boolean) => void;
  toPickerOpen: boolean;
  setToPickerOpen: (v: boolean) => void;
  bundle: MerchantStatsBundleData | null;
  loading: boolean;
  queryFailed: boolean;
  errorMessage: string | null;
  refresh: () => Promise<unknown>;
  templatePickerItems: MerchantStatsSessionPickerItem[];
  streakPickerItems: MerchantStatsSessionPickerItem[];
  selectedTemplateTitle: string | null;
  selectedStreakTitle: string | null;
  isStoreScoped: boolean;
  selectedStoreId: string | null;
  availableStoresCount: number;
  showStoreScopeToggle: boolean;
};

const MerchantStatsSessionContext = createContext<MerchantStatsSessionContextValue | null>(null);

export const MerchantStatsSessionProvider = ({ children }: { children: ReactNode }) => {
  const { canRead } = useFeatureAccess("merchant");
  const {
    merchants,
    selectedMerchantId,
    selectedStoreId,
    availableStores,
    isStoreScoped,
    isLoading: accessLoading,
  } = useOperatorAccess();

  const [preset, setPreset] = useState<StatsPeriodPresetId>("30d");
  const [compareMode, setCompareMode] = useState<StatsCompareMode>("previous_period");
  const [storeScope, setStoreScope] = useState<"network" | "context_store">("context_store");
  const [loyaltyCardTemplateId, setLoyaltyCardTemplateId] = useState<string | null>(null);
  const [streakProgramId, setStreakProgramId] = useState<string | null>(null);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [customFromIso, setCustomFromIso] = useState(() => {
    const end = new Date();
    const start = new Date(end.getTime());
    start.setUTCDate(start.getUTCDate() - 30);
    return start.toISOString();
  });
  const [customToIso, setCustomToIso] = useState(() => new Date().toISOString());
  const [fromPickerOpen, setFromPickerOpen] = useState(false);
  const [toPickerOpen, setToPickerOpen] = useState(false);

  const statsMerchantId = useMemo(() => {
    if (merchants.length === 0) {
      return null;
    }
    const resolved = selectedMerchantId ?? merchants[0]?.id;
    return resolved && resolved.length > 0 ? resolved : null;
  }, [merchants, selectedMerchantId]);

  const selectedMerchantName = useMemo(() => {
    if (!statsMerchantId) {
      return null;
    }
    return merchants.find((m) => m.id === statsMerchantId)?.name ?? null;
  }, [merchants, statsMerchantId]);

  const statsEnabled = canRead && !accessLoading && statsMerchantId !== null;

  const storeFilter: MerchantStatsStoreFilterInput = useMemo(() => {
    const storeIds = selectedStoreId ? [selectedStoreId] : null;
    if (isStoreScoped && storeIds) {
      return { mode: "stores", storeIds };
    }
    if (storeScope === "network") {
      return { mode: "network" };
    }
    if (storeIds) {
      return { mode: "stores", storeIds };
    }
    return { mode: "network" };
  }, [isStoreScoped, selectedStoreId, storeScope]);

  const customRange = useMemo(() => {
    if (preset !== "custom") {
      return null;
    }
    return { from: customFromIso, to: customToIso };
  }, [customFromIso, customToIso, preset]);

  const {
    bundle,
    loading,
    refresh,
    queryFailed,
    errorMessage,
  } = useMerchantStats({
    merchantId: statsMerchantId,
    storeFilter,
    loyaltyCardTemplateId,
    streakProgramId,
    compareMode,
    preset,
    customRange,
    enabled: statsEnabled,
  });

  const { data: templateDetailsData } = useGetMyStampCardTemplatesDetails({
    skip: !statsEnabled,
  });

  const { data: streakProgramsData } = useGetMyStreakPrograms({
    skip: !statsEnabled,
    storeId: selectedStoreId,
  });

  const templatePickerItems = useMemo(() => {
    const rows = templateDetailsData?.myStampCardTemplates ?? [];
    return rows
      .filter((row): row is typeof row & { id: string } => typeof row.id === "string" && row.id.length > 0)
      .map((row) => ({
        id: row.id,
        title: row.title?.trim() ? row.title : row.id,
      }));
  }, [templateDetailsData?.myStampCardTemplates]);

  const streakPickerItems = useMemo(() => {
    const rows = streakProgramsData?.myMerchantStreaks ?? [];
    return rows
      .filter((row): row is typeof row & { id: string; name: string } => {
        return typeof row.id === "string" && row.id.length > 0 && typeof row.name === "string";
      })
      .map((row) => ({
        id: row.id,
        title: row.name,
      }));
  }, [streakProgramsData?.myMerchantStreaks]);

  const selectedTemplateTitle = useMemo(() => {
    if (!loyaltyCardTemplateId) {
      return null;
    }
    return templatePickerItems.find((x) => x.id === loyaltyCardTemplateId)?.title ?? null;
  }, [loyaltyCardTemplateId, templatePickerItems]);

  const selectedStreakTitle = useMemo(() => {
    if (!streakProgramId) {
      return null;
    }
    return streakPickerItems.find((x) => x.id === streakProgramId)?.title ?? null;
  }, [streakPickerItems, streakProgramId]);

  const showStoreScopeToggle = !isStoreScoped && availableStores.length > 0;

  const value: MerchantStatsSessionContextValue = {
    canReadMerchant: canRead,
    accessLoading,
    statsMerchantId,
    selectedMerchantName,
    statsEnabled,
    storeFilter,
    preset,
    setPreset,
    compareMode,
    setCompareMode,
    storeScope,
    setStoreScope,
    loyaltyCardTemplateId,
    setLoyaltyCardTemplateId,
    streakProgramId,
    setStreakProgramId,
    customFromIso,
    setCustomFromIso,
    customToIso,
    setCustomToIso,
    filtersSheetOpen,
    setFiltersSheetOpen,
    templateModalOpen,
    setTemplateModalOpen,
    streakModalOpen,
    setStreakModalOpen,
    fromPickerOpen,
    setFromPickerOpen,
    toPickerOpen,
    setToPickerOpen,
    bundle,
    loading,
    queryFailed,
    errorMessage,
    refresh,
    templatePickerItems,
    streakPickerItems,
    selectedTemplateTitle,
    selectedStreakTitle,
    isStoreScoped,
    selectedStoreId,
    availableStoresCount: availableStores.length,
    showStoreScopeToggle,
  };

  return (
    <MerchantStatsSessionContext.Provider value={value}>{children}</MerchantStatsSessionContext.Provider>
  );
};

export const useMerchantStatsSession = (): MerchantStatsSessionContextValue => {
  const ctx = useContext(MerchantStatsSessionContext);
  if (!ctx) {
    throw new Error("useMerchantStatsSession must be used within MerchantStatsSessionProvider");
  }
  return ctx;
};

export const useMerchantStatsSessionOptional = (): MerchantStatsSessionContextValue | null =>
  useContext(MerchantStatsSessionContext);

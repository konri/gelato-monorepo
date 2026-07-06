import type { StampCardFormData } from "@/components/organisms/StampCardPreview/types";
import { Stack } from "expo-router";
import React, { createContext, useContext, useMemo } from "react";
import { FormProvider, useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

type StampCardFormContextType = UseFormReturn<StampCardFormData>;

const StampCardFormContext = createContext<StampCardFormContextType | null>(null);

export const useStampCardForm = (): StampCardFormContextType => {
    const context = useContext(StampCardFormContext);
    if (!context) {
        throw new Error("useStampCardForm must be used within StampCardFormProvider");
    }
    return context;
};

export default function Step3Layout() {
    const { t } = useTranslation();

    const form = useForm<StampCardFormData>({
        defaultValues: {
            title: t("Loyalty.stampsForVisits"),
            awardType: "visit",
            minimumAmount: "20",
            intermediateRewardRemovesStamps: true,
            isActive: true,
        },
        mode: "onSubmit",
        shouldUnregister: false,
    });

    const contextValue = useMemo(() => form, [form]);

    return (
        <StampCardFormContext.Provider value={contextValue}>
            <FormProvider {...form}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                    }}
                />
            </FormProvider>
        </StampCardFormContext.Provider>
    );
}

import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { MilestonesList } from "@/components/molecules/MilestonesList";
import { StampCardPreview } from "@/components/organisms/StampCardPreview";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useStampCardForm } from "./_layout";

export default function MilestoneScreen() {
    const form = useStampCardForm();
    const stampsRequired = form.watch("stampsRequired");





    return (
        <KeyboardAwareScrollView
            className="flex-1 bg-gray-50-light"
            showsVerticalScrollIndicator={false}
        >
            <View className="gap-4 px-6 py-4">
                <StampCardPreview />
                <MilestonesList
                    maxStamps={stampsRequired}
                    onCancel={() => router.back()}
                />
            </View>
        </KeyboardAwareScrollView>
    );
}

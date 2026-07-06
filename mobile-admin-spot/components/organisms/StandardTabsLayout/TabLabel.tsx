import { Typography } from "@/components/atoms/Typography";
import { View } from "react-native";

type TabLabelProps = {
    label: string;
    focused: boolean;
    color: string;
};

export const TabLabel = ({ label, focused, color }: TabLabelProps) => (
    <View className="items-center justify-center flex">
        <Typography variant="text-10-medium" style={{ color }}>
            {label}
        </Typography>
        {focused && (
            <View className="mt-1 w-4 h-0.5 rounded-[1px] bg-blue-900" />
        )}
    </View>
);

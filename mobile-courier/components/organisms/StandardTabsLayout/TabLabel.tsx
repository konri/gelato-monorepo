import { Typography } from "@/components/atoms/Typography";
import { View } from "react-native";

type TabLabelProps = {
    label: string;
    focused: boolean;
    color: string;
};

export const TabLabel = ({ label, focused }: TabLabelProps) => (
    <View className="items-center justify-center">
        <Typography variant="body-very-small-medium">
            {label}
        </Typography>
        {focused && (
            <View className="mt-1 w-4 h-0.5 rounded-sm bg-accent" />
        )}
    </View>
);

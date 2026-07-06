import QrCornerSvg from "@/assets/images/qr_corner.svg";
import React from "react";
import { View } from "react-native";

export const QRScannerCorners = () => {
    return (
        <View className="w-52 h-52 relative">
            <View className="absolute top-0 left-0">
                <QrCornerSvg width={38} height={36} style={{ transform: [{ rotate: "90deg" }] }} />
            </View>
            <View className="absolute top-0 right-0" style={{ transform: [{ rotate: "180deg" }] }}>
                <QrCornerSvg width={38} height={36} />
            </View>
            <View className="absolute bottom-0 right-0" style={{ transform: [{ rotate: "270deg" }] }}>
                <QrCornerSvg width={38} height={36} />
            </View>
            <View className="absolute bottom-0 left-0">
                <QrCornerSvg width={38} height={36} />
            </View>
        </View>
    );
};

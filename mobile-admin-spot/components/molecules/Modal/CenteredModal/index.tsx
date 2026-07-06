import { Typography } from "@/components/atoms/Typography";
import { Modal, Pressable, View } from "react-native";
import { CenteredModalProps } from "./types";
import { getSizeClasses } from "./utils";

const CenteredModal = ({
    visible,
    onClose,
    children,
    title,
    size = "sm",
}: CenteredModalProps) => {
    const sizeClasses = getSizeClasses(size);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View
                className="flex-1 justify-center items-center px-4"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
            >
                <Pressable
                    className="absolute inset-0"
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close modal"
                />
                <View className={`${sizeClasses} bg-gray-50-light rounded-2xl max-h-modal`}>
                    {title && (
                        <View className="items-center px-4 pt-5 pb-4 mb-1">
                            <Typography
                                variant="text-16-bold"
                                className="text-black text-center"
                                numberOfLines={2}
                            >
                                {title}
                            </Typography>
                        </View>
                    )}
                    {children}
                </View>
            </View>
        </Modal>
    );
};

export { CenteredModal };

import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

type DeleteButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

export const DeleteButton = ({ onPress, disabled }: DeleteButtonProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className="w-10 h-10 rounded-full bg-red-50 items-center justify-center"
  >
    <Ionicons name="trash-outline" size={20} color="#EF4444" />
  </Pressable>
);

import { TextInput, View } from 'react-native';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
}

export const SearchInput = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onSubmitEditing,
}: SearchInputProps) => {
  return (
    <View className="w-full">
      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
      />
    </View>
  );
};

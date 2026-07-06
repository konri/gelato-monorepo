import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

interface CheckboxOption {
  id: string;
  label: string;
}

interface CheckboxSectionProps {
  title: string;
  options: CheckboxOption[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const CheckboxSection: React.FC<CheckboxSectionProps> = ({
  title,
  options,
  selectedIds,
  onSelectionChange,
}) => {
  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((optId) => optId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <View className="py-4">
      <Typography variant="body-base-semibold" className="mb-3">
        {title}
      </Typography>
      {options.map((option) => {
        const isChecked = selectedIds.includes(option.id);
        return (
          <Pressable
            key={option.id}
            className="flex-row items-center py-2"
            onPress={() => toggleOption(option.id)}
          >
            <View
              className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                isChecked ? 'bg-red-500 border-red-500' : 'border-gray-300'
              }`}
            >
              {isChecked && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Typography variant="body-base-regular" className="text-text-primary flex-1">
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
};

import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

interface DropdownOption<T = string> {
  label: string;
  value: T;
}

interface DropdownProps<T = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  compact?: boolean;
}

export function Dropdown<T = string>({ options, value, onChange, placeholder, compact = false }: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  if (compact) {
    return (
      <>
        <Pressable
          onPress={() => setIsOpen(true)}
          className="rounded-full px-4 items-center justify-between flex-row"
          style={{ height: 28, backgroundColor: '#E9E9E9' }}
        >
          <Typography variant="body-small-semibold" className="text-text-primary">
            {selectedOption?.label || placeholder}
          </Typography>
          <Ionicons name="chevron-down" size={16} color="#212121" />
        </Pressable>

        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
          <Pressable className="flex-1 bg-black/50" onPress={() => setIsOpen(false)}>
            <View className="flex-1 justify-center px-6">
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View className="bg-white rounded-2xl max-h-96">
                  <ScrollView>
                    {options.map((option, index) => (
                      <Pressable
                        key={String(option.value)}
                        onPress={() => {
                          onChange(option.value);
                          setIsOpen(false);
                        }}
                        className={`px-4 py-4 border-b border-gray-200 ${
                          index === 0 ? 'rounded-t-2xl' : ''
                        } ${index === options.length - 1 ? 'rounded-b-2xl border-b-0' : ''}`}
                      >
                        <Typography
                          variant={option.value === value ? 'body-base-semibold' : 'body-base-regular'}
                          className={option.value === value ? 'text-accent' : 'text-text-primary'}
                        >
                          {option.label}
                        </Typography>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="bg-input-bg rounded-xl px-4 py-3 flex-row items-center justify-between"
      >
        <Typography variant="body-base-regular" className="text-text-primary">
          {selectedOption?.label || placeholder}
        </Typography>
        <Ionicons name="chevron-down" size={20} color="#212121" />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setIsOpen(false)}>
          <View className="flex-1 justify-center px-6">
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="bg-white rounded-2xl max-h-96">
                <ScrollView>
                  {options.map((option, index) => (
                    <Pressable
                      key={String(option.value)}
                      onPress={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`px-4 py-4 border-b border-gray-200 ${
                        index === 0 ? 'rounded-t-2xl' : ''
                      } ${index === options.length - 1 ? 'rounded-b-2xl border-b-0' : ''}`}
                    >
                      <Typography
                        variant={option.value === value ? 'body-base-semibold' : 'body-base-regular'}
                        className={option.value === value ? 'text-accent' : 'text-text-primary'}
                      >
                        {option.label}
                      </Typography>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

import React from 'react';
import { Modal as RNModal, View, Pressable } from 'react-native';
import { Typography } from '@/components/atoms/Typography';
import { CloseModalButton } from '@/components/atoms/CloseModalButton';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  headerTitle: string;
  title?: string;
  descriptionTitle?: string;
  description?: string;
  buttons?: React.ReactNode[];
  children: React.ReactNode;
}

export function Modal({ visible, onClose, headerTitle, title, descriptionTitle, description, buttons, children }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/70 justify-center items-center px-4"
        onPress={onClose}
      >
        <Pressable
          className="bg-background-gray rounded-2xl w-full pb-6"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <Typography variant={"body-xl-bold"}>
              {headerTitle}
            </Typography>
            <CloseModalButton onPress={onClose} />
          </View>
          
          <View className="px-4">
            {children}
            
            {title && (
              <Typography variant="body-base-bold" className="mb-4">
                {title}
              </Typography>
            )}

            {descriptionTitle && (
                <Typography variant="body-base-bold">
                  {descriptionTitle}
                </Typography>
            )}
            {description && (
              <Typography variant="body-small-regular" className="text-gray-600 mb-6 pl-4 pt-1">
                {description}
              </Typography>
            )}
            
            {buttons && (
              <View className="items-center space-y-3 gap-4">
                {buttons.map((button, index) => (
                  <View key={index} className="items-center w-full">{button}</View>
                ))}
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { CloseModalButton } from '@/components/atoms/CloseModalButton';
import { Typography } from '@/components/atoms/Typography';
import { useOverlayOpen } from '@/hooks/useOverlayOpen';
import React from 'react';
import { KeyboardAvoidingView, Modal as RNModal, Pressable, View } from 'react-native';

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

export function Modal({
  visible,
  onClose,
  headerTitle,
  title,
  descriptionTitle,
  description,
  buttons,
  children,
}: ModalProps) {
  useOverlayOpen(visible);
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <Pressable className="flex-1 bg-black/70 justify-center items-center px-4" onPress={onClose}>
          <Pressable
            className="bg-background-gray rounded-2xl w-full max-h-full"
            onPress={(e) => e.stopPropagation()}
          >
            <KeyboardAwareScrollView adjustInsets={false} bounces={false}>
              <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                <Typography variant="body-xl-bold">{headerTitle}</Typography>
                <CloseModalButton onPress={onClose} />
              </View>

              <View className="px-4 pb-6">
                {children}

                {title && (
                  <Typography variant="body-base-bold" className="mb-4">
                    {title}
                  </Typography>
                )}

                {descriptionTitle && (
                  <Typography variant="body-base-bold">{descriptionTitle}</Typography>
                )}
                {description && (
                  <Typography variant="body-small-regular" className="text-gray-600 mb-6 pl-4 pt-1">
                    {description}
                  </Typography>
                )}

                {buttons && (
                  <View className="items-center space-y-3 gap-4">
                    {buttons.map((button, index) => (
                      <View key={index} className="items-center w-full">
                        {button}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </KeyboardAwareScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

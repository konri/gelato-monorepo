import React from 'react';
import {View, Modal, Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Typography} from '@/components/atoms/Typography';

interface PopoverModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  anchorPosition?: {top: number; right: number};
  width?: number;
  height?: number;
  titleColor?: string;
  backgroundColor?: string;
}

export const PopoverModal = ({visible, onClose, title, children, anchorPosition = {top: 120, right: 24}, width = 300, height, titleColor = '#A9A9A9', backgroundColor = '#D7D7D7'}: PopoverModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <View className="absolute" style={{top: anchorPosition.top, right: anchorPosition.right}}>
          <View className="items-end" style={{marginRight: anchorPosition.right}}>
            <View className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-modal-bg" />
          </View>
          <Pressable 
            className="rounded-2xl p-6 shadow-lg" 
            style={{minWidth: width, ...(height && {height}), backgroundColor: backgroundColor}}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-center mb-6 relative">
              <Typography variant="body-lg-semibold-spaced" className={titleColor === '#000000' || titleColor === '#000' || titleColor === 'black' ? 'text-black' : 'text-[#A9A9A9]'} >{title}</Typography>
              <Pressable onPress={onClose} className="w-8 h-8 items-center justify-center absolute right-0">
                <Ionicons name="close" size={24} color="#A9A9A9" />
              </Pressable>
            </View>
            {children}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

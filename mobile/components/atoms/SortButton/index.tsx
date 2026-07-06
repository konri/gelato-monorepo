import React, {useState} from 'react';
import {Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Typography} from '@/components/atoms/Typography';
import {PopoverModal} from '@/components/atoms/PopoverModal';

interface SortButtonProps {
  label: string;
  modalTitle: string;
  modalContent: React.ReactNode;
  anchorPosition?: {top: number; right: number};
  width?: number;
}

export const SortButton = ({label, modalTitle, modalContent, anchorPosition, width}: SortButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <Pressable onPress={() => setIsVisible(true)} className="flex-row items-center gap-2">
        <Typography variant="body-lg-bold" className="text-text-primary">
          {label}
        </Typography>
        <Ionicons name="chevron-down" size={16} color="#919191" />
      </Pressable>

      <PopoverModal
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        title={modalTitle}
        anchorPosition={anchorPosition}
        width={width}
      >
        {modalContent}
      </PopoverModal>
    </>
  );
};

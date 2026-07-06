import { Typography } from '@/components/atoms/Typography';
import { CourierApprovedSpot } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  spots: CourierApprovedSpot[];
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (spotIds: string[]) => void;
};

// Bottom-sheet modal to pick which approved spots to work from before going online.
export function SpotSelectionModal({
  visible,
  spots,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Default: all approved spots selected when the sheet opens.
  useEffect(() => {
    if (visible) {
      setSelected(new Set(spots.map((s) => s.spotId)));
    }
  }, [visible, spots]);

  const toggle = (spotId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(spotId)) next.delete(spotId);
      else next.add(spotId);
      return next;
    });
  };

  const canConfirm = selected.size > 0 && !submitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-t-3xl"
          style={{ paddingBottom: insets.bottom + 16 }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Grabber */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1.5 rounded-full bg-gray-300" />
          </View>

          <View className="px-6 pt-2">
            <Typography variant="body-lg-bold" className="text-text-primary">
              {t('Courier.selectSpotsTitle')}
            </Typography>
            <Typography
              variant="body-small-regular"
              className="text-gray-500 mt-1 mb-4"
            >
              {t('Courier.selectSpotsSubtitle')}
            </Typography>
          </View>

          <ScrollView
            style={{ maxHeight: 360 }}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-3">
              {spots.map((spot) => {
                const isSelected = selected.has(spot.spotId);
                return (
                  <Pressable
                    key={spot.spotId}
                    onPress={() => toggle(spot.spotId)}
                    className="flex-row items-center rounded-2xl p-4 border-2"
                    style={{
                      borderColor: isSelected ? '#EC2828' : '#E5E7EB',
                      backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF',
                    }}
                  >
                    <View className="flex-1 pr-3">
                      <Typography
                        variant="body-base-semibold"
                        className="text-text-primary"
                      >
                        {spot.spotName}
                      </Typography>
                      {!!spot.cityName && (
                        <Typography
                          variant="body-small-regular"
                          className="text-gray-500 mt-0.5"
                        >
                          {spot.cityName}
                        </Typography>
                      )}
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={26}
                      color={isSelected ? '#EC2828' : '#9CA3AF'}
                    />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View className="px-6 mt-5">
            <Pressable
              disabled={!canConfirm}
              onPress={() => onConfirm(Array.from(selected))}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: canConfirm ? '#22C55E' : '#D1D5DB' }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Typography variant="body-base-bold" className="text-white">
                  {t('Courier.startWork')}
                </Typography>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';

const STEPS = ['guideStep1', 'guideStep2', 'guideStep3', 'guideStep4', 'guideStep5'] as const;

/**
 * "How to connect a scanner" (BRANDS_SPEC §4.8, §7.6): the one-page staff
 * guide, linked from the Scan screen.
 */
export function ScannerGuideModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/60 px-4" onPress={onClose}>
        <Pressable
          className="w-full rounded-2xl bg-white"
          style={{ maxWidth: 560, maxHeight: '85%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center border-b border-gray-100 px-4 py-3">
            <Typography variant="body-lg-bold" className="flex-1 text-text-primary" accessibilityRole="header">
              {t('Scan.guideTitle')}
            </Typography>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('Scan.guideClose')}
              className="h-12 w-12 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={22} color="#212121" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {STEPS.map((key, i) => (
              <View key={key} className="mb-3 flex-row">
                <View className="mr-3 h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: '#FEECEC' }}>
                  <Typography variant="body-base-bold" style={{ color: '#B91C1C' }}>
                    {String(i + 1)}
                  </Typography>
                </View>
                <Typography variant="body-base-regular" className="flex-1 text-text-primary">
                  {t(`Scan.${key}`)}
                </Typography>
              </View>
            ))}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              className="mt-2 items-center justify-center rounded-xl"
              style={{ minHeight: 56, backgroundColor: '#EC2828' }}
            >
              <Typography variant="body-base-bold" className="text-white">
                {t('Scan.guideDone')}
              </Typography>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

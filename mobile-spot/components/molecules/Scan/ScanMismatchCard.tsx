import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

export type ScanMode = 'loyalty' | 'collect' | 'prize';

type Option = { mode: ScanMode; label: string };

/**
 * The scanned code does not fit the chosen mode (BRANDS_SPEC §4.8): a reward
 * code in Add points / Collect order, or a customer card in Redeem reward.
 * Switching keeps the scan result, so nobody has to scan again.
 */
export function ScanMismatchCard({
  scanned,
  onSwitch,
  onCancel,
}: {
  scanned: 'CUSTOMER' | 'REWARD';
  onSwitch: (mode: ScanMode) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const options: Option[] =
    scanned === 'REWARD'
      ? [{ mode: 'prize', label: t('Scan.switchToPrize') }]
      : [
          { mode: 'loyalty', label: t('Scan.switchToCustomer') },
          { mode: 'collect', label: t('Scan.switchToCollect') },
        ];

  return (
    <View className="items-center rounded-2xl border border-amber-300 bg-amber-50 p-6" accessibilityRole="alert">
      <Ionicons name={scanned === 'REWARD' ? 'gift-outline' : 'person-circle-outline'} size={44} color="#B45309" />
      <Typography variant="body-lg-bold" className="mt-3 text-center" style={{ color: '#78350F' }}>
        {t(scanned === 'REWARD' ? 'Scan.mismatchRewardTitle' : 'Scan.mismatchCustomerTitle')}
      </Typography>
      <Typography variant="body-base-regular" className="mt-1 text-center" style={{ color: '#92400E' }}>
        {t(scanned === 'REWARD' ? 'Scan.mismatchRewardBody' : 'Scan.mismatchCustomerBody')}
      </Typography>
      <View className="mt-5 w-full gap-3">
        {options.map((o) => (
          <Pressable
            key={o.mode}
            onPress={() => onSwitch(o.mode)}
            accessibilityRole="button"
            className="items-center justify-center rounded-xl"
            style={{ minHeight: 56, backgroundColor: '#B45309' }}
          >
            <Typography variant="body-base-bold" className="text-white">
              {o.label}
            </Typography>
          </Pressable>
        ))}
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          className="items-center justify-center rounded-xl border border-gray-300 bg-white"
          style={{ minHeight: 56 }}
        >
          <Typography variant="body-base-bold" className="text-gray-700">
            {t('Scan.scanAnother')}
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}

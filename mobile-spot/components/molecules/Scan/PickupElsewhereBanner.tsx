import { Typography } from '@/components/atoms/Typography';
import type { PickupElsewhere } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

/**
 * Nothing to collect here, but the customer has a pickup order at another
 * spot of the brand (BRANDS_SPEC §4.8). A spot the staff member works at gets
 * a "Switch to {spot}" button; otherwise the customer is sent there.
 */
export function PickupElsewhereBanner({
  order,
  canSwitch,
  onSwitch,
}: {
  order: PickupElsewhere;
  canSwitch: boolean;
  onSwitch: (spotId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View
      className="rounded-2xl p-4"
      style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D' }}
      accessibilityRole="alert"
    >
      <View className="flex-row items-start">
        <Ionicons name="storefront-outline" size={22} color="#92400E" style={{ marginTop: 1 }} />
        <View className="ml-2 flex-1">
          <Typography variant="body-base-bold" style={{ color: '#78350F' }}>
            {t('Scan.elsewhereWaiting', { number: order.orderNumber, spot: order.spotName })}
          </Typography>
          {!canSwitch && (
            <Typography variant="body-base-regular" className="mt-1" style={{ color: '#92400E' }}>
              {t('Scan.elsewhereSendCustomer', { address: order.spotAddress })}
            </Typography>
          )}
        </View>
      </View>
      {canSwitch && (
        <Pressable
          onPress={() => onSwitch(order.spotId)}
          accessibilityRole="button"
          className="mt-3 items-center justify-center rounded-xl"
          style={{ minHeight: 56, backgroundColor: '#92400E' }}
        >
          <Typography variant="body-base-bold" className="text-white">
            {t('Scan.elsewhereSwitch', { spot: order.spotName })}
          </Typography>
        </Pressable>
      )}
    </View>
  );
}

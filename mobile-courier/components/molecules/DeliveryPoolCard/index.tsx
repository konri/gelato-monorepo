import { Typography } from '@/components/atoms/Typography';
import { CourierDelivery } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

type Props = {
  delivery: CourierDelivery;
  onAccept: (id: string) => Promise<void>;
};

// A broadcast delivery offered to the courier, with an Accept button.
export function DeliveryPoolCard({ delivery, onAccept }: Props) {
  const { t } = useTranslation();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept(delivery.id);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <Typography variant="body-base-bold" className="text-text-primary">
          {t('Courier.orderNumber', { number: delivery.orderNumber })}
        </Typography>
        {/* The courier's earning is the headline number, not the order total. */}
        <View className="items-end">
          <Typography variant="body-lg-bold" style={{ color: '#16A34A' }}>
            +{delivery.payout.toFixed(2)} zł
          </Typography>
          <Typography variant="body-very-small-medium" className="text-gray-400">
            {t('Courier.yourPayout')}
          </Typography>
        </View>
      </View>

      <View className="flex-row items-center mt-2">
        <Ionicons name="storefront-outline" size={16} color="#6B7280" />
        <Typography variant="body-small-regular" className="text-gray-600 ml-2 flex-1">
          {delivery.spotName}
        </Typography>
      </View>

      <View className="flex-row items-center mt-1">
        <Ionicons name="cube-outline" size={16} color="#6B7280" />
        <Typography variant="body-small-regular" className="text-gray-600 ml-2">
          {t('Courier.itemsCount', { count: delivery.itemCount })} · {delivery.total.toFixed(2)} zł
        </Typography>
      </View>

      <Pressable
        disabled={accepting}
        onPress={handleAccept}
        className="rounded-xl py-3 mt-3 items-center"
        style={{ backgroundColor: accepting ? '#D1D5DB' : '#22C55E' }}
      >
        {accepting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Typography variant="body-base-semibold" className="text-white">
            {t('Courier.accept')}
          </Typography>
        )}
      </Pressable>
    </View>
  );
}

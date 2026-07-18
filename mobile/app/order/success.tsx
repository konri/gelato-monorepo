import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OrderSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { orderNumber, orderId, cash } = useLocalSearchParams<{
    orderNumber?: string;
    orderId?: string;
    cash?: string;
  }>();
  const confettiRef = useRef<ConfettiCannon>(null);
  const isCashPickup = cash === '1';

  return (
    <View className="flex-1 bg-white items-center justify-center px-8" style={{ paddingTop: insets.top }}>
      <ConfettiCannon
        ref={confettiRef}
        count={160}
        origin={{ x: width / 2, y: -20 }}
        autoStart
        fadeOut
        fallSpeed={2800}
        colors={['#EC2828', '#E8520D', '#F2683C', '#16A34A', '#FACC15']}
      />

      <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-6">
        <Ionicons name="checkmark" size={56} color="#16A34A" />
      </View>

      <Text className="text-2xl font-urbanist-bold text-text-primary text-center">
        {t('Payment.successTitle')}
      </Text>
      <Text className="font-urbanist text-text-secondary text-center mt-2">
        {t(isCashPickup ? 'Payment.successPickupCash' : 'Payment.successMessage')}
      </Text>
      {orderNumber ? (
        <Text className="font-urbanist-bold text-accent text-center mt-3">
          {t('Payment.orderNumber', { number: orderNumber })}
        </Text>
      ) : null}

      <View className="w-full mt-10">
        <Pressable
          className="bg-accent rounded-2xl py-4 items-center mb-3"
          onPress={() =>
            orderId ? router.replace(`/order/track/${orderId}`) : router.replace('/(tabs)/ordering')
          }
        >
          <Text className="text-white font-urbanist-bold text-base">{t('Payment.trackOrder')}</Text>
        </Pressable>
        <Pressable className="py-3 items-center" onPress={() => router.replace('/(tabs)')}>
          <Text className="font-urbanist-semibold text-text-secondary">{t('Payment.backHome')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

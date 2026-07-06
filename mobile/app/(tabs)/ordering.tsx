import { MyOrders } from '@/components/ordering/MyOrders';
import { OrderNow } from '@/components/ordering/OrderNow';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Segment = 'order' | 'orders';

export default function OrderingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [segment, setSegment] = useState<Segment>('order');

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 pt-2 pb-3">
        <Text className="text-2xl font-urbanist-bold text-text-primary">{t('Tabs.ordering')}</Text>
      </View>

      {/* Segmented top tabs */}
      <View className="flex-row border-b border-gray-200">
        <SegmentTab
          label={t('Ordering.orderNow')}
          active={segment === 'order'}
          onPress={() => setSegment('order')}
        />
        <SegmentTab
          label={t('Ordering.myOrders')}
          active={segment === 'orders'}
          onPress={() => setSegment('orders')}
        />
      </View>

      {segment === 'order' ? <OrderNow /> : <MyOrders />}
    </View>
  );
}

const SegmentTab = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable className="flex-1 items-center py-3" onPress={onPress}>
    <Text
      className={`font-urbanist-semibold ${active ? 'text-accent' : 'text-text-secondary'}`}
    >
      {label}
    </Text>
    <View
      className={`mt-2 h-0.5 w-full ${active ? 'bg-accent' : 'bg-transparent'}`}
    />
  </Pressable>
);

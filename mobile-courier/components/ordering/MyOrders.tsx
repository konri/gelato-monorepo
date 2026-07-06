import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useMyOrders } from '@/hooks/useOrders';
import type { OrderListEntry } from '@repo/api-client';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { STATUS_STYLE } from './orderStatus';

const zl = (n: number) => `${n.toFixed(2).replace(/\.00$/, '')} zł`;

export const MyOrders = () => {
  const { t } = useTranslation();
  const { data: orders, loading, refetch } = useMyOrders();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  if (loading && !orders) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#EC2828" />
      </View>
    );
  }

  return (
    <FlatList
      data={orders ?? []}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_TOTAL_HEIGHT + 8, flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
      }
      ListEmptyComponent={
        <View className="mt-8 bg-background-secondary rounded-2xl p-8 items-center">
          <Text className="text-5xl mb-3">🧾</Text>
          <Text className="font-urbanist-bold text-text-primary text-center">
            {t('Ordering.myOrdersEmpty')}
          </Text>
          <Text className="font-urbanist text-text-secondary text-center mt-1">
            {t('Ordering.myOrdersComingSoon')}
          </Text>
        </View>
      }
      renderItem={({ item }) => <OrderCard order={item} />}
    />
  );
};

const OrderCard = ({ order }: { order: OrderListEntry }) => {
  const { t } = useTranslation();
  const style = STATUS_STYLE[order.status];
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const date = new Date(order.createdAt);
  const dateLabel = `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  return (
    <Pressable
      className="bg-white rounded-2xl border border-gray-200 p-4 mb-3"
      onPress={() => router.push(`/order/track/${order.id}`)}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-urbanist-bold text-text-primary">
          {t('Ordering.orderNo', { number: order.orderNumber })}
        </Text>
        <View className={`rounded-full px-3 py-1 ${style.bg}`}>
          <Text className={`text-xs font-urbanist-bold ${style.text}`}>
            {t(`Ordering.status.${order.status}`)}
          </Text>
        </View>
      </View>

      <Text className="text-xs font-urbanist text-text-tertiary mt-1">{dateLabel}</Text>

      <View className="flex-row items-center mt-2">
        <Text className="text-sm font-urbanist text-text-secondary flex-1" numberOfLines={1}>
          {order.spot?.name ?? '—'} → {order.deliveryAddress}
        </Text>
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-xs font-urbanist text-text-secondary">
          {t('Ordering.itemsCount', { count: itemCount })}
        </Text>
        <Text className="font-urbanist-bold text-text-primary">{zl(order.total)}</Text>
      </View>
    </Pressable>
  );
};

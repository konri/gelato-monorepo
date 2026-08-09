import {
  View,
  Text,
  Pressable,
  RefreshControl,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { PointTransaction } from '@repo/api-client';
import { usePointTransactions } from '@/hooks/usePointTransactions';

const getTransactionIcon = (type: string, referenceType?: string | null) => {
  if (type === 'EARNED' && referenceType === 'order') {
    return { name: 'cart-outline', color: '#10B981', bg: 'bg-green-100' };
  }
  if (type === 'EARNED' && referenceType === 'scan') {
    return { name: 'qr-code-outline', color: '#3B82F6', bg: 'bg-blue-100' };
  }
  if (type === 'BONUS' || type === 'BIRTHDAY') {
    return { name: 'gift-outline', color: '#8B5CF6', bg: 'bg-purple-100' };
  }
  if (type === 'REFERRAL') {
    return { name: 'people-outline', color: '#EC4899', bg: 'bg-pink-100' };
  }
  if (type === 'SPENT') {
    return { name: 'arrow-down-outline', color: '#EF4444', bg: 'bg-red-100' };
  }
  return { name: 'star-outline', color: '#F59E0B', bg: 'bg-amber-100' };
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: transactions, loading, refetch } = usePointTransactions();

  const renderTransactionCard = ({ item: transaction }: { item: PointTransaction }) => {
    const iconData = getTransactionIcon(transaction.type, transaction.referenceType);
    const hasOrderDetails = transaction.referenceType === 'order' && transaction.referenceId;

    return (
      <Pressable
        key={transaction.id}
        className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4"
        onPress={() => {
          if (hasOrderDetails) {
            router.push(`/order/${transaction.referenceId}` as any);
          }
        }}
        disabled={!hasOrderDetails}
        style={{ borderWidth: 1, borderColor: '#E5E7EB' }}
      >
        <View className="px-4 py-4 flex-row items-center">
          {/* Icon */}
          <View className={`w-12 h-12 rounded-full ${iconData.bg} items-center justify-center mr-4`}>
            <Ionicons name={iconData.name as any} size={24} color={iconData.color} />
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text className="text-base font-urbanist-bold text-gray-900 mb-1">
              {transaction.description}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
              <Text className="text-sm font-urbanist text-gray-500 ml-1">
                {formatDate(transaction.createdAt)} · {formatTime(transaction.createdAt)}
              </Text>
            </View>
          </View>

          {/* Points Badge */}
          <View className="ml-2">
            <View className="bg-amber-100 rounded-full px-3 py-2 flex-row items-center">
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text className="text-base font-urbanist-bold text-amber-700 ml-1">
                +{transaction.amount}
              </Text>
            </View>
            {hasOrderDetails && (
              <View className="flex-row items-center justify-center mt-1">
                <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </Pressable>
        <Text className="text-2xl font-urbanist-bold text-gray-900">
          {t('PointsHistory.title')}
        </Text>
      </View>

      <FlatList
        data={transactions ?? []}
        renderItem={renderTransactionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-sm font-urbanist text-gray-600">
              {t('PointsHistory.subtitle')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View className="items-center justify-center py-20">
              <Ionicons name="star-outline" size={64} color="#D1D5DB" />
              <Text className="text-lg font-urbanist-bold text-gray-900 mt-4">
                {t('PointsHistory.emptyTitle')}
              </Text>
              <Text className="text-sm font-urbanist text-gray-600 text-center mt-2 px-8">
                {t('PointsHistory.emptySubtitle')}
              </Text>
              <Pressable
                className="bg-red-600 rounded-full px-6 py-3 mt-6"
                onPress={() => router.push('/(tabs)/ordering' as any)}
              >
                <Text className="text-white font-urbanist-bold">
                  {t('PointsHistory.startOrdering')}
                </Text>
              </Pressable>
            </View>
          )
        }
      />
    </View>
  );
}

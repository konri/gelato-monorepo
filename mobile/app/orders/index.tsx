import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mock data - replace with real API calls (PointTransaction from backend)
const MOCK_TRANSACTIONS = [
  {
    id: '1',
    type: 'EARNED', // From app order
    amount: 45,
    description: 'Order #ORD-2024-001',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    referenceType: 'order',
    referenceId: 'order-1',
    spotName: 'Gelato Centro',
  },
  {
    id: '2',
    type: 'EARNED', // In-person scan
    amount: 25,
    description: 'In-person purchase at Gelato Paradise',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    referenceType: 'scan',
    referenceId: null,
    spotName: 'Gelato Paradise',
  },
  {
    id: '3',
    type: 'EARNED', // From app order
    amount: 32,
    description: 'Order #ORD-2024-002',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    referenceType: 'order',
    referenceId: 'order-2',
    spotName: 'Sweet Gelato',
  },
  {
    id: '4',
    type: 'EARNED', // In-person scan
    amount: 18,
    description: 'In-person purchase at Gelato Centro',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    referenceType: 'scan',
    referenceId: null,
    spotName: 'Gelato Centro',
  },
  {
    id: '5',
    type: 'BONUS', // Birthday bonus
    amount: 700,
    description: 'Birthday bonus reward',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    referenceType: 'quest',
    referenceId: null,
    spotName: null,
  },
  {
    id: '6',
    type: 'EARNED', // From app order
    amount: 55,
    description: 'Order #ORD-2024-004',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    referenceType: 'order',
    referenceId: 'order-4',
    spotName: 'Gelato Centro',
  },
  {
    id: '7',
    type: 'REFERRAL', // Referral bonus
    amount: 500,
    description: 'Referral bonus - Friend completed first order',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    referenceType: 'referral',
    referenceId: null,
    spotName: null,
  },
  {
    id: '8',
    type: 'EARNED', // In-person scan
    amount: 30,
    description: 'In-person purchase at Gelato Paradise',
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    referenceType: 'scan',
    referenceId: null,
    spotName: 'Gelato Paradise',
  },
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Refetch data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getTransactionIcon = (type: string, referenceType: string | null) => {
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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransactionCard = ({ item: transaction }: { item: typeof MOCK_TRANSACTIONS[0] }) => {
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
            {transaction.spotName && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                <Text className="text-sm font-urbanist text-gray-500 ml-1">
                  {transaction.spotName}
                </Text>
              </View>
            )}
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
        <Text className="text-2xl font-urbanist-bold text-gray-900">Points History</Text>
      </View>

      <FlatList
        data={MOCK_TRANSACTIONS}
        renderItem={renderTransactionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-sm font-urbanist text-gray-600">
              Your point earning history from app orders, in-person scans, and bonuses
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="star-outline" size={64} color="#D1D5DB" />
            <Text className="text-lg font-urbanist-bold text-gray-900 mt-4">
              No Points History Yet
            </Text>
            <Text className="text-sm font-urbanist text-gray-600 text-center mt-2 px-8">
              Order gelato or scan your QR code at any spot to start earning points
            </Text>
            <Pressable
              className="bg-red-600 rounded-full px-6 py-3 mt-6"
              onPress={() => router.push('/(tabs)/ordering' as any)}
            >
              <Text className="text-white font-urbanist-bold">Start Ordering</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

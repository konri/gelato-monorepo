import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mock data - replace with real API calls
const MOCK_AVAILABLE_PRIZES = [
  {
    id: '1',
    title: 'Free Gelato Scoop',
    description: 'Redeem for one free scoop of any flavor',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
    pointsCost: 500,
    quantity: 50,
    claimed: 12,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: '20% Off Your Order',
    description: 'Get 20% discount on your next order',
    imageUrl: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400',
    pointsCost: 800,
    quantity: 100,
    claimed: 45,
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Gelato Merchandise',
    description: 'Limited edition branded t-shirt',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    pointsCost: 1500,
    quantity: 20,
    claimed: 5,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_PAST_PRIZES = [
  {
    id: 'p1',
    prize: {
      title: 'Free Coffee',
      pointsCost: 300,
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    },
    claimedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isRedeemed: true,
  },
  {
    id: 'p2',
    prize: {
      title: '10% Off Coupon',
      pointsCost: 400,
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
    },
    claimedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRedeemed: false,
  },
];

export default function AvailableRewardsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Refetch data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderPrizeCard = (prize: any, isPast: boolean = false, status?: 'used' | 'expired') => (
    <Pressable
      key={prize.id}
      className={`bg-white rounded-2xl overflow-hidden shadow-sm mb-4 ${
        isPast ? 'opacity-60' : ''
      }`}
      onPress={() => !isPast && router.push(`/prize/${prize.id}` as any)}
      disabled={isPast}
      style={{ borderWidth: 1, borderColor: '#E5E7EB' }}
    >
      <View className="relative">
        {/* Prize Image */}
        {(prize.imageUrl || prize.prize?.imageUrl) ? (
          <Image
            source={{ uri: prize.imageUrl || prize.prize?.imageUrl }}
            className="w-full h-48"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-48 bg-gradient-to-br from-amber-100 to-orange-100 items-center justify-center">
            <Text className="text-6xl">🎁</Text>
          </View>
        )}

        {/* Status Ribbon */}
        {status && (
          <View
            className={`absolute top-4 right-0 px-4 py-2 ${
              status === 'used' ? 'bg-green-600' : 'bg-gray-600'
            }`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text className="text-white text-xs font-urbanist-bold uppercase">
              {status === 'used' ? '✓ Used' : 'Expired'}
            </Text>
          </View>
        )}

        {/* Points Badge */}
        <View
          className="absolute top-4 left-4 bg-amber-500 rounded-full px-4 py-2 flex-row items-center"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Ionicons name="star" size={16} color="#FFF" />
          <Text className="text-white font-urbanist-bold ml-1">
            {prize.pointsCost || prize.prize?.pointsCost} pts
          </Text>
        </View>
      </View>

      <View className="p-4">
        <Text className={`text-lg font-urbanist-bold mb-2 ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
          {prize.title || prize.prize?.title}
        </Text>
        {(prize.description || prize.prize?.description) && (
          <Text className="text-sm font-urbanist text-gray-600 mb-3" numberOfLines={2}>
            {prize.description || prize.prize?.description}
          </Text>
        )}

        {/* Valid Until Date */}
        {prize.validUntil && (
          <View className="flex-row items-center">
            <Ionicons
              name="time-outline"
              size={16}
              color={isExpired(prize.validUntil) ? '#EF4444' : '#059669'}
            />
            <Text
              className={`text-xs font-urbanist-semibold ml-1 ${
                isExpired(prize.validUntil) ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {isExpired(prize.validUntil)
                ? `Expired ${formatDate(prize.validUntil)}`
                : `Valid until ${formatDate(prize.validUntil)}`}
            </Text>
          </View>
        )}

        {/* Quantity Info */}
        {!isPast && prize.quantity !== null && (
          <View className="mt-2 flex-row items-center">
            <Ionicons name="cube-outline" size={16} color="#6B7280" />
            <Text className="text-xs font-urbanist text-gray-500 ml-1">
              {prize.quantity - prize.claimed} available
            </Text>
          </View>
        )}

        {/* Claimed Date */}
        {isPast && prize.claimedAt && (
          <View className="mt-2 flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text className="text-xs font-urbanist text-gray-500 ml-1">
              Claimed {formatDate(prize.claimedAt)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  const usedPrizes = MOCK_PAST_PRIZES.filter((p) => p.isRedeemed);
  const expiredPrizes = MOCK_PAST_PRIZES.filter(
    (p) => !p.isRedeemed && isExpired(p.validUntil)
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </Pressable>
        <Text className="text-2xl font-urbanist-bold text-gray-900">Rewards</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Available Prizes Section */}
        <View className="px-6 py-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-urbanist-bold text-gray-900">
              Available Rewards
            </Text>
            <View className="bg-amber-100 rounded-full px-3 py-1">
              <Text className="text-amber-800 text-xs font-urbanist-bold">
                {MOCK_AVAILABLE_PRIZES.length} prizes
              </Text>
            </View>
          </View>

          {MOCK_AVAILABLE_PRIZES.length > 0 ? (
            MOCK_AVAILABLE_PRIZES.map((prize) => renderPrizeCard(prize))
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
              <Text className="text-5xl mb-3">🎁</Text>
              <Text className="text-gray-500 font-urbanist text-center">
                No rewards available at the moment
              </Text>
            </View>
          )}
        </View>

        {/* Past Rewards Section */}
        {(usedPrizes.length > 0 || expiredPrizes.length > 0) && (
          <View className="px-6 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-urbanist-bold text-gray-900">
                Past Rewards
              </Text>
              <View className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-gray-600 text-xs font-urbanist-bold">
                  {usedPrizes.length + expiredPrizes.length} items
                </Text>
              </View>
            </View>

            {/* Used Prizes */}
            {usedPrizes.map((prize) => renderPrizeCard(prize, true, 'used'))}

            {/* Expired Prizes */}
            {expiredPrizes.map((prize) => renderPrizeCard(prize, true, 'expired'))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

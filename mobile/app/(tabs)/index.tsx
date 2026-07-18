import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, Pressable, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Logo from '@/assets/images/logo.svg';
import Wordmark from '@/assets/images/bonapka.svg';
import { NewsFeed, NewsFeedHandle } from '@/components/molecules/NewsFeed';
import { TasksTabContent } from '@/components/molecules/Quests/TasksTabContent';
import { usePointBalance } from '@/hooks/usePointBalance';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { useMyOrders } from '@/hooks/useOrders';
import { usePrizes } from '@/hooks/usePrizes';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import QRCodeSVG from 'react-native-qrcode-svg';
import { useState, useEffect, useCallback, useRef } from 'react';

const Tab = createMaterialTopTabNavigator();

// News Tab Component
function NewsTab() {
  const [refreshing, setRefreshing] = useState(false);
  const newsFeedRef = useRef<NewsFeedHandle>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await newsFeedRef.current?.reload();
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 8 }}
      showsVerticalScrollIndicator={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#EC2828"
          colors={['#EC2828']}
        />
      }
    >
      <View className="mt-4">
        <NewsFeed ref={newsFeedRef} />
      </View>
    </ScrollView>
  );
}

// Account Tab Component
function AccountTab() {
  const { t } = useTranslation();
  const { data: pointBalance, refetch: refetchPoints } = usePointBalance();
  const { data: me, refetch: refetchMe } = useWhoAmI();
  const { data: myOrders, refetch: refetchOrders } = useMyOrders();
  const { data: prizes, refetch: refetchPrizes } = usePrizes();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchPoints(), refetchMe(), refetchOrders(), refetchPrizes()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchPoints, refetchMe, refetchOrders, refetchPrizes]);

  // Real user identity. The QR encodes the user id (scanned at a spot to award
  // points); the short loyalty code is shown as the human-readable account
  // number that staff can also type in manually.
  const userPoints = pointBalance?.availablePoints ?? 0;
  const userId = me?.id ?? '';
  const loyaltyCode = me?.loyaltyCode ?? '';
  const userQRCode = JSON.stringify({
    userId,
    type: 'LOYALTY_USER',
  });
  const totalOrders = myOrders?.length ?? 0;
  // Active prizes the user can currently afford with their point balance.
  const availablePrizes = (prizes ?? []).filter(
    (p) => p.isActive && p.pointsCost <= userPoints,
  ).length;

  const handleRedeemPoints = () => {
    router.push('/prizes' as any);
  };

  const handleViewRewards = () => {
    router.push('/rewards/available' as any);
  };

  const handleViewOrders = () => {
    router.push('/orders' as any);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 8 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#EC2828"
          colors={['#EC2828']}
        />
      }
    >
      {/* Enhanced Balance Card */}
      <View className="mx-4 mt-6">
        <View
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 shadow-lg"
          style={{
            borderWidth: 2,
            borderColor: '#FCD34D',
          }}
        >
          <Text className="text-amber-900/70 text-sm font-urbanist-semibold mb-2">
            {t('Home.yourBalance')}
          </Text>
          <Text className="text-gray-900 text-6xl font-urbanist-bold mb-2">
            {userPoints.toLocaleString()}
          </Text>
          <Text className="text-amber-900 text-lg font-urbanist-bold mb-6">
            {t('Home.points')}
          </Text>
          <Pressable
            onPress={handleRedeemPoints}
            className="bg-white rounded-2xl py-4 items-center shadow-sm"
            style={{ borderWidth: 1, borderColor: '#FCD34D' }}
          >
            <Text className="text-red-600 text-base font-urbanist-bold">
              {t('Home.redeemPoints')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* QR Code Section with Sun Icon */}
      <View className="bg-white mx-4 mt-4 rounded-3xl p-6 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-900 text-xl font-urbanist-bold">
            {t('Home.yourQrCode')}
          </Text>
          <View className="bg-amber-100 rounded-full p-2">
            <Ionicons name="sunny" size={20} color="#F59E0B" />
          </View>
        </View>
        <View className="items-center bg-white rounded-2xl p-6 border-4 border-red-600">
          <QRCodeSVG
            value={userQRCode}
            size={200}
            color="#000000"
            backgroundColor="#FFFFFF"
          />
        </View>
        <Text className="text-gray-600 text-sm font-urbanist text-center mt-4">
          {t('Home.qrInstructions')}
        </Text>

        {/* Account Number */}
        <View className="mt-4 bg-gray-50 rounded-xl py-3 px-4">
          <Text className="text-xs text-gray-500 text-center font-urbanist mb-1">
            {t('Home.accountNumber')}
          </Text>
          <Text className="text-sm font-mono font-urbanist-bold text-gray-900 text-center">
            {loyaltyCode || '—'}
          </Text>
        </View>
      </View>

      {/* Clickable Stats Cards */}
      <View className="mx-4 mt-4">
        <View className="flex-row gap-3">
          {/* Rewards Available */}
          <Pressable
            onPress={handleViewRewards}
            className="flex-1 bg-white rounded-2xl p-4 shadow-sm active:opacity-70"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="gift-outline" size={24} color="#EC2828" />
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 text-2xl font-urbanist-bold mt-2">
              {availablePrizes}
            </Text>
            <Text className="text-gray-600 text-sm font-urbanist mt-1">
              {t('Home.rewardsAvailable')}
            </Text>
          </Pressable>

          {/* Total Orders */}
          <Pressable
            onPress={handleViewOrders}
            className="flex-1 bg-white rounded-2xl p-4 shadow-sm active:opacity-70"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="ice-cream-outline" size={24} color="#EC2828" />
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 text-2xl font-urbanist-bold mt-2">
              {totalOrders}
            </Text>
            <Text className="text-gray-600 text-sm font-urbanist mt-1">
              {t('Home.totalOrders')}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

// Tasks Tab Component
function TasksTab() {
  return <TasksTabContent />;
}

export default function StartScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: unreadCount } = useUnreadNotificationsCount();
  const hasUnread = (unreadCount ?? 0) > 0;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header with title and icons */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
        <View className="flex-1 flex-row items-center">
          <Logo width={30} height={30} />
          <Wordmark width={104} height={22} style={{ marginLeft: 6 }} />
        </View>

        <View className="flex-row items-center gap-4">
          {/* Notifications icon with badge */}
          <Pressable
            onPress={() => router.push('/notification_center' as any)}
            className="relative"
          >
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            {/* Unread count badge */}
            {hasUnread && (
              <View className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full items-center justify-center">
                <Text className="text-white text-[10px] font-urbanist-bold">
                  {(unreadCount ?? 0) > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Settings icon */}
          <Pressable onPress={() => router.push('/settings' as any)}>
            <Ionicons name="settings-outline" size={24} color="#212121" />
          </Pressable>
        </View>
      </View>

      {/* Material Top Tabs */}
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#EC2828',
          tabBarInactiveTintColor: '#6B7280',
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            textTransform: 'none',
            fontFamily: 'Urbanist-SemiBold',
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#EC2828',
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: 'white',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          },
          swipeEnabled: false,
        }}
      >
        <Tab.Screen
          name="News"
          component={NewsTab}
          options={{
            tabBarLabel: t('Home.news'),
          }}
        />
        <Tab.Screen
          name="Account"
          component={AccountTab}
          options={{
            tabBarLabel: t('Home.account'),
          }}
        />
        <Tab.Screen
          name="Tasks"
          component={TasksTab}
          options={{
            tabBarLabel: t('Home.tasks'),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

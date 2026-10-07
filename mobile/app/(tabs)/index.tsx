import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, Pressable, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Lockup from '@/assets/images/loodly_lockup.svg';
import { MyCard } from '@/components/molecules/Loyalty/MyCard';
import { NewsFeed, NewsFeedHandle } from '@/components/molecules/NewsFeed';
import { TasksTabContent } from '@/components/molecules/Quests/TasksTabContent';
import { useBrandContext } from '@/hooks/useBrands';
import { useReturnToMyCardOnResume } from '@/hooks/useReturnToMyCard';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
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

// My card (default tab, BRANDS_SPEC §5.4)
function AccountTab() {
  return <MyCard />;
}

// Tasks Tab Component
function TasksTab() {
  return <TasksTabContent />;
}

type HomeSection = 'news' | 'account' | 'tasks';
const handledBrandParams = new Set<string>();
const ROUTE_FOR_SECTION: Record<HomeSection, string> = {
  news: 'News',
  account: 'Account',
  tasks: 'Tasks',
};

export default function StartScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: unreadCount } = useUnreadNotificationsCount();
  const hasUnread = (unreadCount ?? 0) > 0;

  // Deep links / push taps: /(tabs)?section=account&brandId=…&t=… opens My
  // card (with that brand). A new `t` remounts the top tabs on that section.
  const params = useLocalSearchParams<{ section?: string; brandId?: string; t?: string }>();
  const section: HomeSection =
    params.section === 'news' || params.section === 'tasks' ? params.section : 'account';
  const { selectBrand } = useBrandContext();
  useEffect(() => {
    if (!params.brandId) return;
    // Each push tap selects once (`t`), so a remount does not undo a later
    // choice in the picker.
    const key = `${params.brandId}:${params.t ?? ''}`;
    if (handledBrandParams.has(key)) return;
    handledBrandParams.add(key);
    selectBrand(params.brandId, 'push');
  }, [params.brandId, params.t, selectBrand]);

  // The top tabs open on My card only when they mount; after ≥ 5 minutes in
  // the background the app comes back there too (review #5).
  useReturnToMyCardOnResume();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header with title and icons. Compact: My card must fit above the
          fold on small phones (BRANDS_SPEC §5.4). */}
      <View className="flex-row items-center justify-between px-6 py-2 border-b border-gray-200">
        <View className="flex-1 flex-row items-center">
          <Lockup width={64} height={44} />
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
        key={params.t ?? 'home'}
        initialRouteName={ROUTE_FOR_SECTION[section]}
        screenOptions={{
          tabBarActiveTintColor: '#EC2828',
          tabBarInactiveTintColor: '#6B7280',
          tabBarLabelStyle: {
            fontSize: 16,
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

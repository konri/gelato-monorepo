import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { MenuItemModal } from '@/components/molecules/MenuItemModal';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useRole } from '@/hooks/useRole';
import { useSpotMenu } from '@/hooks/useSpotMenu';
import type { MenuItem } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MenuScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  const { isAdmin } = useRole();
  const { sections, spotId, loading, error, refetch, toggleAvailability, removeItem } =
    useSpotMenu();

  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const confirmDelete = (item: MenuItem) => {
    Alert.alert(t('SpotMenu.deleteConfirm'), item.title, [
      { text: t('SpotMenu.cancel'), style: 'cancel' },
      { text: t('SpotMenu.delete'), style: 'destructive', onPress: () => void removeItem(item) },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header carries the safe-area top padding so the status-bar strip is
          white, not the gray page background (avoids a two-toned top). */}
      <View
        className="border-b border-gray-200 bg-white px-6 py-4"
        style={{ paddingTop: isWide ? 16 : insets.top + 12 }}
      >
        <ResponsiveContainer>
          <View className="flex-row items-center justify-between">
            <View>
              <Typography variant={isWide ? 'heading-32-bold' : 'body-lg-bold'} className="text-text-primary">
                {t('SpotMenu.title')}
              </Typography>
              {isWide && (
                <Typography variant="body-small-regular" className="text-gray-500">
                  {t('SpotMenu.subtitle')}
                </Typography>
              )}
            </View>
            {isAdmin && (
              <Pressable
                onPress={() => setCreating(true)}
                className="flex-row items-center rounded-xl px-4 py-2.5"
                style={{ backgroundColor: '#EC2828' }}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Typography variant="body-small-bold" className="ml-1 text-white">
                  {t('SpotMenu.addItem')}
                </Typography>
              </Pressable>
            )}
          </View>
        </ResponsiveContainer>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: (isWide ? 24 : TAB_BAR_TOTAL_HEIGHT) + 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
        }
      >
        <ResponsiveContainer>
          {loading && sections.length === 0 ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#EC2828" />
            </View>
          ) : error ? (
            <View className="items-center px-8 py-16">
              <Ionicons name="warning-outline" size={44} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="mt-4 text-center text-gray-500">
                {t('SpotMenu.saveError')}
              </Typography>
            </View>
          ) : sections.length === 0 ? (
            <View className="items-center px-8 py-16">
              <Ionicons name="ice-cream-outline" size={48} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="mt-4 text-center text-gray-500">
                {t('SpotMenu.empty')}
              </Typography>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.type} className="mb-6">
                <Typography variant="body-small-bold" className="mb-2" style={{ color: '#EC2828', letterSpacing: 1 }}>
                  {t(`Spot.category.${section.type}`, { defaultValue: section.type })}
                </Typography>
                <View className="gap-2">
                  {section.items.map((item) => (
                    <MenuRow
                      key={`${item.kind}-${item.id}`}
                      item={item}
                      isAdmin={isAdmin}
                      onToggle={(next) => void toggleAvailability(item, next)}
                      onEdit={() => setEditing(item)}
                      onDelete={() => confirmDelete(item)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </ResponsiveContainer>
      </ScrollView>

      {(creating || editing) && spotId && (
        <MenuItemModal
          spotId={spotId}
          item={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void refetch();
          }}
        />
      )}
    </View>
  );
}

function MenuRow({
  item,
  isAdmin,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  isAdmin: boolean;
  onToggle: (next: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const priceLabel = `${item.price.toFixed(2)} zł`;
  return (
    <View className="flex-row items-center rounded-2xl bg-white p-3 shadow-sm">
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
        {item.imageUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Ionicons name="fast-food-outline" size={22} color="#9CA3AF" />
        ) : (
          <Ionicons name={item.kind === 'taste' ? 'ice-cream-outline' : 'cafe-outline'} size={22} color="#9CA3AF" />
        )}
      </View>
      <View className="ml-3 flex-1">
        <Typography variant="body-base-semibold" className="text-text-primary" numberOfLines={1}>
          {item.title}
        </Typography>
        <Typography variant="body-small-regular" className="text-gray-500">
          {priceLabel}
        </Typography>
      </View>

      {/* Availability toggle — both roles */}
      <Switch
        value={item.isAvailable}
        onValueChange={onToggle}
        trackColor={{ true: '#EC2828', false: '#D1D5DB' }}
        thumbColor="#fff"
      />

      {isAdmin && (
        <View className="ml-2 flex-row">
          <Pressable onPress={onEdit} hitSlop={8} className="p-2">
            <Ionicons name="create-outline" size={20} color="#6B7280" />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} className="p-2">
            <Ionicons name="trash-outline" size={20} color="#EC2828" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

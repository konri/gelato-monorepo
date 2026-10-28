import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { withSpotScope } from '@/components/hoc/withSpotScope';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { ConfirmSheet } from '@/components/molecules/ConfirmSheet';
import { CopyMenuSheet } from '@/components/molecules/CopyMenuSheet';
import { MenuItemModal } from '@/components/molecules/MenuItemModal';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useRole } from '@/hooks/useRole';
import { useSpotMenu } from '@/hooks/useSpotMenu';
import type { MenuItem } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function sectionTitle(
  section: { type: string; titleLocal?: { pl?: string; en?: string; ua?: string } | null },
  t: (key: string, options?: { defaultValue?: string }) => string,
  language: string,
) {
  const local = section.titleLocal;
  if (local) {
    const code = language.split('-')[0] as 'pl' | 'en' | 'ua';
    const name = local[code] || local.en || local.pl || local.ua;
    if (name) return name;
  }
  return t(`Ordering.category.${section.type}`, { defaultValue: section.type });
}

function MenuScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  const { activeSpot } = useActiveSpot();
  // Add / edit need MANAGE_SPOT. Removing an item is only for a published spot.
  // Availability switches are for everyone, including a spot that is not published yet.
  const isAdmin = useRole().can.editMenu;
  const canRemove = isAdmin && !!activeSpot?.isActive;
  const { sections, spotId, loading, error, refetch, toggleAvailability, removeItem } =
    useSpotMenu();

  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [copying, setCopying] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);
  const pendingDeleteRef = useRef<MenuItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  pendingDeleteRef.current = pendingDelete;
  const hasTastes = sections.some((section) => section.items.some((item) => item.kind === 'taste'));

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
    setDeleteError(null);
    setPendingDelete(item);
  };

  const runDelete = async () => {
    const item = pendingDelete;
    if (!item || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const message = await removeItem(item);
    setDeleteBusy(false);
    const current = pendingDeleteRef.current;
    if (!current || current.id !== item.id || current.kind !== item.kind) return;
    if (message == null) setPendingDelete(null);
    else setDeleteError(message || t('SpotMenu.removeError'));
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title={t('SpotMenu.title')}
        subtitle={isWide ? t('SpotMenu.subtitle') : undefined}
        spotScoped
        right={
          isAdmin ? (
            <Pressable
              onPress={() => setCreating(true)}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: '#EC2828' }}
              accessibilityLabel={t('SpotMenu.addItem')}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: (isWide ? 24 : insets.bottom) + 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
        }
      >
        <ResponsiveContainer>
          {isAdmin && spotId && (
            <Pressable
              onPress={() => setCopying(true)}
              accessibilityRole="button"
              className="mb-4 flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3"
            >
              <Ionicons name="copy-outline" size={18} color="#EC2828" />
              <Typography variant="body-base-semibold" className="ml-2" style={{ color: '#EC2828' }}>
                {t('SpotMenu.copyFrom')}
              </Typography>
            </Pressable>
          )}
          {isAdmin && activeSpot && !activeSpot.isActive && (
            <View className="mb-4 flex-row rounded-2xl bg-white px-4 py-3">
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <Typography variant="body-small-regular" className="ml-2 flex-1 text-gray-600">
                {t('SpotMenu.draftNoRemove')}
              </Typography>
            </View>
          )}
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
              <Ionicons name="restaurant-outline" size={48} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="mt-4 text-center text-gray-500">
                {t('SpotMenu.empty')}
              </Typography>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.type} className="mb-6">
                <Typography variant="body-small-bold" className="mb-2" style={{ color: '#EC2828', letterSpacing: 1 }}>
                  {sectionTitle(section, t, i18n.language)}
                </Typography>
                <View className="gap-2">
                  {section.items.map((item) => (
                    <MenuRow
                      key={`${item.kind}-${item.id}`}
                      item={item}
                      isAdmin={isAdmin}
                      canRemove={canRemove}
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

      <ConfirmSheet
        visible={!!pendingDelete}
        title={t('SpotMenu.remove')}
        message={pendingDelete ? t('SpotMenu.removeConfirm', { name: pendingDelete.title }) : undefined}
        confirmLabel={t('SpotMenu.remove')}
        cancelLabel={t('SpotMenu.cancel')}
        destructive
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void runDelete()}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />

      {spotId && (
        <CopyMenuSheet
          visible={copying}
          spotId={spotId}
          onClose={() => setCopying(false)}
          onCopied={() => {
            setCopying(false);
            void refetch();
          }}
        />
      )}

      {(creating || editing) && spotId && (
        <MenuItemModal
          spotId={spotId}
          item={editing}
          defaultKind={hasTastes ? 'taste' : 'product'}
          hasTastes={hasTastes}
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
  canRemove,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  isAdmin: boolean;
  canRemove: boolean;
  onToggle: (next: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const priceLabel = `${item.price.toFixed(2)} zł`;
  return (
    <View className="flex-row items-center rounded-2xl bg-white p-3 shadow-sm">
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ width: 56, height: 56 }} accessibilityIgnoresInvertColors />
        ) : (
          <Ionicons name={item.kind === 'taste' ? 'ice-cream-outline' : 'pricetag-outline'} size={22} color="#9CA3AF" />
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
          {canRemove && (
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('SpotMenu.remove')}
              className="p-2"
            >
              <Ionicons name="trash-outline" size={20} color="#EC2828" />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default withSpotScope(MenuScreen);

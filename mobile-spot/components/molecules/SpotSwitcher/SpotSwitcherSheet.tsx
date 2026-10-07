import { Typography } from '@/components/atoms/Typography';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useSpotState } from '@/hooks/useActiveSpot';
import { spotStore, type StaffSpotVM } from '@/stores/spotStore';
import { Ionicons } from '@expo/vector-icons';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SpotList } from './SpotList';

// Open state shared by every opener (pill, sidebar, More row, other-spots strip).
let open = false;
const listeners = new Set<() => void>();
const setOpen = (value: boolean) => {
  open = value;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getOpen = () => open;

export const openSpotSwitcher = () => setOpen(true);
export const closeSpotSwitcher = () => setOpen(false);

/**
 * "Choose spot" sheet (BRANDS_SPEC §4.3): a bottom sheet on phones, a centered
 * dialog on tablet / web. Tapping a row switches right away (no confirmation;
 * switching is cheap and reversible).
 */
export function SpotSwitcherSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { isWide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const state = useSpotState();

  const select = (spot: StaffSpotVM) => {
    onClose();
    void spotStore.setActiveSpot(spot.spotId, 'user');
  };

  const header = (
    <View className="mb-3 flex-row items-center justify-between">
      <Typography variant="body-xl-bold" className="flex-1 text-text-primary" accessibilityRole="header">
        {t('SpotSwitcher.title')}
      </Typography>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('SpotSwitcher.close')}
        className="h-12 w-12 items-center justify-center rounded-full bg-gray-100"
      >
        <Ionicons name="close" size={24} color="#212121" />
      </Pressable>
    </View>
  );

  const list = (
    <SpotList
      spots={state.spots}
      activeSpotId={state.status === 'ready' ? state.activeSpotId : null}
      lastUsedId={state.defaultSpotId}
      staffKind={state.staffKind}
      onSelect={select}
      contentPaddingBottom={isWide ? 8 : insets.bottom + 16}
    />
  );

  if (isWide) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View className="flex-1 items-center justify-center bg-black/50 p-6">
          <View className="w-full rounded-3xl bg-gray-50 p-5" style={{ maxWidth: 520, maxHeight: '85%' }}>
            {header}
            {list}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel={t('SpotSwitcher.close')} />
        <View className="rounded-t-3xl bg-gray-50 px-4 pt-4" style={{ maxHeight: '85%' }}>
          {header}
          {list}
        </View>
      </View>
    </Modal>
  );
}

/** The one sheet instance, connected to openSpotSwitcher() / closeSpotSwitcher(). */
export function SpotSwitcherHost() {
  const visible = useSyncExternalStore(subscribe, getOpen, getOpen);
  return <SpotSwitcherSheet visible={visible} onClose={closeSpotSwitcher} />;
}

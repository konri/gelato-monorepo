import { BrandLogo } from '@/components/atoms/BrandLogo';
import { useBrands } from '@/hooks/useBrands';
import type { LoyaltyWallet } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { formatNumber, pointsText } from '@/utils/formatPoints';
import { isEngaged } from '@/utils/loyaltyMode';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOverlayOpen } from '@/hooks/useOverlayOpen';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** The brand My card shows now. */
  selectedBrandId: string | null;
};

const CLOSE_DELAY_MS = 250;

/**
 * "Your points" (BRANDS_SPEC §5.5, A4): one row per brand, in server order,
 * then the brands without points and the paused ones. Only shown in MULTI
 * (≥ 2 engaged brands). Rows keep their order while the sheet is open; live
 * updates change the numbers in place.
 */
export function BrandPickerSheet({ visible, onClose, selectedBrandId }: Props) {
  const { t } = useTranslation();
  useOverlayOpen(visible);
  const insets = useSafeAreaInsets();
  const { wallets, selectBrand, setPickerOpen } = useBrands();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Freeze the row order at open (by brand id).
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    setPickerOpen(visible);
    if (visible) {
      setOrder(wallets.map((w) => w.brand.id));
      setPendingId(null);
    }
    return () => setPickerOpen(false);
    // Only on open/close: later wallet updates must not reorder rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, setPickerOpen]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const sections = useMemo(() => {
    const byId = new Map(wallets.map((w) => [w.brand.id, w]));
    const ordered: LoyaltyWallet[] = [];
    for (const id of order) {
      const w = byId.get(id);
      if (w) ordered.push(w);
      byId.delete(id);
    }
    // Brands that appeared while open go last.
    ordered.push(...byId.values());
    return {
      engaged: ordered.filter((w) => isEngaged(w)),
      others: ordered.filter((w) => !w.paused && !isEngaged(w)),
      paused: ordered.filter((w) => w.paused),
    };
  }, [wallets, order]);

  const activeId = pendingId ?? selectedBrandId;

  const handleSelect = (wallet: LoyaltyWallet) => {
    if (wallet.paused || pendingId) return;
    setPendingId(wallet.brand.id);
    void Haptics.selectionAsync();
    selectBrand(wallet.brand.id, 'user');
    AccessibilityInfo.announceForAccessibility(t('Loyalty.selectedA11y', { brand: wallet.brand.name }));
    closeTimer.current = setTimeout(onClose, CLOSE_DELAY_MS);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {!visible ? null : (
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <Pressable
            className="flex-1"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('Loyalty.close')}
          />
          <View
            className="rounded-t-3xl bg-white"
            style={{ maxHeight: '85%', paddingBottom: insets.bottom + 12 }}
            accessibilityViewIsModal
          >
            <View className="flex-row items-center px-5 pb-2 pt-4">
              <Text
                accessibilityRole="header"
                className="flex-1 font-urbanist text-gray-900"
                style={{ fontSize: 24, lineHeight: 30, fontWeight: '700' }}
                maxFontSizeMultiplier={1.4}
              >
                {t('Loyalty.pickerTitle')}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('Loyalty.close')}
                className="flex-row items-center rounded-full bg-gray-100 px-3 active:opacity-80"
                style={{ minHeight: 48 }}
              >
                <Ionicons name="close" size={22} color="#111827" />
                <Text
                  className="ml-1 font-urbanist text-gray-900"
                  style={{ fontSize: 17, fontWeight: '700' }}
                  maxFontSizeMultiplier={1.3}
                >
                  {t('Loyalty.close')}
                </Text>
              </Pressable>
            </View>
            <Text
              className="px-5 font-urbanist"
              style={{ fontSize: 17, lineHeight: 23, color: '#4B5563' }}
              maxFontSizeMultiplier={1.5}
            >
              {t('Loyalty.pickerRule')}
            </Text>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
              {sections.engaged.map((w) => (
                <BrandRow key={w.brand.id} wallet={w} selected={w.brand.id === activeId} onPress={handleSelect} />
              ))}
              {sections.others.length > 0 ? (
                <>
                  <SectionTitle text={t('Loyalty.noPointsYet')} />
                  {sections.others.map((w) => (
                    <BrandRow
                      key={w.brand.id}
                      wallet={w}
                      selected={w.brand.id === activeId}
                      onPress={handleSelect}
                    />
                  ))}
                </>
              ) : null}
              {sections.paused.length > 0 ? (
                <>
                  <SectionTitle text={t('Loyalty.pickerPaused')} />
                  {sections.paused.map((w) => (
                    <BrandRow key={w.brand.id} wallet={w} selected={false} onPress={handleSelect} />
                  ))}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      )}
    </Modal>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <Text
      accessibilityRole="header"
      className="mb-2 mt-3 font-urbanist text-gray-900"
      style={{ fontSize: 20, lineHeight: 26, fontWeight: '700' }}
      maxFontSizeMultiplier={1.4}
    >
      {text}
    </Text>
  );
}

type Status = { text: string; tone: 'green' | 'amber' | 'grey'; icon?: 'gift' | 'star' | 'pause' };

function useRowStatus(wallet: LoyaltyWallet): Status | null {
  const { t } = useTranslation();
  if (wallet.paused) return { text: t('Loyalty.rowPaused'), tone: 'grey', icon: 'pause' };
  if (wallet.readyToPickUpCount > 0) {
    return { text: t('Loyalty.rowReady', { count: wallet.readyToPickUpCount }), tone: 'green', icon: 'gift' };
  }
  if (wallet.affordableRewardCount > 0) return { text: t('Loyalty.rowCanGet'), tone: 'amber', icon: 'star' };
  if (wallet.availablePoints > 0) {
    // No reward to aim for (empty catalog): the points say enough.
    return wallet.pointsToNextReward
      ? { text: t('Loyalty.rowToNext', { count: wallet.pointsToNextReward }), tone: 'grey' }
      : null;
  }
  return { text: t('Loyalty.rowStart'), tone: 'grey' };
}

const TONES = {
  green: { bg: '#DCFCE7', fg: '#166534' },
  amber: { bg: '#FEF3C7', fg: '#92400E' },
  grey: { bg: 'transparent', fg: '#4B5563' },
} as const;

function BrandRow({
  wallet,
  selected,
  onPress,
}: {
  wallet: LoyaltyWallet;
  selected: boolean;
  onPress: (w: LoyaltyWallet) => void;
}) {
  const { t } = useTranslation();
  const status = useRowStatus(wallet);
  const tone = TONES[status?.tone ?? 'grey'];
  const points = wallet.availablePoints;
  const label = [wallet.brand.name, pointsText(t, points), status?.text].filter(Boolean).join('. ') + '.';

  return (
    <Pressable
      onPress={() => onPress(wallet)}
      disabled={wallet.paused}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected, disabled: wallet.paused }}
      accessibilityLabel={label}
      className="mb-2 flex-row items-center rounded-2xl px-3 py-2 active:opacity-80"
      style={{
        minHeight: 72,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#EC2828' : '#E5E7EB',
        backgroundColor: selected ? '#FEF2F2' : wallet.paused ? '#F9FAFB' : '#FFFFFF',
      }}
    >
      <BrandLogo brand={wallet.brand} size={48} muted={wallet.paused} />
      <View className="ml-3 flex-1">
        <Text
          className="font-urbanist"
          style={{ fontSize: 20, lineHeight: 25, fontWeight: '700', color: wallet.paused ? '#4B5563' : '#111827' }}
          numberOfLines={2}
          maxFontSizeMultiplier={1.4}
        >
          {wallet.brand.name}
        </Text>
        {status ? (
          <View
            className="mt-1 flex-row items-center self-start rounded-full"
            style={{
              backgroundColor: tone.bg,
              paddingHorizontal: status.tone === 'grey' ? 0 : 8,
              paddingVertical: status.tone === 'grey' ? 0 : 2,
            }}
          >
            {status.icon ? <Ionicons name={status.icon} size={16} color={tone.fg} /> : null}
            <Text
              className={status.icon ? 'ml-1 font-urbanist' : 'font-urbanist'}
              style={{ fontSize: 16, lineHeight: 21, fontWeight: '600', color: tone.fg, flexShrink: 1 }}
              maxFontSizeMultiplier={1.4}
            >
              {status.text}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="ml-2 items-end">
        <Text
          className="font-urbanist"
          style={{ fontSize: 24, lineHeight: 30, fontWeight: '700', color: wallet.paused ? '#4B5563' : '#111827' }}
          maxFontSizeMultiplier={1.3}
        >
          {formatNumber(points)}
        </Text>
        <Text
          className="font-urbanist"
          style={{ fontSize: 16, lineHeight: 20, color: '#4B5563' }}
          maxFontSizeMultiplier={1.3}
        >
          {t('Loyalty.pointsUnit', { count: points })}
        </Text>
      </View>
      {!wallet.paused ? (
        <View
          className="ml-3 items-center justify-center rounded-full"
          style={{ width: 26, height: 26, borderWidth: 2, borderColor: selected ? '#EC2828' : '#9CA3AF' }}
        >
          {selected ? <View className="rounded-full bg-accent" style={{ width: 14, height: 14 }} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

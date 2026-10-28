import { Typography } from '@/components/atoms/Typography';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  copySpotMenu,
  getBrandMenuSources,
  getMenuToCopy,
  type CopyProduct,
  type CopyTaste,
  type MenuCopyPreview,
  type MenuSourceSpot,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TYPE_ORDER = [
  'SORBET',
  'MILK',
  'GELATO',
  'VEGAN',
  'TASTE',
  'ICE_CREAM_BOX',
  'COFFEE',
  'BEVERAGE',
  'DESSERT',
  'SANDWICH',
  'BREAD',
  'PASTRY',
  'MERCHANDISE',
];

type Row = {
  key: string;
  title: string;
  price: number;
  isAvailable: boolean;
  section: string;
  sectionLabel: string;
};

function localName(value: unknown, language: string): string {
  let row: Record<string, string> | null = null;
  if (typeof value === 'string') {
    try {
      row = JSON.parse(value) as Record<string, string>;
    } catch {
      return value;
    }
  } else if (value && typeof value === 'object') {
    row = value as Record<string, string>;
  }
  if (!row) return '';
  const code = language.split('-')[0];
  return row[code] || row.en || row.pl || row.ua || '';
}

function sectionRank(key: string): number {
  const index = TYPE_ORDER.indexOf(key);
  if (index !== -1) return index;
  if (key.startsWith('cat:')) return 50;
  if (key === 'OTHER') return 60;
  return 70;
}

function rowsOf(preview: MenuCopyPreview, t: (key: string, options?: { defaultValue?: string }) => string, language: string): Row[] {
  const tastes: Row[] = preview.tastes.map((taste: CopyTaste) => ({
    key: `taste:${taste.id}`,
    title: taste.title,
    price: taste.price,
    isAvailable: taste.isAvailable,
    section: taste.type,
    sectionLabel: t(`Ordering.category.${taste.type}`, { defaultValue: taste.type }),
  }));
  const products: Row[] = preview.products.map((product: CopyProduct) => {
    const section = product.menuCategory ? `cat:${product.menuCategory.id}` : product.type;
    const named = product.menuCategory ? localName(product.menuCategory.nameLocal, language) : '';
    return {
      key: `product:${product.id}`,
      title: product.name,
      price: product.price,
      isAvailable: product.isAvailable,
      section,
      sectionLabel: named || t(`Ordering.category.${product.type}`, { defaultValue: product.type }),
    };
  });
  return [...tastes, ...products];
}

function groupRows(rows: Row[]): { key: string; label: string; rows: Row[] }[] {
  const bySection = new Map<string, { label: string; rows: Row[] }>();
  for (const row of rows) {
    const group = bySection.get(row.section) ?? { label: row.sectionLabel, rows: [] };
    group.rows.push(row);
    bySection.set(row.section, group);
  }
  return [...bySection.entries()]
    .sort((a, b) => {
      const rank = sectionRank(a[0]) - sectionRank(b[0]);
      if (rank !== 0) return rank;
      return a[1].label.localeCompare(b[1].label, 'pl');
    })
    .map(([key, group]) => ({ key, label: group.label, rows: group.rows }));
}

export function CopyMenuSheet({
  visible,
  spotId,
  onClose,
  onCopied,
}: {
  visible: boolean;
  spotId: string;
  onClose: () => void;
  onCopied: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { isWide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const open = useRef(visible);
  open.current = visible;
  const previewTicket = useRef(0);

  const [loadKey, setLoadKey] = useState(0);
  const [sources, setSources] = useState<MenuSourceSpot[] | null>(null);
  const [sourcesError, setSourcesError] = useState(false);
  const [step, setStep] = useState<'spots' | 'items'>('spots');
  const [source, setSource] = useState<MenuSourceSpot | null>(null);
  const [preview, setPreview] = useState<MenuCopyPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setStep('spots');
    setSource(null);
    setPreview(null);
    setChecked(new Set());
    setError(null);
    setSources(null);
    setSourcesError(false);
    setBusy(false);
    void (async () => {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const res = await getBrandMenuSources(spotId, { token, silent: true });
      if (cancelled) return;
      if (res.error || !res.data) setSourcesError(true);
      else setSources(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, spotId, loadKey]);

  const rows = useMemo(
    () => (preview ? rowsOf(preview, t, i18n.language) : []),
    [preview, t, i18n.language],
  );
  const sections = useMemo(() => groupRows(rows), [rows]);
  const selectedCount = rows.reduce((count, row) => count + (checked.has(row.key) ? 1 : 0), 0);
  const allChecked = rows.length > 0 && selectedCount === rows.length;

  const pickSource = async (spot: MenuSourceSpot) => {
    const ticket = ++previewTicket.current;
    setSource(spot);
    setStep('items');
    setPreview(null);
    setChecked(new Set());
    setError(null);
    setPreviewLoading(true);
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getMenuToCopy(spotId, spot.id, { token, silent: true });
    if (!open.current || previewTicket.current !== ticket) return;
    setPreviewLoading(false);
    if (res.error || !res.data) {
      setError(res.error?.message || t('SpotMenu.copyError'));
      return;
    }
    setPreview(res.data);
    setChecked(
      new Set([
        ...res.data.tastes.map((taste) => `taste:${taste.id}`),
        ...res.data.products.map((product) => `product:${product.id}`),
      ]),
    );
  };

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setChecked(allChecked ? new Set() : new Set(rows.map((row) => row.key)));
  };

  const runCopy = async () => {
    if (!source || !preview || busy || selectedCount === 0) return;
    setBusy(true);
    setError(null);
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await copySpotMenu(
      {
        targetSpotId: spotId,
        sourceSpotId: source.id,
        tasteIds: preview.tastes.filter((taste) => checked.has(`taste:${taste.id}`)).map((taste) => taste.id),
        productIds: preview.products.filter((product) => checked.has(`product:${product.id}`)).map((product) => product.id),
      },
      { token, silent: true },
    );
    if (!open.current) return;
    setBusy(false);
    if (res.error || !res.data) {
      setError(res.error?.message || t('SpotMenu.copyError'));
      return;
    }
    onCopied();
  };

  const goBack = () => {
    previewTicket.current += 1;
    setPreviewLoading(false);
    setStep('spots');
    setSource(null);
    setPreview(null);
    setError(null);
    setBusy(false);
  };

  const cityOf = (spot: MenuSourceSpot) => localName(spot.cityNameLocal, i18n.language) || spot.cityName;

  const body = (
    <>
      <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
        <View className="flex-1 pr-3">
          <Typography variant="body-lg-bold" className="text-text-primary" accessibilityRole="header">
            {step === 'items' && source ? source.name : t('SpotMenu.copyTitle')}
          </Typography>
        </View>
        <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('SpotMenu.cancel')}>
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
      </View>

      <ScrollView
        style={{ maxHeight: Math.max(220, height * (isWide ? 0.72 : 0.9) - 170) }}
        contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
      >
        {!!error && (
          <View className="mb-3 rounded-xl bg-red-50 px-4 py-3" accessibilityRole="alert">
            <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
              {error}
            </Typography>
          </View>
        )}

        {step === 'spots' ? (
          sources == null && !sourcesError ? (
            <View className="items-center py-10">
              <ActivityIndicator color="#EC2828" />
            </View>
          ) : sourcesError ? (
            <View className="items-center py-8">
              <Typography variant="body-base-regular" className="text-center text-gray-500">
                {t('SpotMenu.copyError')}
              </Typography>
              <Pressable onPress={() => setLoadKey((key) => key + 1)} className="mt-4 px-3 py-2">
                <Typography variant="body-base-semibold" style={{ color: '#EC2828' }}>
                  {t('SpotMenu.copyRetry')}
                </Typography>
              </Pressable>
            </View>
          ) : sources!.length === 0 ? (
            <Typography variant="body-base-regular" className="text-center text-gray-500">
              {t('SpotMenu.copyNoSpots')}
            </Typography>
          ) : (
            <View className="gap-2">
              <Typography variant="body-small-regular" className="mb-1 text-gray-500">
                {t('SpotMenu.copyPickSpot')}
              </Typography>
              {sources!.map((spot) => (
                <Pressable
                  key={spot.id}
                  onPress={() => void pickSource(spot)}
                  accessibilityRole="button"
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3"
                >
                  <View className="flex-row items-center">
                    <View className="flex-1">
                      <Typography variant="body-base-semibold" className="text-text-primary" numberOfLines={1}>
                        {spot.name}
                      </Typography>
                      <Typography variant="body-small-regular" className="text-gray-500" numberOfLines={1}>
                        {cityOf(spot)}
                        {spot.address ? ` · ${spot.address}` : ''}
                      </Typography>
                      <Typography variant="body-small-regular" className="text-gray-500">
                        {t('SpotMenu.copyOnMenu', { count: spot.tasteCount + spot.productCount })}
                      </Typography>
                    </View>
                    {!spot.isActive && (
                      <View className="ml-2 rounded-full bg-gray-100 px-2 py-1">
                        <Typography variant="body-very-small-medium" className="text-gray-600">
                          {t('SpotMenu.copyDraft')}
                        </Typography>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </View>
                </Pressable>
              ))}
            </View>
          )
        ) : previewLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#EC2828" />
          </View>
        ) : rows.length === 0 && !error ? (
          <Typography variant="body-base-regular" className="text-center text-gray-500">
            {t('SpotMenu.copyEmptySource')}
          </Typography>
        ) : (
          <View>
            <Typography variant="body-small-regular" className="text-gray-500">
              {t('SpotMenu.copyPickItems')}
            </Typography>
            <Typography variant="body-very-small-regular" className="mt-1 text-gray-400">
              {t('SpotMenu.copyAdded')}
            </Typography>
            {rows.length > 0 && (
              <Pressable onPress={toggleAll} className="mt-3 self-start py-1" accessibilityRole="button">
                <Typography variant="body-small-semibold" style={{ color: '#EC2828' }}>
                  {allChecked ? t('SpotMenu.copyClear') : t('SpotMenu.copySelectAll')}
                </Typography>
              </Pressable>
            )}
            {sections.map((section) => (
              <View key={section.key} className="mt-4">
                <Typography variant="body-small-bold" style={{ color: '#EC2828', letterSpacing: 1 }}>
                  {section.label}
                </Typography>
                <View className="mt-2 gap-2">
                  {section.rows.map((row) => {
                    const on = checked.has(row.key);
                    return (
                      <Pressable
                        key={row.key}
                        onPress={() => toggle(row.key)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        className="flex-row items-center rounded-xl bg-gray-50 px-3 py-3"
                      >
                        <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? '#EC2828' : '#9CA3AF'} />
                        <View className="ml-3 flex-1">
                          <Typography variant="body-base-semibold" className="text-text-primary" numberOfLines={1}>
                            {row.title}
                          </Typography>
                          <Typography variant="body-small-regular" className="text-gray-500">
                            {row.price.toFixed(2)} zł{row.isAvailable ? '' : ` · ${t('SpotMenu.copyOff')}`}
                          </Typography>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-gray-100 px-5 py-4">
        <Pressable
          onPress={step === 'items' ? goBack : onClose}
          accessibilityRole="button"
          className="flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white"
          style={{ minHeight: 52 }}
        >
          <Typography variant="body-base-bold" className="text-gray-700">
            {step === 'items' ? t('SpotMenu.copyBack') : t('SpotMenu.cancel')}
          </Typography>
        </Pressable>
        {step === 'items' && (
          <Pressable
            onPress={() => void runCopy()}
            disabled={busy || selectedCount === 0 || previewLoading}
            accessibilityRole="button"
            accessibilityState={{ busy, disabled: busy || selectedCount === 0 }}
            className="flex-1 items-center justify-center rounded-xl"
            style={{ minHeight: 52, backgroundColor: busy || selectedCount === 0 ? '#F4A3A3' : '#EC2828' }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Typography variant="body-base-bold" className="text-center text-white">
                {t('SpotMenu.copyAction', { count: selectedCount })}
              </Typography>
            )}
          </Pressable>
        )}
      </View>
    </>
  );

  if (!visible) return null;

  if (isWide) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <View className="flex-1 items-center justify-center p-6">
          <Pressable style={StyleSheet.absoluteFill} className="bg-black/50" onPress={onClose} accessibilityLabel={t('SpotMenu.cancel')} />
          <View className="w-full overflow-hidden rounded-3xl bg-white" style={{ maxWidth: 560 }}>
            {body}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel={t('SpotMenu.cancel')} />
        <View className="rounded-t-3xl bg-white" style={{ paddingBottom: insets.bottom }}>
          {body}
        </View>
      </View>
    </Modal>
  );
}

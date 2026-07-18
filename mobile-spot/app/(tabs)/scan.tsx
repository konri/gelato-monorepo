import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { QrScanner } from '@/components/molecules/QrScanner';
import { LoyaltyAward } from '@/components/molecules/LoyaltyAward';
import { PrizeRedeem } from '@/components/molecules/PrizeRedeem';
import { OrderCollect } from '@/components/molecules/OrderCollect';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { getStoredSpotContext } from '@/hooks/useSpotOrders';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Mode = 'loyalty' | 'collect' | 'prize';

export default function ScanScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();

  const [mode, setMode] = useState<Mode>('loyalty');
  const [spotId, setSpotId] = useState<string | null>(null);
  // The scanned target: a customer userId (loyalty) or a prize qrCode.
  const [scanned, setScanned] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    void getStoredSpotContext().then((c) => setSpotId(c.spotId));
  }, []);

  const reset = useCallback(() => {
    setScanned(null);
    setScanError(null);
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    reset();
  };

  const handleScan = useCallback(
    (value: string) => {
      setScanError(null);
      if (mode === 'loyalty' || mode === 'collect') {
        // Both modes target a customer: loyalty QR is JSON { userId,
        // type: 'LOYALTY_USER' }; typed entry is a uuid or GL-XXXXXXXX code.
        try {
          const parsed = JSON.parse(value);
          if (parsed?.type === 'LOYALTY_USER' && parsed?.userId) {
            setScanned(parsed.userId);
            return;
          }
        } catch {
          const v = value.trim();
          if (/^[0-9a-f-]{20,}$/i.test(v) || /^GL-?[A-Z0-9]{6,}$/i.test(v)) {
            setScanned(v);
            return;
          }
        }
        setScanError(t('Scan.invalidUser'));
      } else {
        // Prize QR is "PRIZE-<uuid>".
        if (value.trim().toUpperCase().startsWith('PRIZE-')) {
          setScanned(value.trim());
        } else {
          setScanError(t('Scan.invalidPrize'));
        }
      }
    },
    [mode, t],
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: isWide ? 0 : insets.top }}>
      <View className="border-b border-gray-200 bg-white px-6 py-4">
        <ResponsiveContainer>
          <Typography variant={isWide ? 'heading-32-bold' : 'body-lg-bold'} className="text-text-primary">
            {t('Scan.title')}
          </Typography>
        </ResponsiveContainer>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: (isWide ? 24 : TAB_BAR_TOTAL_HEIGHT) + 16 }}
      >
        <ResponsiveContainer maxWidth={560}>
          {/* Mode toggle */}
          <View className="mb-4 flex-row rounded-2xl bg-gray-100 p-1">
            {(['loyalty', 'collect', 'prize'] as Mode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => switchMode(m)}
                className="flex-1 items-center rounded-xl py-2.5"
                style={{ backgroundColor: mode === m ? '#fff' : 'transparent' }}
              >
                <Typography
                  variant="body-small-bold"
                  style={{ color: mode === m ? '#EC2828' : '#6B7280' }}
                >
                  {t(m === 'loyalty' ? 'Scan.tabLoyalty' : m === 'collect' ? 'Scan.tabCollect' : 'Scan.tabPrize')}
                </Typography>
              </Pressable>
            ))}
          </View>

          {!scanned ? (
            <>
              <Typography variant="body-base-regular" className="mb-3 text-gray-600">
                {t(
                  mode === 'loyalty'
                    ? 'Scan.scanUserPrompt'
                    : mode === 'collect'
                      ? 'Scan.scanCollectPrompt'
                      : 'Scan.scanPrizePrompt',
                )}
              </Typography>
              <QrScanner onScan={handleScan} />
              {scanError && (
                <View className="mt-3 rounded-xl bg-red-50 px-4 py-3">
                  <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
                    {scanError}
                  </Typography>
                </View>
              )}
            </>
          ) : mode === 'loyalty' ? (
            <LoyaltyAward userId={scanned} spotId={spotId} onDone={reset} />
          ) : mode === 'collect' ? (
            <OrderCollect userId={scanned} spotId={spotId} onDone={reset} />
          ) : (
            <PrizeRedeem qrCode={scanned} spotId={spotId} onDone={reset} />
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

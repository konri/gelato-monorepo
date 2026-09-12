import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, Text, View } from 'react-native';

const COUNT_MS = 1100;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Loyalty balance on Start → Account. When `points` increases while the tab is
 * focused, the number counts up, the card pulses, and a green +N badge appears.
 */
export function AccountBalanceCard({
  points,
  ready,
  animateGains,
  onGain,
  onRedeem,
}: {
  points: number;
  ready: boolean;
  animateGains: boolean;
  onGain?: (delta: number) => void;
  onRedeem: () => void;
}) {
  const { t } = useTranslation();
  const [displayed, setDisplayed] = useState(points);
  const [gain, setGain] = useState(0);
  const lastPoints = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const onGainRef = useRef(onGain);
  onGainRef.current = onGain;
  const scale = useRef(new Animated.Value(1)).current;
  const gainOpacity = useRef(new Animated.Value(0)).current;
  const gainY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!ready) return;

    if (lastPoints.current === null) {
      lastPoints.current = points;
      setDisplayed(points);
      return;
    }

    const from = lastPoints.current;
    lastPoints.current = points;

    if (points === from) return;

    if (frame.current != null) cancelAnimationFrame(frame.current);

    if (points < from || !animateGains) {
      setDisplayed(points);
      setGain(0);
      return;
    }

    const delta = points - from;
    setGain(delta);
    onGainRef.current?.(delta);

    Animated.sequence([
      Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, friction: 6, tension: 140 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }),
    ]).start();

    gainOpacity.setValue(0);
    gainY.setValue(10);
    Animated.parallel([
      Animated.timing(gainOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(gainY, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();

    const started = Date.now();
    const tick = () => {
      const tNorm = Math.min(1, (Date.now() - started) / COUNT_MS);
      setDisplayed(Math.round(from + delta * easeOutCubic(tNorm)));
      if (tNorm < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        frame.current = null;
        Animated.timing(gainOpacity, { toValue: 0, duration: 420, delay: 500, useNativeDriver: true }).start(
          () => setGain(0),
        );
      }
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current != null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
        if (lastPoints.current != null) setDisplayed(lastPoints.current);
      }
    };
  }, [points, ready, animateGains, scale, gainOpacity, gainY]);

  return (
    <View className="mx-4 mt-6">
      <View
        className="rounded-3xl p-8 shadow-lg"
        style={{
          backgroundColor: '#FFFBEB',
          borderWidth: 2,
          borderColor: '#FCD34D',
        }}
      >
        <Text className="text-amber-900/70 text-sm font-urbanist-semibold mb-2">
          {t('Home.yourBalance')}
        </Text>
        <View className="flex-row items-end">
          <Animated.Text
            className="text-gray-900 text-6xl font-urbanist-bold"
            style={{ transform: [{ scale }] }}
          >
            {displayed.toLocaleString()}
          </Animated.Text>
          {gain > 0 ? (
            <Animated.Text
              className="ml-3 mb-2 text-2xl font-urbanist-bold"
              style={{
                color: '#16A34A',
                opacity: gainOpacity,
                transform: [{ translateY: gainY }],
              }}
            >
              {t('Home.pointsGained', { points: gain })}
            </Animated.Text>
          ) : null}
        </View>
        <Text className="text-amber-900 text-lg font-urbanist-bold mb-6 mt-2">
          {t('Home.points')}
        </Text>
        <Pressable
          onPress={onRedeem}
          className="bg-white rounded-2xl py-4 items-center shadow-sm"
          style={{ borderWidth: 1, borderColor: '#FCD34D' }}
        >
          <Text className="text-red-600 text-base font-urbanist-bold">
            {t('Home.redeemPoints')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

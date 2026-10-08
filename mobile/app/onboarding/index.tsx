import Lockup from '@/assets/images/loodly_lockup.svg';
import couriersScene from '@/assets/lottie/couriers.json';
import rewardsScene from '@/assets/lottie/rewards.json';
import scanScene from '@/assets/lottie/scan.json';
import { OnboardingLottie } from '@/components/onboarding/OnboardingLottie';
import { TreatsHero } from '@/components/onboarding/TreatsHero';
import {
  BACKGROUND_GRADIENT,
  COMPACT_HEIGHT,
  COPY_GAP,
  DOT_COLORS,
  MAX_FONT_SCALE,
  ONBOARDING_TYPE,
  styles,
} from '@/components/onboarding-styles';
import { useOnboarding, type OnboardingArt } from '@/hooks/useOnboarding';
import { useReduceMotionSetting } from '@/hooks/useReduceMotion';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { AnimationObject } from 'lottie-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCENES: Record<Exclude<OnboardingArt, 'treats'>, AnimationObject> = {
  scan: scanScene,
  rewards: rewardsScene,
  couriers: couriersScene,
};

type Box = { width: number; height: number };

/** Measures the space left for the illustration, then renders it to fit. */
function SlideArt({ render }: { render: (box: Box) => ReactNode }) {
  const [box, setBox] = useState<Box | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((prev) =>
      prev && Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1
        ? prev
        : { width, height },
    );
  };
  return (
    <View style={styles.art} onLayout={onLayout}>
      {box && box.width > 0 && box.height > 0 ? render(box) : null}
    </View>
  );
}

function renderArt(art: OnboardingArt, box: Box, active: boolean, still: boolean) {
  if (art === 'treats') {
    // Square; a little narrower than the screen so it doesn't touch the edges.
    const size = Math.floor(Math.min(box.width * 0.9, box.height));
    return <TreatsHero size={size} animate={active && !still} />;
  }
  const scene = SCENES[art];
  // Full screen width (the scenes have their own margins), capped by height.
  const aspect = scene.w / scene.h;
  const width = Math.floor(Math.min(box.width, box.height * aspect));
  const height = Math.floor(width / aspect);
  return <OnboardingLottie source={scene} active={active} still={still} width={width} height={height} />;
}

function Dot({ active, still }: { active: boolean; still: boolean }) {
  const width = useSharedValue(active ? 32 : 10);
  useEffect(() => {
    const target = active ? 32 : 10;
    width.value = still ? target : withTiming(target, { duration: 220 });
  }, [active, still, width]);
  const animatedStyle = useAnimatedStyle(() => ({ width: width.value }));
  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: active ? DOT_COLORS.active : DOT_COLORS.inactive },
        animatedStyle,
      ]}
    />
  );
}

/**
 * 56 dp pill button. The pressed state is tracked with onPressIn/onPressOut and
 * passed as a plain style array: NativeWind v2 drops Pressable's style
 * callback on native, which left these buttons without a background.
 */
function PillButton({
  variant,
  label,
  onPress,
}: {
  variant: 'primary' | 'secondary';
  label: string;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.button,
        primary ? styles.primary : styles.secondary,
        pressed && (primary ? styles.primaryPressed : styles.secondaryPressed),
      ]}
    >
      <Text
        style={primary ? styles.primaryText : styles.secondaryText}
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={MAX_FONT_SCALE.button}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, fontScale } = useWindowDimensions();
  // null until known: nothing moves before we know motion is welcome.
  const reduceMotion = useReduceMotionSetting();
  const still = reduceMotion !== false;
  const { pagerRef, currentPage, setCurrentPage, slides, isLastPage, nextPage, skipOnboarding } =
    useOnboarding({ reduceMotion: reduceMotion === true });

  const type = windowHeight < COMPACT_HEIGHT ? ONBOARDING_TYPE.compact : ONBOARDING_TYPE.regular;
  const titleStyle = { fontSize: type.title, lineHeight: type.titleLine };
  const bodyStyle = { fontSize: type.body, lineHeight: type.bodyLine };
  // Room for a 2-line title and a 3-line body on every slide, so titles and
  // illustrations line up from slide to slide (longer copy just takes more).
  const copyMinHeight =
    8 +
    2 * type.titleLine * Math.min(fontScale, MAX_FONT_SCALE.title) +
    COPY_GAP +
    3 * type.bodyLine * Math.min(fontScale, MAX_FONT_SCALE.body);

  const stepLabel = t('Onboarding.step', { current: currentPage + 1, total: slides.length });

  return (
    <LinearGradient
      colors={BACKGROUND_GRADIENT}
      locations={[0, 0.45, 1]}
      style={[styles.screen, { paddingTop: insets.top + 8 }]}
    >
      <StatusBar style="dark" />

      <View style={styles.header} accessible accessibilityRole="image" accessibilityLabel="Loodly">
        <Lockup width={Math.round(type.lockup * 1.45)} height={type.lockup} />
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {slides.map((slide, index) => (
          <View key={slide.art} style={styles.page} collapsable={false}>
            <SlideArt render={(box) => renderArt(slide.art, box, index === currentPage, still)} />
            <View style={[styles.copy, { minHeight: copyMinHeight }]}>
              <Text
                style={[styles.title, titleStyle]}
                accessibilityRole="header"
                maxFontSizeMultiplier={MAX_FONT_SCALE.title}
              >
                {slide.title}
              </Text>
              <Text style={[styles.body, bodyStyle]} maxFontSizeMultiplier={MAX_FONT_SCALE.body}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </PagerView>

      <View style={styles.dots} accessible accessibilityLabel={stepLabel}>
        {slides.map((slide, index) => (
          <Dot key={slide.art} active={index === currentPage} still={still} />
        ))}
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {!isLastPage ? (
          <PillButton variant="secondary" onPress={skipOnboarding} label={t('Onboarding.buttons.skip')} />
        ) : null}
        <PillButton
          variant="primary"
          onPress={nextPage}
          label={isLastPage ? t('Onboarding.buttons.getStarted') : t('Onboarding.buttons.continue')}
        />
      </View>
    </LinearGradient>
  );
}

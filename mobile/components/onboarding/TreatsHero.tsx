import { useEffect, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  CakeSliceGraphic,
  CARD_BOX,
  CoffeeCupGraphic,
  ConeGraphic,
  CroissantGraphic,
  GlowGraphic,
  LoyaltyCardGraphic,
  SparkleGraphic,
} from './TreatGraphics';

/**
 * Onboarding slide 1: the landing hero composition (HeroTreatsGraphic in
 * landing-page-new/app/components/TreatGraphics.tsx) — an ice cream cone at the
 * back, a coffee to go, a cake slice and a croissant in front, the Loodly card
 * with a barcode — with every treat bobbing on its own, staggered, like the
 * landing's float-slow / float-medium keyframes.
 *
 * `animate` false (slide off screen, Reduce Motion, setting not known yet)
 * parks every piece at rest: no offset, no tilt.
 */

// Composition space: the landing's 420×420 hero plus a margin, so a treat at
// the top of its bob never leaves the box (pages may clip on Android).
const PAD = 16;
const SPACE = 420 + PAD * 2;
const TAU = Math.PI * 2;

type Size = { width: number; height: number };

type Motion = {
  /** Height of the bob, composition units (landing: 12–18 px on a ~400 px hero). */
  lift: number;
  /** Peak tilt either way, degrees (landing: ±2–4°). */
  tilt: number;
  /** Peak scale change, for the sparkles' twinkle. */
  pulse?: number;
  /** One full bob, ms (landing float-slow 6 s, float-medium 5 s). */
  period: number;
  /** Stagger before the first bob, ms. */
  delay: number;
};

type Piece = {
  key: string;
  /** Box in the landing's 420×420 hero coordinates. */
  x: number;
  y: number;
  w: number;
  h: number;
  Graphic: ComponentType<Size>;
  motion: Motion;
};

const SmallSparkle = (props: Size) => <SparkleGraphic {...props} opacity={0.8} />;

// Paint order as on the landing: cone at the back, the card and sparkles on top.
const PIECES: Piece[] = [
  { key: 'cone', x: 140, y: 6, w: 140, h: 233, Graphic: ConeGraphic, motion: { lift: 16, tilt: 3, period: 6000, delay: 0 } },
  { key: 'coffee', x: 30, y: 160, w: 132, h: 187, Graphic: CoffeeCupGraphic, motion: { lift: 12, tilt: 3.5, period: 5000, delay: 700 } },
  { key: 'cake', x: 236, y: 210, w: 170, h: 138, Graphic: CakeSliceGraphic, motion: { lift: 12, tilt: 2.5, period: 6000, delay: 1400 } },
  { key: 'croissant', x: 112, y: 290, w: 196, h: 122, Graphic: CroissantGraphic, motion: { lift: 9, tilt: 2, period: 5500, delay: 2100 } },
  { key: 'card', x: CARD_BOX.x, y: CARD_BOX.y, w: CARD_BOX.w, h: CARD_BOX.h, Graphic: LoyaltyCardGraphic, motion: { lift: 10, tilt: 3, period: 5000, delay: 350 } },
  { key: 'sparkle', x: 46, y: 92, w: 24, h: 24, Graphic: SparkleGraphic, motion: { lift: 6, tilt: 0, pulse: 0.18, period: 3200, delay: 1000 } },
  { key: 'sparkleSmall', x: 384, y: 176, w: 16, h: 16, Graphic: SmallSparkle, motion: { lift: 5, tilt: 0, pulse: 0.22, period: 2800, delay: 1750 } },
];

function FloatingPiece({ piece, scale, animate }: { piece: Piece; scale: number; animate: boolean }) {
  const { lift, tilt, pulse = 0, period, delay } = piece.motion;
  // One full turn per bob: lift follows (1 - cos), tilt and pulse follow sin,
  // so the loop is seamless and phase 0 is the resting pose.
  const phase = useSharedValue(0);

  useEffect(() => {
    if (!animate) {
      cancelAnimation(phase);
      phase.value = 0;
      return undefined;
    }
    phase.value = 0;
    phase.value = withDelay(
      delay,
      withRepeat(withTiming(TAU, { duration: period, easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(phase);
  }, [animate, delay, period, phase]);

  const liftPx = lift * scale;
  const animatedStyle = useAnimatedStyle(() => {
    const t = phase.value;
    return {
      transform: [
        { translateY: (-liftPx * (1 - Math.cos(t))) / 2 },
        { rotate: `${tilt * Math.sin(t)}deg` },
        { scale: 1 + pulse * Math.sin(t) },
      ],
    };
  });

  const { Graphic } = piece;
  const width = piece.w * scale;
  const height = piece.h * scale;
  return (
    <Animated.View
      style={[
        styles.piece,
        { left: (piece.x + PAD) * scale, top: (piece.y + PAD) * scale, width, height },
        animatedStyle,
      ]}
    >
      <Graphic width={width} height={height} />
    </Animated.View>
  );
}

export function TreatsHero({ size, animate }: { size: number; animate: boolean }) {
  const scale = size / SPACE;
  return (
    <View
      style={{ width: size, height: size }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={StyleSheet.absoluteFill}>
        <GlowGraphic width={size} height={size} />
      </View>
      {PIECES.map((piece) => (
        <FloatingPiece key={piece.key} piece={piece} scale={scale} animate={animate} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute' },
});

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

/**
 * Building blocks of the loyalty screens, following the design rules for
 * older users (BRANDS_SPEC §5.7): text ≥ 16px (body 18, row titles 20,
 * section titles 22, screen titles 28), rows ≥ 72dp, primary buttons 56dp,
 * icon buttons 48dp with a text label, secondary text #4B5563, small red
 * text #B01E1E, badges with an icon AND text.
 */

export const COLORS = {
  text: '#111827',
  secondary: '#4B5563',
  red: '#B01E1E',
  accent: '#EC2828',
  green: '#166534',
  greenBg: '#DCFCE7',
  amber: '#92400E',
  amberBg: '#FEF3C7',
  border: '#E5E7EB',
  muted: '#F3F4F6',
} as const;

type LTextProps = TextProps & {
  size?: number;
  weight?: '400' | '500' | '600' | '700';
  color?: string;
  lineHeight?: number;
  /** Cap for the system text size; default 1.5 (layouts survive 2.0 by wrapping). */
  max?: number;
  style?: StyleProp<TextStyle>;
};

/** Urbanist text with an explicit size (≥ 16px) and a font-scale cap. */
export function LText({
  size = 18,
  weight = '400',
  color = COLORS.text,
  lineHeight,
  max = 1.5,
  style,
  className,
  ...props
}: LTextProps) {
  return (
    <Text
      {...props}
      className={className ? `font-urbanist ${className}` : 'font-urbanist'}
      maxFontSizeMultiplier={max}
      style={[{ fontSize: size, lineHeight: lineHeight ?? Math.round(size * 1.3), fontWeight: weight, color }, style]}
    />
  );
}

export function Card({
  children,
  style,
  className = '',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  return (
    <View className={`mx-4 mt-3 rounded-3xl border border-gray-200 bg-white p-4 ${className}`} style={style}>
      {children}
    </View>
  );
}

export function SectionTitle({ text, right }: { text: string; right?: React.ReactNode }) {
  return (
    <View className="mx-4 mb-1 mt-6 flex-row items-center">
      <LText size={22} weight="700" accessibilityRole="header" className="flex-1" max={1.4}>
        {text}
      </LText>
      {right}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/** 56dp, white on red; the label is large text (20px bold) so it passes contrast. */
export function PrimaryButton({ label, onPress, icon, disabled, loading, accessibilityHint, style }: ButtonProps) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      className="flex-row items-center justify-center rounded-2xl px-4 active:opacity-80"
      style={[{ minHeight: 56, backgroundColor: disabled ? '#D1D5DB' : COLORS.accent }, style]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={22} color={disabled ? COLORS.secondary : '#FFFFFF'} /> : null}
          <LText
            size={20}
            weight="700"
            color={disabled ? COLORS.secondary : '#FFFFFF'}
            max={1.4}
            className={icon ? 'ml-2 text-center' : 'text-center'}
          >
            {label}
          </LText>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, icon, disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      className="flex-row items-center justify-center rounded-2xl border-2 border-gray-300 bg-white px-4 active:opacity-80"
      style={[{ minHeight: 56, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {icon ? <Ionicons name={icon} size={22} color={COLORS.text} /> : null}
      <LText size={18} weight="700" max={1.4} className={icon ? 'ml-2 text-center' : 'text-center'}>
        {label}
      </LText>
    </Pressable>
  );
}

/** A full-width row (≥ 72dp) that opens something: icon, text, chevron. */
export function LinkRow({
  label,
  sublabel,
  icon,
  onPress,
}: {
  label: string;
  sublabel?: string | null;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sublabel ? `${label}. ${sublabel}` : label}
      className="mx-4 mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 py-3 active:opacity-80"
      style={{ minHeight: 72 }}
    >
      {icon ? <Ionicons name={icon} size={24} color="#374151" /> : null}
      <View className={icon ? 'ml-3 flex-1' : 'flex-1'}>
        <LText size={18} weight="600">
          {label}
        </LText>
        {sublabel ? (
          <LText size={16} color={COLORS.secondary}>
            {sublabel}
          </LText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} />
    </Pressable>
  );
}

/** Small status pill: always an icon AND text (never colour alone). */
export function Badge({
  text,
  icon,
  tone = 'grey',
}: {
  text: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone?: 'green' | 'amber' | 'grey' | 'red';
}) {
  const palette = {
    green: { bg: COLORS.greenBg, fg: COLORS.green },
    amber: { bg: COLORS.amberBg, fg: COLORS.amber },
    grey: { bg: COLORS.muted, fg: COLORS.secondary },
    red: { bg: '#FEE2E2', fg: COLORS.red },
  }[tone];
  return (
    <View
      className="flex-row items-center self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: palette.bg }}
    >
      <Ionicons name={icon} size={16} color={palette.fg} />
      <LText size={16} weight="600" color={palette.fg} className="ml-1" style={{ flexShrink: 1 }} max={1.4}>
        {text}
      </LText>
    </View>
  );
}

/** Centered message with one next step (empty and error states). */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body?: string | null;
  action?: { label: string; onPress: () => void; secondary?: boolean };
}) {
  return (
    <Card className="items-center">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <Ionicons name={icon} size={32} color={COLORS.amber} />
      </View>
      <LText size={20} weight="700" className="mt-3 text-center">
        {title}
      </LText>
      {body ? (
        <LText size={18} color={COLORS.secondary} className="mt-1 text-center">
          {body}
        </LText>
      ) : null}
      {action ? (
        <View className="mt-4 self-stretch">
          {action.secondary ? (
            <SecondaryButton label={action.label} onPress={action.onPress} />
          ) : (
            <PrimaryButton label={action.label} onPress={action.onPress} />
          )}
        </View>
      ) : null}
    </Card>
  );
}

/**
 * Screen header for stack screens: a 48dp back button WITH its label, then
 * the title (28px, wraps instead of truncating).
 */
export function BackHeader({
  title,
  topInset,
  onBack,
  right,
}: {
  title?: string | null;
  topInset: number;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never)));
  return (
    <View className="border-b border-gray-200 bg-white px-4 pb-2" style={{ paddingTop: topInset + 4 }}>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={back}
          accessibilityRole="button"
          accessibilityLabel={t('Common.back')}
          className="flex-row items-center rounded-full bg-gray-100 pl-2 pr-3 active:opacity-80"
          style={{ minHeight: 48 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          <LText size={17} weight="600" max={1.3}>
            {t('Common.back')}
          </LText>
        </Pressable>
        {right}
      </View>
      {title ? (
        <LText size={28} weight="700" lineHeight={34} className="mt-2" accessibilityRole="header" max={1.3}>
          {title}
        </LText>
      ) : null}
    </View>
  );
}

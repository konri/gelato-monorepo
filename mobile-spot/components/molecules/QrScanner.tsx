import { Typography } from '@/components/atoms/Typography';
import { HandheldScannerInput, useWedgeBurst } from '@/components/molecules/Scan/HandheldScannerInput';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, TextInput, View } from 'react-native';

const REFOCUS_AFTER_SUBMIT_MS = 150;
const CAMERA_REPEAT_MS = 1500;

/** Where a code came from: the camera keeps seeing a card; a keyboard (wedge or typing) is a deliberate act. */
export type ScanSource = 'camera' | 'keyboard';
type OnScan = (value: string, source: ScanSource) => void;

/**
 * Reads a code and hands the raw string to `onScan` (BRANDS_SPEC §4.8). The
 * value is only trimmed: QR (JSON or raw), Code 128, keyboard-wedge and typed
 * codes are all parsed by the server (staffScan).
 *
 * - Web: a focused field that a USB / Bluetooth scanner types into (keyboard
 *   wedge: Enter, Tab or a fast burst without a suffix), plus manual entry.
 * - Native: the camera (QR and Code 128) with a typing field, or, in
 *   "handheld scanner" mode, a wedge field that keeps the focus.
 */
export function QrScanner({
  onScan,
  disabled,
  handheld,
}: {
  onScan: OnScan;
  disabled?: boolean;
  /** Native only: a hardware scanner instead of the camera. */
  handheld?: boolean;
}) {
  if (Platform.OS === 'web') {
    return <WebScannerInput onScan={onScan} disabled={disabled} />;
  }
  if (handheld) {
    return <NativeHandheldScanner onScan={onScan} disabled={disabled} />;
  }
  return <NativeCameraScanner onScan={onScan} disabled={disabled} />;
}

function ManualCodeInput({
  onScan,
  disabled,
  autoFocus,
  wedge,
  onFocusChange,
}: {
  onScan: OnScan;
  disabled?: boolean;
  autoFocus?: boolean;
  /**
   * Web keyboard wedge: hold the focus (window focus, after a submit), submit
   * on Tab, and on a fast burst without any suffix (useWedgeBurst).
   */
  wedge?: boolean;
  onFocusChange?: (focused: boolean) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const ref = useRef<TextInput>(null);

  useEffect(() => {
    if (!disabled && autoFocus) ref.current?.focus();
  }, [disabled, autoFocus]);

  // A scanner types into whatever has the focus: take it back when the
  // browser window regains focus.
  useEffect(() => {
    if (!wedge || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onWindowFocus = () => {
      if (!disabled) ref.current?.focus();
    };
    window.addEventListener('focus', onWindowFocus);
    return () => window.removeEventListener('focus', onWindowFocus);
  }, [wedge, disabled]);

  const submitText = (text: string) => {
    const v = text.trim();
    if (!v || disabled) return;
    onScan(v, 'keyboard');
    setValue('');
    setTimeout(() => ref.current?.focus(), REFOCUS_AFTER_SUBMIT_MS);
  };
  const burst = useWedgeBurst(submitText);

  const submit = () => {
    burst.cancel();
    submitText(value);
  };

  const onChangeText = (next: string) => {
    // Only a wedge field auto-submits; typed codes wait for Enter / Scan.
    if (wedge && burst.track(next)) return;
    setValue(next);
  };

  return (
    <>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={submit}
        submitBehavior="submit"
        onKeyPress={
          wedge
            ? (e) => {
                // Some scanners end a code with Tab instead of Enter.
                if (e.nativeEvent.key === 'Tab') {
                  e.preventDefault();
                  submit();
                }
              }
            : undefined
        }
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        editable={!disabled}
        autoFocus={autoFocus}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        placeholder={t('Scan.inputPlaceholder')}
        placeholderTextColor="#6B7280"
        accessibilityLabel={t('Scan.inputA11y')}
        className="rounded-xl border border-gray-300 px-4 text-lg"
        style={{ minHeight: 56 }}
        returnKeyType="done"
      />
      <Pressable
        onPress={submit}
        disabled={disabled || !value.trim()}
        accessibilityRole="button"
        className="mt-3 items-center justify-center rounded-xl"
        style={{ minHeight: 56, backgroundColor: disabled || !value.trim() ? '#F4A3A3' : '#EC2828' }}
      >
        <Typography variant="body-base-bold" className="text-white">
          {t('Scan.submit')}
        </Typography>
      </Pressable>
    </>
  );
}

function WebScannerInput({ onScan, disabled }: { onScan: OnScan; disabled?: boolean }) {
  const { t } = useTranslation();
  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-5">
      <View className="mb-3 flex-row items-center">
        <Ionicons name="barcode-outline" size={24} color="#EC2828" />
        <Typography variant="body-base-semibold" className="ml-2 text-text-primary">
          {t('Scan.webTitle')}
        </Typography>
      </View>
      <Typography variant="body-small-regular" className="mb-3 text-gray-600">
        {t('Scan.webHint')}
      </Typography>
      <ManualCodeInput onScan={onScan} disabled={disabled} autoFocus wedge />
    </View>
  );
}

function NativeHandheldScanner({ onScan, disabled }: { onScan: OnScan; disabled?: boolean }) {
  const { t } = useTranslation();
  const [typing, setTyping] = useState(false);
  const [manualFocused, setManualFocused] = useState(false);

  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-5">
      <HandheldScannerInput
        onScan={(v) => onScan(v, 'keyboard')}
        disabled={disabled}
        paused={typing && manualFocused}
      />
      {typing ? (
        <View className="mt-4">
          <ManualCodeInput onScan={onScan} disabled={disabled} autoFocus onFocusChange={setManualFocused} />
        </View>
      ) : (
        <Pressable
          onPress={() => setTyping(true)}
          accessibilityRole="button"
          className="mt-3 flex-row items-center justify-center rounded-xl border border-gray-300"
          style={{ minHeight: 48 }}
        >
          <Ionicons name="keypad-outline" size={18} color="#374151" />
          <Typography variant="body-base-semibold" className="ml-2 text-gray-700">
            {t('Scan.typeCodeInstead')}
          </Typography>
        </Pressable>
      )}
    </View>
  );
}

function NativeCameraScanner({ onScan, disabled }: { onScan: OnScan; disabled?: boolean }) {
  const { t } = useTranslation();
  const { isWide } = useBreakpoint();
  // Lazy require so web bundles don't pull native camera code.
  const { CameraView, useCameraPermissions } = require('expo-camera');
  const [permission, requestPermission] = useCameraPermissions();
  // One-shot guard: the camera reports the same code many times per second.
  const lastScanAt = useRef(0);

  const cameraHeight = isWide ? 'h-96' : 'h-80';

  if (!permission) {
    return <View className={`${cameraHeight} rounded-2xl bg-gray-100`} />;
  }

  return (
    <View>
      {!permission.granted ? (
        <View className="items-center rounded-2xl border border-gray-200 bg-white p-6">
          <Ionicons name="camera-outline" size={40} color="#6B7280" />
          <Typography variant="body-base-regular" className="my-3 text-center text-gray-600">
            {t('Scan.permission')}
          </Typography>
          <Pressable
            onPress={requestPermission}
            accessibilityRole="button"
            className="items-center justify-center rounded-xl px-6"
            style={{ minHeight: 48, backgroundColor: '#EC2828' }}
          >
            <Typography variant="body-base-bold" className="text-white">
              {t('Scan.grant')}
            </Typography>
          </Pressable>
        </View>
      ) : (
        <View>
          <View className={`${cameraHeight} overflow-hidden rounded-2xl bg-black`}>
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128'] }}
              onBarcodeScanned={
                disabled
                  ? undefined
                  : ({ data }: { data: string }) => {
                      const now = Date.now();
                      if (now - lastScanAt.current < CAMERA_REPEAT_MS) return;
                      lastScanAt.current = now;
                      onScan(data, 'camera');
                    }
              }
            />
            {/* Guide frame: wide enough for a Code 128 bar code, tall enough for a QR. */}
            <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
              <View
                style={{
                  width: '78%',
                  height: '62%',
                  borderWidth: 3,
                  borderColor: 'rgba(255,255,255,0.9)',
                  borderRadius: 20,
                }}
              />
            </View>
          </View>
          <Typography variant="body-small-regular" className="mt-2 text-center text-gray-600">
            {t('Scan.cameraHint')}
          </Typography>
        </View>
      )}
      <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
        <Typography variant="body-small-regular" className="mb-3 text-gray-600">
          {t('Scan.typeHint')}
        </Typography>
        <ManualCodeInput onScan={onScan} disabled={disabled} />
      </View>
    </View>
  );
}

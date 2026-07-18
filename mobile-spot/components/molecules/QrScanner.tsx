import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, TextInput, View } from 'react-native';

/**
 * Scans a QR code and hands the raw string to `onScan`.
 *
 * - Native (iOS/Android/iPad): live camera via expo-camera CameraView.
 * - Web: a focused text input that a physical USB/Bluetooth QR scanner types
 *   into (they emit the payload followed by Enter). Also allows manual entry.
 */
export function QrScanner({
  onScan,
  disabled,
}: {
  onScan: (value: string) => void;
  disabled?: boolean;
}) {
  if (Platform.OS === 'web') {
    return <WebScannerInput onScan={onScan} disabled={disabled} />;
  }
  return <NativeCameraScanner onScan={onScan} disabled={disabled} />;
}

function WebScannerInput({
  onScan,
  disabled,
}: {
  onScan: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const ref = useRef<TextInput>(null);

  // Keep the field focused so a hardware scanner's keystrokes land here.
  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onScan(v);
    setValue('');
    ref.current?.focus();
  };

  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-5">
      <View className="mb-3 flex-row items-center">
        <Ionicons name="qr-code-outline" size={22} color="#EC2828" />
        <Typography variant="body-base-semibold" className="ml-2 text-text-primary">
          {t('Scan.webTitle')}
        </Typography>
      </View>
      <Typography variant="body-small-regular" className="mb-3 text-gray-500">
        {t('Scan.webHint')}
      </Typography>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        editable={!disabled}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={t('Scan.inputPlaceholder')}
        className="rounded-xl border border-gray-300 px-4 py-3 text-base"
        returnKeyType="done"
      />
      <Pressable
        onPress={submit}
        disabled={disabled || !value.trim()}
        className="mt-3 items-center rounded-xl py-3.5"
        style={{ backgroundColor: disabled || !value.trim() ? '#F4A3A3' : '#EC2828' }}
      >
        <Typography variant="body-base-bold" className="text-white">
          {t('Scan.submit')}
        </Typography>
      </Pressable>
    </View>
  );
}

function NativeCameraScanner({
  onScan,
  disabled,
}: {
  onScan: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  // Lazy require so web bundles don't pull native camera code.
  const { CameraView, useCameraPermissions } = require('expo-camera');
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  // Reset the one-shot guard whenever scanning is re-enabled.
  useEffect(() => {
    if (!disabled) scannedRef.current = false;
  }, [disabled]);

  if (!permission) {
    return <View className="h-64 rounded-2xl bg-gray-100" />;
  }

  if (!permission.granted) {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-6">
        <Ionicons name="camera-outline" size={40} color="#9CA3AF" />
        <Typography variant="body-base-regular" className="my-3 text-center text-gray-500">
          {t('Scan.permission')}
        </Typography>
        <Pressable onPress={requestPermission} className="rounded-xl px-6 py-3" style={{ backgroundColor: '#EC2828' }}>
          <Typography variant="body-base-bold" className="text-white">
            {t('Scan.grant')}
          </Typography>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="h-72 overflow-hidden rounded-2xl bg-black">
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          disabled
            ? undefined
            : ({ data }: { data: string }) => {
                if (scannedRef.current) return;
                scannedRef.current = true;
                onScan(data);
              }
        }
      />
    </View>
  );
}

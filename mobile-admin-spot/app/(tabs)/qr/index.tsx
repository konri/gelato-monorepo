import { Button } from "@/components/atoms/Button";
import { FormInput } from "@/components/atoms/FormInput";
import { QRScannerCorners } from "@/components/atoms/QRScannerCorners";
import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { ContextSwitcher } from "@/components/molecules/ContextSwitcher";
import { BottomSheetModal } from "@/components/molecules/Modal";
import { ScannedRewardPanel } from "@/components/organisms/ScannedRewardPanel";
import type { CloseInterceptor } from "@/components/organisms/ScannedRewardPanel/types";
import { TAB_BAR_TOTAL_HEIGHT } from "@/constants/tabBarStyles";
import { useBootstrapScanStoreContextWhenFocused } from "@/hooks/useBootstrapScanStoreContextWhenFocused";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { useTabBarInset } from "@/hooks/useTabBarInset";
import { logger } from "@/utils/logger";
import { effectiveScanStoreId } from "@/utils/effectiveScanStoreId";
import { extractUserIdFromUrl } from "@/utils/urlUtils";
import { extractVenueSessionFromUrl, type VenueSessionScanPayload } from "@/utils/venueOrderQr";
import { Ionicons } from "@expo/vector-icons";
import type { BarcodeType } from "expo-camera";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  LayoutChangeEvent,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const QR_BOTTOM_INPUT_GAP = 12;
const CAMERA_MIN_HEIGHT = 220;
const INPUT_DEFAULT_HEIGHT = 56;
const RESERVED_VERTICAL_SPACE = 48;

type SearchForm = {
  userIdentifier: string;
};

export default function Qr() {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const { userId: deepLinkUserId } = useLocalSearchParams<{ userId?: string }>();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(!!deepLinkUserId);
  const [scannedUserId, setScannedUserId] = useState<string | null>(deepLinkUserId ?? null);
  const [venueSession, setVenueSession] = useState<VenueSessionScanPayload | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(!!deepLinkUserId);
  const [contextSwitcherHeight, setContextSwitcherHeight] = useState(0);
  const [inputHeight, setInputHeight] = useState(INPUT_DEFAULT_HEIGHT);
  const [maxAvailableHeight, setMaxAvailableHeight] = useState(0);
  const beforeCloseRef = useRef<CloseInterceptor>(null);

  const form = useForm<SearchForm>({
    defaultValues: { userIdentifier: "" },
  });
  const searchValue = form.watch("userIdentifier");

  const availableHeight = screenHeight - insets.top - insets.bottom - TAB_BAR_TOTAL_HEIGHT;
  const keyboardAwareBottomInset = Math.max(tabBarInset, insets.bottom + 20) + QR_BOTTOM_INPUT_GAP;
  const reservedHeight = RESERVED_VERTICAL_SPACE + contextSwitcherHeight + inputHeight;
  const cameraHeight = Math.max(CAMERA_MIN_HEIGHT, maxAvailableHeight - reservedHeight);

  const { stores, selectedScanStoreId } = useOperatorAccess();

  useBootstrapScanStoreContextWhenFocused({ enabled: true });

  const scanTargetStoreId = useMemo(
    () => effectiveScanStoreId(selectedScanStoreId, stores),
    [selectedScanStoreId, stores],
  );
  const hasNoStoreContext = !scanTargetStoreId;

  const showUserPanel = useCallback((userIdentifier: string) => {
    setVenueSession(null);
    setScannedUserId(userIdentifier);
    setIsPanelVisible(true);
    setScanned(true);
  }, []);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    setMaxAvailableHeight((previous) => Math.max(previous, availableHeight));
  }, [availableHeight]);

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;

      const venue = extractVenueSessionFromUrl(data);
      if (venue != null) {
        setVenueSession(venue);
        setScannedUserId(null);
        setIsPanelVisible(true);
        setScanned(true);
        return;
      }

      const userId = extractUserIdFromUrl(data);
      if (!userId) {
        logger.error("Scanned QR is not a valid customer userId or venue session URL:", data);
        return;
      }

      showUserPanel(userId);
    },
    [scanned, showUserPanel]
  );

  const handleClosePanel = useCallback(() => {
    if (beforeCloseRef.current?.()) return;
    setIsPanelVisible(false);
    setScanned(false);
    setScannedUserId(null);
    setVenueSession(null);
    form.reset();
    if (deepLinkUserId) {
      router.setParams({ userId: "" });
    }
  }, [form, deepLinkUserId, router]);

  const handleSearch = useCallback(
    (data: SearchForm) => {
      const trimmed = data.userIdentifier.trim();
      if (trimmed) {
        Keyboard.dismiss();
        showUserPanel(trimmed);
      }
    },
    [showUserPanel]
  );

  const handleRequestPermission = useCallback(async () => {
    try {
      await requestPermission();
    } catch (error) {
      logger.error("Error requesting camera permission:", error);
    }
  }, [requestPermission]);

  const handleContextSwitcherLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height <= 0) return;
    setContextSwitcherHeight(height);
  }, []);

  const handleInputLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height <= 0) return;
    setInputHeight(height);
  }, []);

  const barcodeScannerSettings = useMemo<{ barcodeTypes: BarcodeType[] }>(
    () => ({
      barcodeTypes: ["qr"],
    }),
    []
  );

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#EC2828" />
        <Typography variant="text-16-regular" className="text-gray-600 mt-4">
          {t("Common.loading")}
        </Typography>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center">
        <View className="items-center gap-4">
          <Typography variant="text-16-regular" className="text-center">
            {t("Common.cameraPermissionRequired")}
          </Typography>
          <Button
            title={t("Common.grantPermission")}
            onPress={handleRequestPermission}
            variant="primary"
          />
        </View>
      </View>
    );
  }

  return (
    <>
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: keyboardAwareBottomInset }}
      >
        <View className="pt-4 gap-4">
          <View onLayout={handleContextSwitcherLayout}>
            <ContextSwitcher storeOnly />
          </View>
          <View
            className="rounded-2xl overflow-hidden bg-black relative"
            style={{ height: cameraHeight }}
          >
            {isFocused ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={
                  scanned || isPanelVisible || hasNoStoreContext ? undefined : handleBarCodeScanned
                }
                barcodeScannerSettings={barcodeScannerSettings}
                onMountError={(error) => {
                  logger.error("Camera mount error:", error);
                }}
              />
            ) : (
              <View className="flex-1 bg-black" />
            )}
            <View className="absolute inset-0 justify-center items-center pointer-events-none">
              <QRScannerCorners />
            </View>
          </View>

          <View onLayout={handleInputLayout}>
            <FormProvider {...form}>
              <FormInput<SearchForm>
                name="userIdentifier"
                label=""
                placeholder={t("Scan.identifierPlaceholder")}
                variant="compact"
                iconName="search"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={form.handleSubmit(handleSearch)}
                editable={!hasNoStoreContext}
                rightIcon={
                  searchValue.trim() ? (
                    <Pressable onPress={form.handleSubmit(handleSearch)} hitSlop={8}>
                      <View className="bg-red-600 rounded-full p-1">
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                      </View>
                    </Pressable>
                  ) : undefined
                }
              />
            </FormProvider>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {isPanelVisible && (scannedUserId != null || venueSession != null) ? (
        <BottomSheetModal
          visible={isPanelVisible}
          onClose={handleClosePanel}
          title={t("Rewards.scannedCode")}
          snapPoints={["90%"]}
          enablePanDownToClose={false}
          keyboardBehavior="extend"
          keyboardBlurBehavior="restore"
          androidKeyboardInputMode="adjustResize"
        >
          <ScannedRewardPanel
            userId={scannedUserId}
            venueSession={venueSession}
            onClose={handleClosePanel}
            onBeforeCloseRef={beforeCloseRef}
          />
        </BottomSheetModal>
      ) : null}
    </>
  );
}

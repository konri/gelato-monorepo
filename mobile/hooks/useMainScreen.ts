import { MapboxSectionRef } from '@/components/molecules/Mapbox/types';
import { HOME_SHEET_SNAPS } from '@/constants/homeBottomSheet';
import { useMerchantsFilters } from '@/hooks/useMerchantsFilters';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { SharedValue, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserLocation } from './useUserLocation';

const { height: screenHeight } = Dimensions.get("window");
const HEADER_HEIGHT = 50; // px

export const useMainScreen = (detailsTranslateY: SharedValue<number>) => {
  const insets = useSafeAreaInsets();  const translateY = useSharedValue(screenHeight * HOME_SHEET_SNAPS.mid);
  const sheetPanOriginY = useSharedValue(0);
  const sheetPanStartSnapIndex = useSharedValue(0);
  const [showFullMap, setShowFullMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.9830577, 50.0926]);
  const mapRef = useRef<MapboxSectionRef>(null);
  const userLocation = useUserLocation();

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.longitude, userLocation.latitude]);
    }
  }, [userLocation]);

  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const { filters, data, actions } = useMerchantsFilters(isFiltersVisible, 200);

  const handleShowFullMap = () => {
    translateY.value = withSpring(screenHeight, { damping: 5, stiffness: 20, overshootClamping: true });
    setTimeout(() => {
      setShowFullMap(true);
      detailsTranslateY.value = withTiming(0, { duration: 600 });
    }, 800);
  };

  const handleBackToMain = () => {
    detailsTranslateY.value = withTiming(screenHeight, { duration: 600 });
    setTimeout(() => setShowFullMap(false), 600);
    translateY.value = withTiming(screenHeight * HOME_SHEET_SNAPS.mid, { duration: 800 });
  };

  const handleStorePress = (storeId: string) => router.push(`/merchant_store/${storeId}`);

  const handleCameraChanged = (center: [number, number]) => {
    if (showFullMap) setMapCenter(center);
  };

  const panGesture = useMemo(() => {
    const lo = insets.top + HEADER_HEIGHT;
    const hi = screenHeight * HOME_SHEET_SNAPS.dragMax;
    const snapExpanded = screenHeight * HOME_SHEET_SNAPS.expanded;
    const snapMid = screenHeight * HOME_SHEET_SNAPS.mid;
    const snapCollapsed = screenHeight * HOME_SHEET_SNAPS.collapsed;

    return Gesture.Pan()
      .activeOffsetY([-10, 10])
      .onBegin(() => {
        sheetPanOriginY.value = translateY.value;
        const y0 = translateY.value;
        const dists = [Math.abs(y0 - snapExpanded), Math.abs(y0 - snapMid), Math.abs(y0 - snapCollapsed)];
        let idx = 0;
        if (dists[1] < dists[idx]) idx = 1;
        if (dists[2] < dists[idx]) idx = 2;
        sheetPanStartSnapIndex.value = idx;
      })
      .onUpdate((event) => {
        translateY.value = Math.max(lo, Math.min(hi, sheetPanOriginY.value + event.translationY));
      })
      .onEnd((event) => {
        const y = translateY.value;
        const vy = event.velocityY;
        const snaps = [snapExpanded, snapMid, snapCollapsed];
        const dists = snaps.map((s) => Math.abs(y - s));
        let nearest = 0;
        if (dists[1] < dists[nearest]) nearest = 1;
        if (dists[2] < dists[nearest]) nearest = 2;
        const target = vy > 700
          ? snaps[Math.min(2, sheetPanStartSnapIndex.value + 1)]
          : vy < -700
            ? snaps[Math.max(0, sheetPanStartSnapIndex.value - 1)]
            : snaps[nearest];
        translateY.value = withSpring(target, { damping: 28, stiffness: 280 });
      });
  }, [translateY, sheetPanStartSnapIndex, insets.top]);

  return {
    translateY,
    showFullMap,
    stores: data.stores,
    stampCardStores: data.stampCardStores ?? [],
    streakStores: data.streakStores ?? [],
    isFiltersVisible,
    setIsFiltersVisible,
    activeFilters: filters.activeFilters,
    activeFiltersCount: filters.activeFiltersCount,
    draftFilters: data.draftFilters,
    filterActions: actions,
    mapRef,
    mapCenter,
    handleShowFullMap,
    handleBackToMain,
    handleStorePress,
    handleCameraChanged,
    panGesture,
  };
};

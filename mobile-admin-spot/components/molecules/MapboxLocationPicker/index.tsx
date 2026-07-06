import { config } from "@/config";
import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import Mapbox, { MapView } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  InputAccessoryView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type {
  MapboxLocationPickerProps,
  SearchSuggestion,
} from "./types";

Mapbox.setAccessToken(config.MAPBOX_ACCESS_TOKEN);

const CENTER_COORDINATE: [number, number] = [19.9368, 50.0647];
const DEFAULT_ZOOM = 14;

const MAP_SEARCH_INPUT_ACCESSORY_ID = "mapbox-location-search-accessory";

export const MapboxLocationPicker = ({
  onLocationSelect,
  initialLatitude,
  initialLongitude,
  label,
  editable = true,
}: MapboxLocationPickerProps) => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [cameraConfig, setCameraConfig] = useState({
    center: CENTER_COORDINATE,
    zoom: DEFAULT_ZOOM,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<string>(Math.random().toString(36).slice(2) + Date.now().toString(36));

  useEffect(() => {
    if (initialLatitude && initialLongitude) {
      const lat = typeof initialLatitude === "string" ? parseFloat(initialLatitude) : initialLatitude;
      const lng = typeof initialLongitude === "string" ? parseFloat(initialLongitude) : initialLongitude;
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedLocation([lng, lat]);
        setCameraConfig({
          center: [lng, lat],
          zoom: 16,
        });
      }
    }
  }, [initialLatitude, initialLongitude]);

  useEffect(() => {
    if (isModalVisible && !selectedLocation) {
      loadUserLocation();
    }
  }, [isModalVisible]);

  const loadUserLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const center: [number, number] = [
          location.coords.longitude,
          location.coords.latitude,
        ];
        setCameraConfig({
          center,
          zoom: 15,
        });
        setSelectedLocation(center);
      } else {
        setCameraConfig({
          center: CENTER_COORDINATE,
          zoom: DEFAULT_ZOOM,
        });
      }
    } catch {
      setCameraConfig({
        center: CENTER_COORDINATE,
        zoom: DEFAULT_ZOOM,
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const proximity = selectedLocation
        ? `${selectedLocation[0]},${selectedLocation[1]}`
        : `${cameraConfig.center[0]},${cameraConfig.center[1]}`;

      const params = new URLSearchParams({
        q: query,
        access_token: config.MAPBOX_ACCESS_TOKEN,
        session_token: sessionTokenRef.current,
        country: "PL",
        language: "pl",
        types: "poi,address,street,place",
        proximity,
        limit: "7",
      });

      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?${params}`
      );
      const data = await response.json();
      if (data.suggestions) {
        setSearchResults(data.suggestions);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(text);
    }, 400);
  };

  const handleSelectSearchResult = async (suggestion: SearchSuggestion) => {
    Keyboard.dismiss();
    setSearchQuery(suggestion.name);
    setSearchResults([]);

    try {
      const params = new URLSearchParams({
        access_token: config.MAPBOX_ACCESS_TOKEN,
        session_token: sessionTokenRef.current,
      });

      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?${params}`
      );
      const data = await response.json();
      const feature = data.features?.[0];

      if (feature?.geometry?.coordinates) {
        const [lng, lat] = feature.geometry.coordinates;
        setSelectedLocation([lng, lat]);
        setCameraConfig({
          center: [lng, lat],
          zoom: 16,
        });
      }
    } catch {
      // retrieve failed silently
    }

    sessionTokenRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
  };

  const handleApply = () => {
    if (selectedLocation) {
      const [lng, lat] = selectedLocation;
      onLocationSelect(lat, lng);
      setIsModalVisible(false);
    }
  };

  const handleOpenMap = () => {
    setIsModalVisible(true);
  };

  const displayText = selectedLocation
    ? `${selectedLocation[1].toFixed(6)}, ${selectedLocation[0].toFixed(6)}`
    : t("Store.selectLocation") || "Wybierz lokalizację";

  return (
    <>
      <View className="gap-2.5">
        {label && (
          <Typography variant="text-14-bold" className="text-black">
            {label}
          </Typography>
        )}
        <Pressable
          onPress={editable ? handleOpenMap : undefined}
          disabled={!editable}
          className="rounded-2xl bg-white flex-row items-center"
          style={{ paddingVertical: 10, paddingHorizontal: 14 }}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={editable ? "#212121" : "#9E9E9E"}
          />
          <View className="flex-1 ml-2">
            <Typography variant="text-14-regular-spaced" className="text-black">
              {displayText}
            </Typography>
          </View>
          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color="#9E9E9E"
          />
        </Pressable>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        {Platform.OS === "ios" ? (
          <InputAccessoryView nativeID={MAP_SEARCH_INPUT_ACCESSORY_ID}>
            <View className="flex-row items-center justify-end border-t border-gray-200 bg-white px-3 py-2">
              <Pressable
                onPress={() => Keyboard.dismiss()}
                hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
              >
                <Typography variant="text-16-semibold" className="text-navy">
                  {t("Common.keyboardDone")}
                </Typography>
              </Pressable>
            </View>
          </InputAccessoryView>
        ) : null}
        <View className="flex-1 bg-gray-50-light">
          <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
            <Typography
              variant="text-16-bold"
              className="text-black flex-1"
              numberOfLines={1}
            >
              {t("Store.selectLocation") || "Wybierz lokalizację"}
            </Typography>
            <Pressable
              onPress={() => setIsModalVisible(false)}
              className="w-9 h-9 rounded-full bg-gray-200 items-center justify-center"
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color="#374151" />
            </Pressable>
          </View>

          <View className="flex-1 px-4 gap-4">
            <View className="relative" style={{ zIndex: 10 }}>
              <TextInput
                className="rounded-2xl bg-white px-4 py-3 border border-gray-200"
                placeholder={t("Store.searchAddress") || "Wyszukaj adres..."}
                value={searchQuery}
                onChangeText={handleSearchChange}
                style={{
                  fontFamily: "Urbanist",
                  fontSize: 14,
                  color: "#212121",
                }}
                placeholderTextColor="rgba(0, 0, 0, 0.47)"
                inputAccessoryViewID={
                  Platform.OS === "ios" ? MAP_SEARCH_INPUT_ACCESSORY_ID : undefined
                }
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              {isSearching && (
                <View className="absolute right-4 top-3">
                  <ActivityIndicator size="small" color="#212121" />
                </View>
              )}
              {searchResults.length > 0 && (
                <View className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 max-h-48">
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {searchResults.map((suggestion) => (
                      <Pressable
                        key={suggestion.mapbox_id}
                        onPress={() => handleSelectSearchResult(suggestion)}
                        className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                      >
                        <Typography
                          variant="text-14-regular-spaced"
                          className="text-black"
                        >
                          {suggestion.name}
                        </Typography>
                        {suggestion.place_formatted && (
                          <Typography
                            variant="text-12-regular"
                            className="text-gray-500 mt-0.5"
                          >
                            {suggestion.place_formatted}
                          </Typography>
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View className="flex-1 rounded-2xl overflow-hidden">
              {isLoadingLocation ? (
                <View className="flex-1 items-center justify-center bg-gray-100">
                  <ActivityIndicator size="large" color="#EC2828" />
                </View>
              ) : (
                <Mapbox.MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  styleURL={Mapbox.StyleURL.Light}
                  zoomEnabled={true}
                  scrollEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  scaleBarEnabled={false}
                  compassEnabled={false}
                  logoEnabled={false}
                  attributionEnabled={false}
                  onPress={(e) => {
                    if (e.geometry.type === "Point") {
                      const coordinates = e.geometry.coordinates as [number, number];
                      if (coordinates.length === 2) {
                        setSelectedLocation(coordinates);
                      }
                    }
                  }}
                >
                  <Mapbox.Camera
                    centerCoordinate={cameraConfig.center}
                    zoomLevel={cameraConfig.zoom}
                    animationMode="flyTo"
                    animationDuration={500}
                  />

                  <Mapbox.UserLocation
                    visible={true}
                    showsUserHeadingIndicator={false}
                    minDisplacement={10}
                  />

                  {selectedLocation && (
                    <Mapbox.PointAnnotation
                      id="selected-location"
                      coordinate={selectedLocation}
                    >
                      <View
                        className="items-center justify-center"
                        style={{
                          width: 30,
                          height: 30,
                        }}
                      >
                        <View
                          className="bg-red-500 rounded-full border-2 border-white"
                          style={{
                            width: 20,
                            height: 20,
                          }}
                        />
                      </View>
                    </Mapbox.PointAnnotation>
                  )}
                </Mapbox.MapView>
              )}
            </View>

            <View className="pb-4">
              <Button
                title={t("Common.apply") || "Zastosuj"}
                onPress={handleApply}
                variant="primary"
                disabled={!selectedLocation}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

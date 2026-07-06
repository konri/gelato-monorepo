import { config } from "@/config";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { logger } from "@/utils/logger";
import Mapbox, { MapView, ShapeSource } from "@rnmapbox/maps";
import React, {
    forwardRef,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from "react";
import { View } from "react-native";
import {
    CENTER_COORDINATE,
    CLUSTER_CIRCLE_RADIUS,
    CLUSTER_CIRCLE_STROKE_COLOR,
    CLUSTER_CIRCLE_STROKE_WIDTH,
    CLUSTER_COLOR,
    CLUSTER_MAX_ZOOM,
    CLUSTER_RADIUS,
    CLUSTER_SHADOW_BLUR,
    CLUSTER_SHADOW_COLOR,
    CLUSTER_SHADOW_RADIUS_EXTRA,
    CLUSTER_SHADOW_TRANSLATE_X,
    CLUSTER_SHADOW_TRANSLATE_Y,
    DEFAULT_ICON_NAME,
    DEFAULT_ICON_PATH,
    DEFAULT_ZOOM,
    MAP_SOURCE_MAX_ZOOM,
    MAPBOX_STYLE_LIGHT_V11,
    MARKER_FAVORITE_ICON_SIZE,
    MARKER_ICON_SIZE,
    MARKERS_SOURCE_ID,
} from "./const";
import { MapboxSectionProps, MapboxSectionRef } from "./types";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

export const MapboxSection = React.memo(
  forwardRef<MapboxSectionRef, MapboxSectionProps>(
    ({ onStorePress, onCameraChanged, initialCenter, padding, stores = [] }, ref) => {
      const [cameraConfig, setCameraConfig] = useState({
        center: initialCenter || CENTER_COORDINATE,
        zoom: DEFAULT_ZOOM,
      });
      const mapRef = useRef<MapView>(null);
      const shapeSourceRef = useRef<ShapeSource | null>(null);

      const { location } = useCurrentLocation();

      const locationLat = location?.latitude;
      const locationLng = location?.longitude;

      const iconImages = useMemo(() => {
        const icons: Record<string, { uri: string }> = {
          [DEFAULT_ICON_NAME]: {
            uri: `${config.API_URL}${DEFAULT_ICON_PATH}`,
          },
        };
        const seen = new Set<string>([DEFAULT_ICON_NAME]);
        for (const store of stores ?? []) {
          const iconUrl = store.category?.iconPngUrl;
          if (iconUrl && !seen.has(iconUrl)) {
            seen.add(iconUrl);
            icons[iconUrl] = { uri: `${config.API_URL}${iconUrl}` };
          }
          const favUrl = store.favoriteIconPngUrl;
          if (store.isFavorite && favUrl && !seen.has(favUrl)) {
            seen.add(favUrl);
            icons[favUrl] = { uri: `${config.API_URL}${favUrl}` };
          }
        }
        return icons;
      }, [stores]);

      const geoJSON = useMemo(() => {
        const features =
          stores
            ?.filter(
              (
                store
              ): store is (typeof store) & {
                latitude: number;
                longitude: number;
              } =>
                typeof store.latitude === "number" &&
                typeof store.longitude === "number"
            )
            .map((store) => {
              const categoryIconPngUrl = store.category?.iconPngUrl;
              const iconName = categoryIconPngUrl || DEFAULT_ICON_NAME;
              const favoriteIconName =
                store.isFavorite && store.favoriteIconPngUrl
                  ? store.favoriteIconPngUrl
                  : "";
              return {
                type: "Feature" as const,
                geometry: {
                  type: "Point" as const,
                  coordinates: [store.longitude, store.latitude],
                },
                properties: {
                  id: store.id,
                  name: store.name,
                  categoryIconPngUrl: categoryIconPngUrl ?? "",
                  iconName,
                  favoriteIconName,
                },
              };
            }) ?? [];
        return { type: "FeatureCollection" as const, features };
      }, [stores]);

      useImperativeHandle(ref, () => ({
        flyToStore: (storeId: string) => {
          const store = stores?.find((s) => s.id === storeId);
          if (
            store &&
            typeof store.longitude === "number" &&
            typeof store.latitude === "number"
          ) {
            setCameraConfig({
              center: [store.longitude, store.latitude],
              zoom: CLUSTER_MAX_ZOOM + 1,
            });
          }
        },
      }));

      return (
        <View className="flex-1">
          <Mapbox.MapView
            ref={mapRef}
            style={{ flex: 1 }}
            styleURL={MAPBOX_STYLE_LIGHT_V11}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={false}
            rotateEnabled={false}
            scaleBarEnabled={false}
            compassEnabled={false}
            logoEnabled={false}
            attributionEnabled={false}
            onCameraChanged={(state) => {
              onCameraChanged?.([
                state.properties.center[0],
                state.properties.center[1],
              ]);
            }}
          >
            <Mapbox.Camera
              centerCoordinate={cameraConfig.center}
              zoomLevel={cameraConfig.zoom}
              animationMode="flyTo"
              animationDuration={500}
              maxZoomLevel={MAP_SOURCE_MAX_ZOOM}
              padding={padding || { paddingTop: 0, paddingBottom: 450, paddingLeft: 80, paddingRight: 80 }}
            />

            <Mapbox.UserLocation
              visible={true}
              showsUserHeadingIndicator={false}
              minDisplacement={10}
            />

            <Mapbox.Images images={iconImages} />

            <Mapbox.ShapeSource
              ref={shapeSourceRef}
              id={MARKERS_SOURCE_ID}
              shape={geoJSON}
              cluster={true}
              clusterRadius={CLUSTER_RADIUS}
              clusterMaxZoomLevel={CLUSTER_MAX_ZOOM}
              maxZoomLevel={MAP_SOURCE_MAX_ZOOM}
              onPress={async (e) => {
                const feature = e.features[0];
                const clusterId = feature?.properties?.cluster_id;
                if (clusterId != null && shapeSourceRef.current) {
                  try {
                    const zoom =
                      await shapeSourceRef.current.getClusterExpansionZoom(
                        feature
                      );
                    if (feature.geometry.type === "Point") {
                      setCameraConfig({
                        center: feature.geometry.coordinates as [
                          number,
                          number,
                        ],
                        zoom,
                      });
                    }
                  } catch (err) {
                    logger.error("Cluster expansion error:", err);
                  }
                } else if (feature?.properties?.id != null && onStorePress) {
                  onStorePress(String(feature.properties.id));
                }
              }}
            >
              <Mapbox.SymbolLayer
                id="unclustered-point"
                style={{
                  iconImage: ["get", "iconName"],
                  iconSize: MARKER_ICON_SIZE,
                  iconAllowOverlap: true,
                  iconIgnorePlacement: true,
                }}
                filter={["!", ["has", "point_count"]]}
              />

              <Mapbox.SymbolLayer
                id="favorite-overlay"
                style={{
                  iconImage: ["get", "favoriteIconName"],
                  iconSize: MARKER_FAVORITE_ICON_SIZE,
                  iconAnchor: 'top-left',
                  iconOffset: [2, 4],
                  iconAllowOverlap: true,
                  iconIgnorePlacement: true,
                }}
                filter={["all", ["!", ["has", "point_count"]], ["!=", ["get", "favoriteIconName"], ""]]}
              />

              <Mapbox.CircleLayer
                id="clusters-shadow"
                style={{
                  circleColor: CLUSTER_SHADOW_COLOR,
                  circleRadius:
                    CLUSTER_CIRCLE_RADIUS + CLUSTER_SHADOW_RADIUS_EXTRA,
                  circleBlur: CLUSTER_SHADOW_BLUR,
                  circleTranslate: [
                    CLUSTER_SHADOW_TRANSLATE_X,
                    CLUSTER_SHADOW_TRANSLATE_Y,
                  ],
                  circleTranslateAnchor: "viewport",
                }}
                filter={["has", "point_count"]}
              />

              <Mapbox.CircleLayer
                id="clusters"
                style={{
                  circleColor: CLUSTER_COLOR,
                  circleRadius: CLUSTER_CIRCLE_RADIUS,
                  circleStrokeWidth: CLUSTER_CIRCLE_STROKE_WIDTH,
                  circleStrokeColor: CLUSTER_CIRCLE_STROKE_COLOR,
                }}
                filter={["has", "point_count"]}
              />

              <Mapbox.SymbolLayer
                id="cluster-count"
                style={{
                  textField: ["get", "point_count_abbreviated"],
                  textSize: 12,
                  textColor: "#fff",
                }}
                filter={["has", "point_count"]}
              />
            </Mapbox.ShapeSource>
          </Mapbox.MapView>
        </View>
      );
    }
  )
);

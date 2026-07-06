import Mapbox, {
  Camera,
  MapView,
  PointAnnotation,
} from '@rnmapbox/maps';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

type LatLng = { latitude: number; longitude: number };

type Props = {
  spot: LatLng;
  courier?: LatLng | null;
  // Only set once the address is unlocked (after pickup).
  customer?: LatLng | null;
  height?: number;
};

// Simple delivery map: pickup (spot), courier tick, and drop-off (customer).
// Fits the camera to whichever points are known.
export function DeliveryMap({ spot, courier, customer, height = 260 }: Props) {
  const cameraRef = useRef<Camera>(null);

  const points = [spot, courier, customer].filter(Boolean) as LatLng[];

  useEffect(() => {
    if (points.length === 0) return;
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    if (points.length === 1) {
      cameraRef.current?.setCamera({
        centerCoordinate: [points[0].longitude, points[0].latitude],
        zoomLevel: 14,
        animationDuration: 500,
      });
    } else {
      cameraRef.current?.fitBounds(
        [maxLng, maxLat],
        [minLng, minLat],
        [60, 60, 60, 60],
        600,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    spot.latitude,
    spot.longitude,
    courier?.latitude,
    courier?.longitude,
    customer?.latitude,
    customer?.longitude,
  ]);

  return (
    <View style={{ height, borderRadius: 20, overflow: 'hidden' }}>
      <MapView style={{ flex: 1 }} styleURL={MAP_STYLE} scaleBarEnabled={false}>
        <Camera ref={cameraRef} />

        {/* Pickup — spot */}
        <PointAnnotation id="spot" coordinate={[spot.longitude, spot.latitude]}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#EC2828',
              borderWidth: 3,
              borderColor: '#FFFFFF',
            }}
          />
        </PointAnnotation>

        {/* Drop-off — customer */}
        {customer && (
          <PointAnnotation
            id="customer"
            coordinate={[customer.longitude, customer.latitude]}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                backgroundColor: '#22C55E',
                borderWidth: 3,
                borderColor: '#FFFFFF',
              }}
            />
          </PointAnnotation>
        )}

        {/* Courier tick */}
        {courier && (
          <PointAnnotation
            id="courier"
            coordinate={[courier.longitude, courier.latitude]}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#2563EB',
                borderWidth: 3,
                borderColor: '#FFFFFF',
              }}
            />
          </PointAnnotation>
        )}
      </MapView>
    </View>
  );
}

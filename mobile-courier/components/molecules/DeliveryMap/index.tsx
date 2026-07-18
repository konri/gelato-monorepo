import { staticMapUrl } from '@/services/googlePlaces';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, useWindowDimensions, View } from 'react-native';

type LatLng = { latitude: number; longitude: number };

type Props = {
  spot: LatLng;
  courier?: LatLng | null;
  // Only set once the address is unlocked (after pickup).
  customer?: LatLng | null;
  height?: number;
};

/**
 * Delivery map using Google Static Maps (red 'S' pickup, dark 'D' drop-off,
 * green 'C' courier, path between spot↔drop-off). Static image → works in Expo
 * Go with no native map SDK. For turn-by-turn the screen has a Navigate button
 * that opens the device's Google/Apple Maps app.
 */
export function DeliveryMap({ spot, courier, customer, height = 260 }: Props) {
  const { width } = useWindowDimensions();
  const [failed, setFailed] = useState(false);
  const mapWidth = width - 32; // screen padding

  const url = staticMapUrl({
    spot,
    destination: customer ?? null,
    courier: courier ?? null,
    width: mapWidth,
    height,
  });

  if (!url || failed) {
    return (
      <View
        style={{ height, borderRadius: 20 }}
        className="items-center justify-center bg-gray-100"
      >
        <Ionicons name="map-outline" size={32} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <View style={{ height, borderRadius: 20, overflow: 'hidden' }}>
      <Image
        source={{ uri: url }}
        style={{ width: '100%', height }}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    </View>
  );
}

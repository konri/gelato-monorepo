import { Linking, Platform } from 'react-native';

/**
 * Open turn-by-turn navigation to a coordinate in the platform's maps app.
 * iOS → Apple Maps (falls back to Google Maps web), Android → Google Maps.
 */
export const openNavigation = async (
  latitude: number,
  longitude: number,
  label?: string,
): Promise<void> => {
  const encodedLabel = label ? encodeURIComponent(label) : '';
  const latlng = `${latitude},${longitude}`;

  const url =
    Platform.OS === 'ios'
      ? `maps://?daddr=${latlng}${encodedLabel ? `&q=${encodedLabel}` : ''}`
      : `google.navigation:q=${latlng}`;

  const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${latlng}`;

  try {
    const supported = await Linking.canOpenURL(url);
    await Linking.openURL(supported ? url : webFallback);
  } catch {
    await Linking.openURL(webFallback);
  }
};

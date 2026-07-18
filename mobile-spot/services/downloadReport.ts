import { config } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Download an authenticated PDF report and hand it to the user.
 * - Web: fetch with the bearer token → object URL → trigger a browser download.
 * - Native: download to a cache file → open the OS share sheet.
 *
 * `path` is the route under /reports, e.g. `courier/<spotId>?from=...&to=...`.
 */
export async function downloadReport(
  path: string,
  filename: string,
  lang?: string,
): Promise<void> {
  const token = (await AsyncStorage.getItem('access_token')) ?? '';
  // Append the app language so the PDF matches the UI (pl/en/ua).
  const sep = path.includes('?') ? '&' : '?';
  const langQuery = lang ? `${sep}lang=${encodeURIComponent(lang)}` : '';
  const url = `${config.REST_API_URL}/reports/${path}${langQuery}`;

  if (Platform.OS === 'web') {
    const res = await fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(`Report failed: ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    return;
  }

  // Native: download to cache, then share.
  const FileSystem = require('expo-file-system');
  const Sharing = require('expo-sharing');
  const target = `${FileSystem.cacheDirectory}${filename}`;
  const { uri, status } = await FileSystem.downloadAsync(url, target, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  if (status !== 200) throw new Error(`Report failed: ${status}`);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
  }
}

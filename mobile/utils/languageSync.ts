import { updateProfile } from '@/shared/api-client/src/graphql/mutations/profile/updateProfile';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { logger } from '@/utils/logger';

/**
 * Keeps `User.language` (pushes, server error texts) in line with the app
 * language (BRANDS_SPEC §5.1 F9, §5.2).
 */
export type ServerLanguage = 'EN' | 'PL' | 'UA';

export const toServerLanguage = (lang: string | null | undefined): ServerLanguage | null => {
  const code = (lang || '').split('-')[0].toLowerCase();
  if (code === 'pl') return 'PL';
  if (code === 'en') return 'EN';
  if (code === 'ua' || code === 'uk') return 'UA';
  return null;
};

/** Saves the language on the server when logged in. Never throws. */
export const pushLanguageToServer = async (lang: string): Promise<boolean> => {
  const language = toServerLanguage(lang);
  if (!language) return false;
  try {
    const token = await safeGetItem('access_token');
    if (!token) return false;
    const result = await updateProfile({ data: { language }, token, silent: true });
    return result.success;
  } catch (e) {
    logger.warn('language sync failed', e);
    return false;
  }
};

// Once per user per app session.
const synced = new Set<string>();

/**
 * After login: when the app runs in a different language than the one stored
 * on the server, store the app language (once per user and app session).
 */
export const syncLanguageOnce = async (
  userId: string,
  serverLanguage: string | null | undefined,
  appLanguage: string,
): Promise<void> => {
  if (!userId || synced.has(userId)) return;
  synced.add(userId);
  const wanted = toServerLanguage(appLanguage);
  if (!wanted || wanted === serverLanguage) return;
  const ok = await pushLanguageToServer(appLanguage);
  if (!ok) synced.delete(userId);
};

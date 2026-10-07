import { ACCESS_TOKEN_KEY, API_ORIGIN } from './config';
import { CLIENT_HEADERS } from './clientInfo';
import { AppError } from './errors';
import { emitSessionEvent } from './sessionEvents';
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from './constants';

/**
 * Image uploads (BRANDS_SPEC §2.9, §3.1). The server checks access from the
 * URL before it reads the body and answers `{ imageUrl, url }`.
 * Throws AppError: UPLOAD_TYPE / UPLOAD_TOO_LARGE (checked here first), the
 * server's `code` (SCOPE_FORBIDDEN, BAD_USER_INPUT, …), NETWORK or UNKNOWN.
 */

/** Client-side checks before anything is sent; null when the file is fine. */
export function imageFileProblem(file: File): 'UPLOAD_TYPE' | 'UPLOAD_TOO_LARGE' | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) return 'UPLOAD_TYPE';
  if (file.size > MAX_UPLOAD_BYTES) return 'UPLOAD_TOO_LARGE';
  return null;
}

/** POSTs one image to `/upload/<path>`; returns the stored URL. */
export async function uploadImage(path: string, file: File): Promise<string> {
  const problem = imageFileProblem(file);
  if (problem) throw new AppError(problem);

  const body = new FormData();
  body.append('image', file);
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  let res: Response;
  try {
    res = await fetch(`${API_ORIGIN}/upload/${path.replace(/^\/+/, '')}`, {
      method: 'POST',
      headers: { ...CLIENT_HEADERS, ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body,
    });
  } catch {
    throw new AppError('NETWORK');
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const code =
      typeof data.code === 'string'
        ? data.code
        : res.status === 401
          ? 'UNAUTHENTICATED'
          : res.status === 413
            ? 'UPLOAD_TOO_LARGE'
            : 'UNKNOWN';
    if (code === 'UNAUTHENTICATED') emitSessionEvent('unauthenticated');
    if (code === 'PASSWORD_CHANGE_REQUIRED') emitSessionEvent('password-change-required');
    if (code === 'UPGRADE_REQUIRED') emitSessionEvent('upgrade-required');
    const extensions = Object.fromEntries(
      Object.entries(data).filter(([key]) => key !== 'code' && key !== 'error'),
    );
    throw new AppError(code, typeof data.error === 'string' ? data.error : null, extensions);
  }

  const url = (data.imageUrl ?? data.url) as unknown;
  if (typeof url !== 'string' || !url) throw new AppError('UNKNOWN');
  return url;
}

/** Brand logo or cover; the server also saves the URL on the brand. */
export function uploadBrandImage(brandId: string, kind: 'logo' | 'cover', file: File): Promise<string> {
  return uploadImage(`brand/${encodeURIComponent(brandId)}?type=${kind}`, file);
}

/** Reward photo; the server saves it on the reward. */
export function uploadPrizeImage(prizeId: string, file: File): Promise<string> {
  return uploadImage(`prize/${encodeURIComponent(prizeId)}`, file);
}

/** News photo (appended to the post's images). */
export function uploadNewsImage(newsId: string, file: File): Promise<string> {
  return uploadImage(`news/${encodeURIComponent(newsId)}`, file);
}

import { config } from '@/config';
import { safeGetItem } from '../utils/safeAsyncStorage';
import { refreshAccessToken } from '../graphql/refreshToken';
import type { ApiResponse } from './types';

const REST_BASE_URL = config.REST_API_URL;

export type UploadImageResponse = { imageUrl: string };

/**
 * Upload the authenticated user's profile picture to the backend (S3).
 * Sends multipart/form-data to POST /upload/profile.
 *
 * `uri` is a local file URI from expo-image-picker.
 */
export async function uploadProfileImage(
  uri: string,
  fileName = 'avatar.jpg',
  mimeType = 'image/jpeg',
): Promise<ApiResponse<UploadImageResponse>> {
  // A fresh FormData per attempt — a consumed body can't be re-sent.
  const attempt = async (token: string | null): Promise<Response> => {
    const formData = new FormData();
    // React Native FormData file shape.
    formData.append('image', { uri, name: fileName, type: mimeType } as any);

    return fetch(`${REST_BASE_URL}/upload/profile`, {
      method: 'POST',
      headers: {
        // NOTE: do NOT set Content-Type; fetch sets the multipart boundary.
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
  };

  try {
    let token = await safeGetItem('access_token');
    let response = await attempt(token);

    // Expired token → refresh once and retry.
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        token = newToken;
        response = await attempt(token);
      }
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      return { error: `Server error: ${response.status}`, status: response.status };
    }

    if (!response.ok) {
      return {
        error: data.error || data.message || `HTTP error! status: ${response.status}`,
        status: response.status,
      };
    }

    return { data, status: response.status };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

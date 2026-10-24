import { httpClient } from './httpClient.js';

export interface RemoveBackgroundResponse {
  readonly success?: boolean;
  readonly fallback?: boolean;
  readonly imageBase64?: string;
  readonly message?: string;
}

/**
 * Requests AI background removal from the backend `/api/v1/image/remove-background` endpoint.
 */
export async function removeImageBackgroundViaApi(
  imageBase64: string,
): Promise<RemoveBackgroundResponse | null> {
  const result = await httpClient.post<RemoveBackgroundResponse>(
    '/api/v1/image/remove-background',
    { imageBase64 },
    { timeoutMs: 4500 },
  );

  if (!result.ok) {
    return null;
  }

  return result.data;
}

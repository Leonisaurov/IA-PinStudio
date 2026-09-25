/**
 * Session persistence helper for PinStudio.
 * Stores crop coordinates, active mode, toggles, and compressed/original image dataURL.
 */

import { CropState, AppMode, ImageMetadata } from '../constants/specs';

const STORAGE_KEY = 'pinstudio_session_v1';

export interface SavedSession {
  crop: CropState;
  activeMode: AppMode;
  showGuides: boolean;
  showFoldOverlay: boolean;
  imageMeta: {
    name: string;
    width: number;
    height: number;
    fileSize: number;
    dataUrl: string;
  } | null;
  timestamp: number;
}

/**
 * Compresses an image dataURL if necessary to fit within localStorage quota (~5MB).
 */
export async function createPersistentDataUrl(
  img: HTMLImageElement,
  originalDataUrl: string
): Promise<string> {
  // If original dataUrl is small enough (< 2MB), keep it intact
  if (originalDataUrl.length < 2 * 1024 * 1024) {
    return originalDataUrl;
  }

  // Otherwise downscale to maximum 1600px for localStorage persistence
  try {
    const maxDimension = 1600;
    let w = img.naturalWidth;
    let h = img.naturalHeight;

    if (w > maxDimension || h > maxDimension) {
      if (w > h) {
        h = Math.round((h * maxDimension) / w);
        w = maxDimension;
      } else {
        w = Math.round((w * maxDimension) / h);
        h = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return originalDataUrl;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (err) {
    console.warn('Could not compress image for localStorage:', err);
    return originalDataUrl;
  }
}

export function saveSession(session: Omit<SavedSession, 'timestamp'>): boolean {
  try {
    const payload: SavedSession = {
      ...session,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('localStorage save failed (quota exceeded or private browsing):', err);
    // If saving with image failed, attempt saving without the image payload
    try {
      if (session.imageMeta) {
        const minimalPayload = {
          ...session,
          imageMeta: {
            ...session.imageMeta,
            dataUrl: '', // drop dataUrl if quota exceeded
          },
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalPayload));
      }
    } catch {
      // ignore
    }
    return false;
  }
}

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
    return parsed;
  } catch (err) {
    console.warn('Could not load session from localStorage:', err);
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Could not clear session:', err);
  }
}

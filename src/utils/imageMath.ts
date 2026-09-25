/**
 * Mathematical utilities for image cropping, clamping, DPI calculations,
 * and high-resolution off-screen canvas rendering.
 */

import { PHYSICAL_SPECS, CropState, QualityAnalysis } from '../constants/specs';

export interface OrientedDimensions {
  width: number;
  height: number;
}

/**
 * Returns oriented dimensions taking rotation into account (0, 90, 180, 270)
 */
export function getOrientedDimensions(
  naturalWidth: number,
  naturalHeight: number,
  rotation: number
): OrientedDimensions {
  const normRot = ((rotation % 360) + 360) % 360;
  if (normRot === 90 || normRot === 270) {
    return { width: naturalHeight, height: naturalWidth };
  }
  return { width: naturalWidth, height: naturalHeight };
}

/**
 * Clamps crop pan and zoom so no transparent or empty area ever enters the 6.6cm circle.
 */
export function clampCrop(
  crop: CropState,
  naturalWidth: number,
  naturalHeight: number
): CropState {
  const { width: effW, height: effH } = getOrientedDimensions(
    naturalWidth,
    naturalHeight,
    crop.rotation
  );

  const minDimension = Math.min(effW, effH);

  // Zoom must be at least 1.0 so the 6.6cm circle fits inside the image
  // Max zoom is 10.0
  const clampedZoom = Math.min(Math.max(crop.zoom, 1.0), 10.0);

  // Diameter of cut circle in source image space
  const cutDiameterSrc = minDimension / clampedZoom;
  const maxOffsetX = Math.max(0, (effW - cutDiameterSrc) / 2);
  const maxOffsetY = Math.max(0, (effH - cutDiameterSrc) / 2);

  const clampedX = Math.min(Math.max(crop.x, -maxOffsetX), maxOffsetX);
  const clampedY = Math.min(Math.max(crop.y, -maxOffsetY), maxOffsetY);

  const normalizedRotation = ((crop.rotation % 360) + 360) % 360;

  return {
    ...crop,
    x: clampedX,
    y: clampedY,
    zoom: clampedZoom,
    rotation: normalizedRotation,
  };
}

/**
 * Analyzes image quality at current crop zoom relative to 300 DPI production standard (779 px).
 */
export function analyzeQuality(
  crop: CropState,
  naturalWidth: number,
  naturalHeight: number
): QualityAnalysis {
  const { width: effW, height: effH } = getOrientedDimensions(
    naturalWidth,
    naturalHeight,
    crop.rotation
  );
  const minDimension = Math.min(effW, effH);
  const cutDiameterSrc = minDimension / crop.zoom;
  const ratio = cutDiameterSrc / PHYSICAL_SPECS.CUT_PX;
  const effectiveDpi = Math.round(PHYSICAL_SPECS.PRINT_DPI * ratio);

  if (ratio >= 2.0) {
    return {
      ratio,
      level: 'excellent',
      effectiveDpi,
      title: 'Excelente',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      advice: 'Resolución sobresaliente (≥2×). Nitidez perfecta en imprenta offset o digital.',
    };
  } else if (ratio >= 1.3) {
    return {
      ratio,
      level: 'good',
      effectiveDpi,
      title: 'Bueno',
      badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      advice: 'Calidad óptima (1.3×–2×). Supera el estándar de 300 DPI requerido.',
    };
  } else if (ratio >= 1.0) {
    return {
      ratio,
      level: 'acceptable',
      effectiveDpi,
      title: 'Aceptable',
      badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      advice: 'Cumple el mínimo de 300 DPI para impresión física de 6.6 cm.',
    };
  } else {
    return {
      ratio,
      level: 'pixelated',
      effectiveDpi,
      title: 'Pixelado',
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      advice: 'Inferior a 300 DPI (<1×). Sube una foto de mayor resolución para evitar pixelado en la chapa.',
    };
  }
}

/**
 * Renders the exact cropped production circle to an off-screen canvas at 779 x 779 px (300 DPI).
 * Outside the 6.6cm circle, background is transparent PNG.
 * Image is sampled using high quality bicubic interpolation.
 */
export function renderProductionCanvas(
  img: HTMLImageElement,
  crop: CropState
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = PHYSICAL_SPECS.CUT_PX; // 779 px
  canvas.height = PHYSICAL_SPECS.CUT_PX; // 779 px

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const centerPx = PHYSICAL_SPECS.CUT_PX / 2; // 389.5 px
  const radiusPx = centerPx;

  // Circular clip for clean transparency outside the 6.6cm circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerPx, centerPx, radiusPx, 0, Math.PI * 2);
  ctx.clip();

  const { width: effW, height: effH } = getOrientedDimensions(
    img.naturalWidth,
    img.naturalHeight,
    crop.rotation
  );
  const minDimension = Math.min(effW, effH);
  const cutDiameterSrc = minDimension / crop.zoom;
  const scaleFactor = PHYSICAL_SPECS.CUT_PX / cutDiameterSrc;

  // Move canvas origin to center of cut circle
  ctx.translate(centerPx, centerPx);

  // Apply scale from source coordinates to output 779px
  ctx.scale(scaleFactor, scaleFactor);

  // Apply rotation
  ctx.rotate((crop.rotation * Math.PI) / 180);

  // Apply horizontal and vertical flip
  ctx.scale(crop.flipH ? -1 : 1, crop.flipV ? -1 : 1);

  // Translate by negative center offset in unrotated image space
  // When rotation is applied, the user's pan (x, y) was in oriented space.
  // We need to map (crop.x, crop.y) back into unrotated space if rotating.
  const rad = (-crop.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const unrotatedCropX = crop.x * cos - crop.y * sin;
  const unrotatedCropY = crop.x * sin + crop.y * cos;

  const imgCenterX = img.naturalWidth / 2;
  const imgCenterY = img.naturalHeight / 2;

  ctx.translate(-imgCenterX - unrotatedCropX, -imgCenterY - unrotatedCropY);

  // Draw image
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

  ctx.restore();

  return canvas;
}

/**
 * Downloads a canvas as a high quality PNG file.
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate PNG blob'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      },
      'image/png',
      1.0
    );
  });
}

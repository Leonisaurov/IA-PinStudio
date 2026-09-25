/**
 * Physical specifications and constants for PinStudio badges
 * Strictly conforming to:
 * - 5.8 cm visible diameter (685 x 685 px @ 300 DPI)
 * - 4 mm bleed per side (6.6 cm printable cut diameter, 779 x 779 px @ 300 DPI)
 * - 300 DPI = 118.110236 px/cm (11.811 px/mm)
 */

export const PHYSICAL_SPECS = {
  /** Visible badge face diameter in cm */
  VISIBLE_DIAMETER_CM: 5.8,
  /** Bleed margin in mm per side */
  BLEED_MM_PER_SIDE: 4.0,
  /** Total printable cut circle diameter in cm (5.8 + 2*0.4) */
  CUT_DIAMETER_CM: 6.6,
  /** Exact standard DPI for print manufacturing */
  PRINT_DPI: 300,
  /** Pixels per cm at 300 DPI (300 / 2.54 = 118.1102362...) */
  PX_PER_CM: 300 / 2.54,
  /** Pixels per mm at 300 DPI */
  PX_PER_MM: (300 / 2.54) / 10,
  /** Calculated exact visible diameter in pixels at 300 DPI (5.8 * 118.1102 = 685.04) */
  VISIBLE_PX: 685,
  /** Calculated exact total cut diameter in pixels at 300 DPI (6.6 * 118.1102 = 779.52) */
  CUT_PX: 779,
  /** Ratio of visible diameter to full cut diameter (5.8 / 6.6 = 0.878787...) */
  VISIBLE_TO_CUT_RATIO: 5.8 / 6.6,
  /** Maximum file upload size in bytes (20 MB) */
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024,
  /** Supported mime types */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

export type AppMode = 'production' | 'preview';

export interface CropState {
  /** Normalized or pixel offset from image center (-1 to 1 or clamped pixels) */
  x: number; // in image pixels relative to center
  y: number; // in image pixels relative to center
  zoom: number; // 1.0 = minimum fit, up to 10.0
  rotation: number; // 0, 90, 180, 270 degrees
  flipH: boolean;
  flipV: boolean;
}

export interface ImageMetadata {
  name: string;
  width: number;
  height: number;
  dataUrl: string;
  fileSize: number;
}

export type QualityLevel = 'excellent' | 'good' | 'acceptable' | 'pixelated';

export type AppTheme = 'minimal-black' | 'slate-dark' | 'paper-light';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  shortLabel: string;
  dotColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'minimal-black',
    name: 'Negro Minimalista',
    shortLabel: 'Negro',
    dotColor: 'bg-zinc-950 border border-zinc-700',
  },
  {
    id: 'slate-dark',
    name: 'Grafito Studio',
    shortLabel: 'Grafito',
    dotColor: 'bg-slate-800 border border-slate-600',
  },
  {
    id: 'paper-light',
    name: 'Papel Claro',
    shortLabel: 'Claro',
    dotColor: 'bg-zinc-200 border border-zinc-400',
  },
];

export interface QualityAnalysis {
  ratio: number; // source pixels mapped to 779px
  level: QualityLevel;
  effectiveDpi: number;
  title: string;
  badgeClass: string;
  advice: string;
}

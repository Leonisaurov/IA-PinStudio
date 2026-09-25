import React, { useState } from 'react';
import { PHYSICAL_SPECS, CropState, QualityAnalysis, AppTheme } from '../constants/specs';
import { clampCrop } from '../utils/imageMath';
import {
  RotateCw,
  Crosshair,
  Download,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface MobileControlsProps {
  crop: CropState;
  onCropChange: (newCrop: CropState) => void;
  naturalWidth: number;
  naturalHeight: number;
  quality: QualityAnalysis;
  theme: AppTheme;
  onExportClick: () => void;
  isExporting?: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  crop,
  onCropChange,
  naturalWidth,
  naturalHeight,
  quality,
  theme,
  onExportClick,
  isExporting = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLight = theme === 'paper-light';
  const isMinimalBlack = theme === 'minimal-black';

  const handleZoomChange = (delta: number) => {
    const updated = clampCrop(
      { ...crop, zoom: crop.zoom + delta },
      naturalWidth,
      naturalHeight
    );
    onCropChange(updated);
  };

  const handleRotate90 = () => {
    const nextRot = (crop.rotation + 90) % 360;
    const updated = clampCrop({ ...crop, rotation: nextRot }, naturalWidth, naturalHeight);
    onCropChange(updated);
  };

  const handleCenter = () => {
    const updated = clampCrop({ ...crop, x: 0, y: 0 }, naturalWidth, naturalHeight);
    onCropChange(updated);
  };

  const containerClasses = isLight
    ? 'bg-white border-zinc-200 text-zinc-900'
    : isMinimalBlack
    ? 'bg-zinc-950 border-zinc-900 text-zinc-100'
    : 'bg-slate-900 border-slate-800 text-slate-100';

  const buttonClasses = isLight
    ? 'bg-zinc-100 active:bg-zinc-200 text-zinc-900 border-zinc-300'
    : isMinimalBlack
    ? 'bg-zinc-900 active:bg-zinc-800 text-zinc-200 border-zinc-800'
    : 'bg-slate-800 active:bg-slate-700 text-white border-slate-700';

  return (
    <div
      className={`md:hidden border-t flex flex-col z-30 select-none transition-colors duration-200 ${containerClasses}`}
    >
      {/* Expand/Collapse Handle Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full py-1.5 px-3 flex items-center justify-center gap-1.5 text-[11px] font-medium border-b transition-colors ${
          isLight
            ? 'text-zinc-600 bg-zinc-50 border-zinc-200'
            : 'text-zinc-400 bg-zinc-900/60 border-zinc-850'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            quality.level === 'excellent'
              ? 'bg-emerald-400'
              : quality.level === 'good'
              ? 'bg-sky-400'
              : quality.level === 'acceptable'
              ? 'bg-amber-400'
              : 'bg-rose-400'
          }`}
        />
        <span className="truncate">
          Calidad: {quality.title} ({quality.effectiveDpi} DPI)
        </span>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronUp className="w-3.5 h-3.5 shrink-0" />}
      </button>

      {/* Expanded Details Drawer */}
      {isExpanded && (
        <div
          className={`p-3 xs:p-3.5 border-b space-y-2.5 animate-in slide-in-from-bottom-2 duration-150 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black border-zinc-850'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Zoom exacto:</span>
            <span className="font-mono tabular-nums">{crop.zoom.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="10.0"
            step="0.05"
            value={crop.zoom}
            onChange={(e) => {
              const updated = clampCrop(
                { ...crop, zoom: parseFloat(e.target.value) },
                naturalWidth,
                naturalHeight
              );
              onCropChange(updated);
            }}
            className="w-full h-1.5 bg-zinc-800 rounded-lg accent-zinc-200"
          />

          <div className="grid grid-cols-2 gap-1.5 xs:gap-2 pt-1 text-[11px] xs:text-xs">
            <div
              className={`p-1.5 xs:p-2 rounded-lg border flex justify-between items-center ${
                isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-850'
              }`}
            >
              <span className="text-zinc-400">Offset X:</span>
              <span className="font-mono tabular-nums">{Math.round(crop.x)} px</span>
            </div>
            <div
              className={`p-1.5 xs:p-2 rounded-lg border flex justify-between items-center ${
                isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-850'
              }`}
            >
              <span className="text-zinc-400">Offset Y:</span>
              <span className="font-mono tabular-nums">{Math.round(crop.y)} px</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Action Touch Row */}
      <div className="p-1 xs:p-1.5 sm:p-2.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleZoomChange(-0.25)}
            className={`w-8 h-8 xxs:w-9 xxs:h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl border transition-colors shrink-0 ${buttonClasses}`}
            title="Reducir zoom"
            aria-label="Reducir zoom"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoomChange(0.25)}
            className={`w-8 h-8 xxs:w-9 xxs:h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl border transition-colors shrink-0 ${buttonClasses}`}
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={handleRotate90}
            className={`w-8 h-8 xxs:w-9 xxs:h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl border transition-colors shrink-0 ${buttonClasses}`}
            title="Girar 90 grados"
            aria-label="Girar 90 grados"
          >
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={handleCenter}
            className={`w-8 h-8 xxs:w-9 xxs:h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl border transition-colors shrink-0 ${buttonClasses}`}
            title="Centrar máscara"
            aria-label="Centrar máscara"
          >
            <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Adaptive Export Button */}
        <button
          type="button"
          onClick={onExportClick}
          disabled={isExporting}
          className={`flex-1 h-8 xxs:h-9 sm:h-10 px-2 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 truncate disabled:opacity-50 ${
            isLight
              ? 'bg-zinc-900 text-white active:bg-zinc-800'
              : 'bg-zinc-100 text-zinc-950 active:bg-white'
          }`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate hidden xs:inline">Exportar (779px)</span>
          <span className="truncate xs:hidden">Exportar</span>
        </button>
      </div>
    </div>
  );
};

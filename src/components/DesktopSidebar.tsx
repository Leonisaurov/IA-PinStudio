import React from 'react';
import { PHYSICAL_SPECS, CropState, QualityAnalysis, AppTheme } from '../constants/specs';
import { clampCrop } from '../utils/imageMath';
import {
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crosshair,
  Maximize2,
  RotateCcw,
  Download,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DesktopSidebarProps {
  crop: CropState;
  onCropChange: (newCrop: CropState) => void;
  naturalWidth: number;
  naturalHeight: number;
  quality: QualityAnalysis;
  theme: AppTheme;
  onExportClick: () => void;
  isExporting?: boolean;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  crop,
  onCropChange,
  naturalWidth,
  naturalHeight,
  quality,
  theme,
  onExportClick,
  isExporting = false,
}) => {
  const isLight = theme === 'paper-light';
  const isMinimalBlack = theme === 'minimal-black';

  const handleZoomSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    const updated = clampCrop({ ...crop, zoom: newZoom }, naturalWidth, naturalHeight);
    onCropChange(updated);
  };

  const handleZoomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      const updated = clampCrop({ ...crop, zoom: val }, naturalWidth, naturalHeight);
      onCropChange(updated);
    }
  };

  const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      const updated = clampCrop({ ...crop, x: val }, naturalWidth, naturalHeight);
      onCropChange(updated);
    }
  };

  const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      const updated = clampCrop({ ...crop, y: val }, naturalWidth, naturalHeight);
      onCropChange(updated);
    }
  };

  const handleRotate90 = () => {
    const nextRot = (crop.rotation + 90) % 360;
    const updated = clampCrop({ ...crop, rotation: nextRot }, naturalWidth, naturalHeight);
    onCropChange(updated);
  };

  const handleSetRotation = (deg: number) => {
    const updated = clampCrop({ ...crop, rotation: deg }, naturalWidth, naturalHeight);
    onCropChange(updated);
  };

  const handleToggleFlipH = () => {
    onCropChange({ ...crop, flipH: !crop.flipH });
  };

  const handleToggleFlipV = () => {
    onCropChange({ ...crop, flipV: !crop.flipV });
  };

  const handleCenterMask = () => {
    const updated = clampCrop({ ...crop, x: 0, y: 0 }, naturalWidth, naturalHeight);
    onCropChange(updated);
  };

  const handleResetFit = () => {
    const updated = clampCrop({ ...crop, zoom: 1.0, x: 0, y: 0 }, naturalWidth, naturalHeight);
    onCropChange(updated);
  };

  const handleFullReset = () => {
    onCropChange({
      x: 0,
      y: 0,
      zoom: 1.0,
      rotation: 0,
      flipH: false,
      flipV: false,
    });
  };

  const xMm = (crop.x / PHYSICAL_SPECS.PX_PER_MM).toFixed(1);
  const yMm = (crop.y / PHYSICAL_SPECS.PX_PER_MM).toFixed(1);

  // Surface classes based on theme
  const asideClasses = isLight
    ? 'bg-white border-zinc-200 text-zinc-900'
    : isMinimalBlack
    ? 'bg-zinc-950 border-zinc-900 text-zinc-100'
    : 'bg-slate-900/95 border-slate-800 text-slate-100';

  const cardClasses = isLight
    ? 'bg-zinc-50 border-zinc-200/80'
    : isMinimalBlack
    ? 'bg-zinc-900/50 border-zinc-850'
    : 'bg-slate-950/60 border-slate-800/60';

  const inputClasses = isLight
    ? 'bg-white border-zinc-300 text-zinc-900 focus:border-zinc-700'
    : isMinimalBlack
    ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-500'
    : 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500';

  return (
    <aside
      className={`w-80 lg:w-84 h-full border-l flex flex-col overflow-y-auto select-none p-4 lg:p-5 space-y-5 transition-colors duration-200 ${asideClasses}`}
    >
      {/* 1. Quality Analysis Meter */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Calidad de Impresión
          </span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium border ${quality.badgeClass}`}
          >
            {quality.title} ({quality.ratio.toFixed(2)}×)
          </span>
        </div>

        <div className={`p-3 rounded-xl border space-y-2 ${cardClasses}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Resolución efectiva:</span>
            <span className="font-mono font-semibold tabular-nums">
              {quality.effectiveDpi} DPI
            </span>
          </div>

          <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                quality.level === 'excellent'
                  ? 'bg-emerald-400 w-full'
                  : quality.level === 'good'
                  ? 'bg-sky-400 w-3/4'
                  : quality.level === 'acceptable'
                  ? 'bg-amber-400 w-1/2'
                  : 'bg-rose-500 w-1/4'
              }`}
            />
          </div>

          <p className="text-[11px] text-zinc-400 leading-snug flex items-start gap-1.5 pt-0.5">
            {quality.level === 'pixelated' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <span>{quality.advice}</span>
          </p>
        </div>
      </section>

      {/* 2. Numeric Position & Zoom Controls */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            Parámetros
          </span>
          <button
            type="button"
            onClick={handleCenterMask}
            title="Centrar máscara en el origen (0, 0)"
            className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
          >
            <Crosshair className="w-3 h-3" />
            Centrar
          </button>
        </div>

        {/* Zoom Control */}
        <div className={`space-y-2 p-3 rounded-xl border ${cardClasses}`}>
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="zoom-slider" className="font-medium text-zinc-300">
              Zoom
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1.0"
                max="10.0"
                step="0.05"
                value={crop.zoom.toFixed(2)}
                onChange={handleZoomInput}
                className={`w-14 px-1.5 py-0.5 text-right font-mono text-xs border rounded tabular-nums focus:outline-none ${inputClasses}`}
              />
              <span className="text-zinc-500 text-xs">×</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[10px] font-mono text-zinc-500">1.0×</span>
            <input
              id="zoom-slider"
              type="range"
              min="1.0"
              max="10.0"
              step="0.02"
              value={crop.zoom}
              onChange={handleZoomSlider}
              className="flex-1 h-1 bg-zinc-800 rounded-lg cursor-pointer accent-zinc-200"
            />
            <span className="text-[10px] font-mono text-zinc-500">10×</span>
          </div>
        </div>

        {/* X & Y Offsets */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className={`p-2.5 rounded-xl border space-y-1 ${cardClasses}`}>
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="pos-x-input" className="text-zinc-400 font-medium text-[11px]">
                Offset X
              </label>
              <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                {xMm} mm
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                id="pos-x-input"
                type="number"
                step="1"
                value={Math.round(crop.x)}
                onChange={handleXChange}
                className={`w-full px-2 py-1 font-mono text-xs border rounded tabular-nums focus:outline-none ${inputClasses}`}
              />
              <span className="text-[11px] text-zinc-500">px</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border space-y-1 ${cardClasses}`}>
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="pos-y-input" className="text-zinc-400 font-medium text-[11px]">
                Offset Y
              </label>
              <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                {yMm} mm
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                id="pos-y-input"
                type="number"
                step="1"
                value={Math.round(crop.y)}
                onChange={handleYChange}
                className={`w-full px-2 py-1 font-mono text-xs border rounded tabular-nums focus:outline-none ${inputClasses}`}
              />
              <span className="text-[11px] text-zinc-500">px</span>
            </div>
          </div>
        </div>

        {/* Rotation & Flip */}
        <div className={`p-3 rounded-xl border space-y-2.5 ${cardClasses}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Rotación</span>
            <span className="font-mono text-xs tabular-nums text-zinc-200">
              {crop.rotation}°
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => handleSetRotation(deg)}
                className={`py-1 text-xs font-mono font-medium rounded transition-colors ${
                  crop.rotation === deg
                    ? isLight
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-200 text-zinc-950 font-semibold'
                    : isLight
                    ? 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/40">
            <button
              type="button"
              onClick={handleRotate90}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                isLight
                  ? 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700'
                  : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 text-zinc-300'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>+90°</span>
            </button>
            <button
              type="button"
              onClick={handleToggleFlipH}
              className={`p-1.5 rounded-lg border transition-colors ${
                crop.flipH
                  ? 'bg-zinc-200 text-zinc-950 border-zinc-300'
                  : isLight
                  ? 'bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Voltear horizontalmente"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToggleFlipV}
              className={`p-1.5 rounded-lg border transition-colors ${
                crop.flipV
                  ? 'bg-zinc-200 text-zinc-950 border-zinc-300'
                  : isLight
                  ? 'bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Voltear verticalmente"
            >
              <FlipVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Physical Specs Reference Summary */}
      <section className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          Ficha de Imprenta
        </span>
        <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${cardClasses}`}>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Cara visible:</span>
            <span className="font-mono tabular-nums">Ø 5.8 cm (685 px)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Sangrado:</span>
            <span className="font-mono tabular-nums">4 mm / lado</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Corte total:</span>
            <span className="font-mono font-semibold tabular-nums text-emerald-400">
              Ø 6.6 cm (779 px)
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800/40 pt-1.5">
            <span className="text-zinc-400">Resolución:</span>
            <span className="font-mono tabular-nums">300 DPI</span>
          </div>
        </div>
      </section>

      {/* 4. Action Buttons */}
      <section className="pt-1 space-y-2 mt-auto">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handleResetFit}
            className={`flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            <span>1.0×</span>
          </button>
          <button
            type="button"
            onClick={handleFullReset}
            className={`flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onExportClick}
          disabled={isExporting}
          className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[40px] ${
            isLight
              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
              : 'bg-zinc-100 text-zinc-950 hover:bg-white'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Generando...' : 'Descargar corte (779 px)'}</span>
        </button>
      </section>
    </aside>
  );
};

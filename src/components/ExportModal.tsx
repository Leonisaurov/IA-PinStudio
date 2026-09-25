import React, { useRef, useEffect, useState } from 'react';
import { X, Download, CheckCircle2, ShieldCheck, FileCheck } from 'lucide-react';
import { PHYSICAL_SPECS, CropState, QualityAnalysis, AppTheme } from '../constants/specs';
import { renderProductionCanvas, downloadCanvas } from '../utils/imageMath';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: HTMLImageElement;
  crop: CropState;
  quality: QualityAnalysis;
  theme: AppTheme;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  image,
  crop,
  quality,
  theme,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const isLight = theme === 'paper-light';
  const isMinimalBlack = theme === 'minimal-black';

  useEffect(() => {
    if (!isOpen || !image) return;

    const exportCanvas = renderProductionCanvas(image, crop);
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    previewCanvas.width = PHYSICAL_SPECS.CUT_PX;
    previewCanvas.height = PHYSICAL_SPECS.CUT_PX;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, PHYSICAL_SPECS.CUT_PX, PHYSICAL_SPECS.CUT_PX);
    ctx.drawImage(exportCanvas, 0, 0);
  }, [isOpen, image, crop]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const exportCanvas = renderProductionCanvas(image, crop);
      await downloadCanvas(
        exportCanvas,
        `pinstudio-corte-imprenta-66mm-300dpi-${Date.now()}.png`
      );
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Error during download:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const modalBg = isLight
    ? 'bg-white border-zinc-200 text-zinc-900'
    : isMinimalBlack
    ? 'bg-zinc-950 border-zinc-850 text-zinc-100'
    : 'bg-slate-900 border-slate-800 text-slate-100';

  const cardBg = isLight
    ? 'bg-zinc-50 border-zinc-200'
    : isMinimalBlack
    ? 'bg-zinc-900/60 border-zinc-850'
    : 'bg-slate-950/60 border-slate-800';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none overflow-y-auto"
    >
      <div
        className={`relative w-full max-w-xl max-h-[92dvh] overflow-y-auto border rounded-2xl p-4 xs:p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 transition-colors ${modalBg}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-inherit gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg border border-inherit shrink-0">
              <FileCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h2 id="export-modal-title" className="text-xs sm:text-sm font-bold truncate">
                Exportar Archivo de Producción (300 DPI)
              </h2>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate">
                Corte para imprenta preparado según norma física
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 rounded-lg hover:bg-zinc-800/20 transition-colors text-zinc-400 hover:text-inherit shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview & Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center">
          {/* Circular Cut Visualizer with Transparency Grid */}
          <div
            className={`relative aspect-square w-full max-w-[160px] xs:max-w-[190px] sm:max-w-[220px] mx-auto rounded-xl p-2 border flex items-center justify-center overflow-hidden ${
              isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-black border-zinc-800'
            }`}
          >
            {/* Checkerboard transparency pattern */}
            <div
              className="absolute inset-2 rounded-lg opacity-15"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #71717a 25%, transparent 25%),
                  linear-gradient(-45deg, #71717a 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #71717a 75%),
                  linear-gradient(-45deg, transparent 75%, #71717a 75%)
                `,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            />

            <canvas
              ref={previewCanvasRef}
              className="relative w-full h-full object-contain rounded-full shadow-md"
            />
          </div>

          {/* Verification checklist */}
          <div className="space-y-2.5 text-xs">
            <div className={`p-3 rounded-xl border space-y-1.5 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Dimensiones:</span>
                <span className="font-mono font-bold text-emerald-500 tabular-nums">
                  779 × 779 px
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Resolución:</span>
                <span className="font-mono tabular-nums">300 DPI</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Corte total:</span>
                <span className="font-mono tabular-nums">Ø 6.6 cm (66 mm)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Cara visible:</span>
                <span className="font-mono tabular-nums">Ø 5.8 cm (58 mm)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Fondo exterior:</span>
                <span className="font-mono text-emerald-500">Transparente</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Imagen cruda recortada sin efectos añadidos.</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[40px] ${
              isLight
                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                : 'bg-zinc-100 text-zinc-950 hover:bg-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isDownloading ? 'Generando archivo...' : 'Descargar archivo PNG (779×779 px)'}
            </span>
          </button>

          {downloadSuccess && (
            <p className="text-center text-xs text-emerald-400 font-medium animate-in fade-in flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>¡Archivo descargado!</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

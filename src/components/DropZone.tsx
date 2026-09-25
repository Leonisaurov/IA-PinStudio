import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { PHYSICAL_SPECS, AppTheme } from '../constants/specs';
import { SAMPLE_BADGES, SampleBadge } from '../constants/samples';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onSelectSample: (sample: SampleBadge) => void;
  theme: AppTheme;
  errorMessage?: string | null;
  isLoading?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  onSelectSample,
  theme,
  errorMessage,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLight = theme === 'paper-light';
  const isMinimalBlack = theme === 'minimal-black';

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndDispatch = (file: File) => {
    setLocalError(null);

    if (!PHYSICAL_SPECS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setLocalError('Formato no compatible. Sube una imagen JPG, PNG o WebP.');
      return;
    }

    if (file.size > PHYSICAL_SPECS.MAX_FILE_SIZE_BYTES) {
      setLocalError(
        `El archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB. Límite máximo: 20 MB.`
      );
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndDispatch(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndDispatch(files[0]);
    }
  };

  const activeError = localError || errorMessage;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-12 flex flex-col items-center select-none">
      {/* Title & pitch */}
      <div className="text-center max-w-2xl mb-6 sm:mb-8 space-y-2 sm:space-y-3">
        <h1
          className={`text-2xl sm:text-4xl font-bold tracking-tight ${
            isLight ? 'text-zinc-900' : 'text-white'
          }`}
        >
          Personalizador de Pines & Chapas
        </h1>
        <p
          className={`text-xs sm:text-base leading-relaxed ${
            isLight ? 'text-zinc-600' : 'text-zinc-400'
          }`}
        >
          Chapas estándar de <strong className={isLight ? 'text-zinc-900 font-semibold' : 'text-zinc-200 font-semibold'}>5.8 cm</strong> con sangría de imprenta de 4 mm (corte de 6.6 cm).
          Exportación cruda a <strong className={isLight ? 'text-zinc-900 font-semibold' : 'text-zinc-200 font-semibold'}>300 DPI exactos (779 × 779 px)</strong> y mockup 3D en tiempo real.
        </p>
      </div>

      {/* Main Dropzone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Subir foto para personalizar pin"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`w-full relative border rounded-2xl p-5 xs:p-8 sm:p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
          isDragging
            ? isLight
              ? 'border-zinc-800 bg-zinc-100 scale-[1.01]'
              : 'border-zinc-400 bg-zinc-900/60 scale-[1.01]'
            : isLight
            ? 'border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50'
            : isMinimalBlack
            ? 'border-zinc-850 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-900/40'
            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {/* Upload Icon */}
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-105 border ${
            isLight
              ? 'border-zinc-300 bg-zinc-100 text-zinc-800'
              : 'border-zinc-800 bg-zinc-900 text-zinc-300'
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </div>

        <h2
          className={`text-base sm:text-xl font-semibold mb-1.5 ${
            isLight ? 'text-zinc-900' : 'text-white'
          }`}
        >
          {isDragging ? 'Suelta tu imagen aquí' : 'Arrastra una foto o haz clic para seleccionarla'}
        </h2>
        <p
          className={`text-xs sm:text-sm max-w-md mb-5 sm:mb-6 ${
            isLight ? 'text-zinc-500' : 'text-zinc-400'
          }`}
        >
          JPG, PNG o WebP (hasta 20 MB). Procesamiento 100% privado en tu navegador.
        </p>

        <div className="flex flex-col xs:flex-row items-center gap-2 sm:gap-2.5 w-full xs:w-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isLoading}
            className={`w-full xs:w-auto px-4 sm:px-5 py-2.5 text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 min-h-[38px] sm:min-h-[40px] ${
              isLight
                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                : 'bg-zinc-100 text-zinc-950 hover:bg-white'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">Subir foto desde tu dispositivo</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (SAMPLE_BADGES.length > 0) {
                onSelectSample(SAMPLE_BADGES[0]);
              }
            }}
            disabled={isLoading}
            className={`w-full xs:w-auto px-3.5 sm:px-4 py-2.5 text-xs font-medium rounded-xl border transition-all flex items-center justify-center gap-2 min-h-[38px] sm:min-h-[40px] ${
              isLight
                ? 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-800'
                : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-850 text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Probar demo en vivo</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {activeError && (
        <div
          role="alert"
          className="w-full mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold">Error al cargar archivo</p>
            <p className="text-rose-200/80 text-[11px] mt-0.5">{activeError}</p>
          </div>
        </div>
      )}

      {/* Sample Badges: Probar con imagen de ejemplo */}
      <div className="w-full mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'text-zinc-600' : 'text-zinc-400'
              }`}
            >
              Muestras preparadas a 300 DPI
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_BADGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample)}
              className={`group text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                isLight
                  ? 'bg-white border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                  : isMinimalBlack
                  ? 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/60'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/50">
                <img
                  src={sample.src}
                  alt={sample.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4
                  className={`text-xs font-semibold truncate ${
                    isLight ? 'text-zinc-900' : 'text-white'
                  }`}
                >
                  {sample.title}
                </h4>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {sample.tagline}
                </p>
                <div className="flex items-center gap-1 text-[11px] font-medium mt-1 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <span>Probar</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Specifications Card */}
      <div
        className={`w-full mt-6 sm:mt-10 p-3.5 xs:p-4 rounded-xl border text-xs ${
          isLight
            ? 'bg-zinc-50 border-zinc-200'
            : isMinimalBlack
            ? 'bg-zinc-950/60 border-zinc-900'
            : 'bg-slate-900/40 border-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <h3
            className={`text-[11px] xs:text-xs font-semibold uppercase tracking-wider truncate ${
              isLight ? 'text-zinc-700' : 'text-zinc-400'
            }`}
          >
            Especificación física de fabricación (58 mm)
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-3">
          <div
            className={`p-2 xs:p-2.5 rounded-lg border ${
              isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-850'
            }`}
          >
            <span className="text-zinc-500 block mb-0.5 text-[10px] xs:text-[11px]">Zona visible</span>
            <span
              className={`text-xs font-bold font-mono tabular-nums ${
                isLight ? 'text-zinc-900' : 'text-white'
              }`}
            >
              Ø 5.8 cm
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">685 × 685 px</span>
          </div>
          <div
            className={`p-2 xs:p-2.5 rounded-lg border ${
              isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-850'
            }`}
          >
            <span className="text-zinc-500 block mb-0.5 text-[10px] xs:text-[11px]">Sangrado</span>
            <span
              className={`text-xs font-bold font-mono tabular-nums ${
                isLight ? 'text-zinc-900' : 'text-white'
              }`}
            >
              4 mm / lado
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Franja doblado</span>
          </div>
          <div
            className={`p-2 xs:p-2.5 rounded-lg border ${
              isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-850'
            }`}
          >
            <span className="text-zinc-500 block mb-0.5 text-[10px] xs:text-[11px]">Corte imprenta</span>
            <span className="text-xs font-bold font-mono text-emerald-400 tabular-nums">
              Ø 6.6 cm
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">779 px @ 300 DPI</span>
          </div>
          <div
            className={`p-2 xs:p-2.5 rounded-lg border ${
              isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-850'
            }`}
          >
            <span className="text-zinc-500 block mb-0.5 text-[10px] xs:text-[11px]">Formato salida</span>
            <span
              className={`text-xs font-bold font-mono ${
                isLight ? 'text-zinc-900' : 'text-white'
              }`}
            >
              PNG transparente
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Sin compresión</span>
          </div>
        </div>
      </div>
    </div>
  );
};

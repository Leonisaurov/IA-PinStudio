import React from 'react';
import { AppMode, AppTheme, THEME_OPTIONS } from '../constants/specs';
import { Printer, Eye, Upload, Download, HelpCircle, Palette } from 'lucide-react';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  hasImage: boolean;
  onNewImageClick: () => void;
  onExportClick: () => void;
  onHelpClick: () => void;
  isExporting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  theme,
  onThemeChange,
  hasImage,
  onNewImageClick,
  onExportClick,
  onHelpClick,
  isExporting = false,
}) => {
  const isLight = theme === 'paper-light';
  const currentThemeOpt = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  const cycleTheme = () => {
    const currentIndex = THEME_OPTIONS.findIndex((t) => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    onThemeChange(THEME_OPTIONS[nextIndex].id);
  };

  const borderClass = isLight
    ? 'border-zinc-200'
    : theme === 'minimal-black'
    ? 'border-zinc-900'
    : 'border-zinc-800';

  const bgClass = isLight
    ? 'bg-white/95 text-zinc-900'
    : theme === 'minimal-black'
    ? 'bg-black/95 text-zinc-100'
    : 'bg-zinc-950/95 text-zinc-100';

  return (
    <header
      className={`border-b sticky top-0 z-40 select-none transition-colors duration-200 ${bgClass} ${borderClass}`}
    >
      {/* Primary Row */}
      <div className="flex items-center justify-between px-2.5 sm:px-6 py-1.5 sm:py-2.5 gap-1.5">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          <div
            className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
              isLight
                ? 'border-zinc-300 bg-zinc-100 text-zinc-900'
                : 'border-zinc-800 bg-zinc-900 text-zinc-200'
            }`}
          >
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-current" />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight sm:tracking-wider uppercase font-mono truncate">
            PinStudio
          </span>
        </div>

        {/* Zone 2 (Desktop): Centered Mode Tabs (>= sm) */}
        {hasImage && (
          <nav
            role="tablist"
            aria-label="Modo de aplicación"
            className={`hidden sm:flex items-center p-0.5 rounded-lg border transition-colors ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-850'
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'production'}
              onClick={() => onModeChange('production')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap min-h-[30px] ${
                mode === 'production'
                  ? isLight
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'bg-zinc-800 text-white shadow-sm'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>1. Producción (Corte)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'preview'}
              onClick={() => onModeChange('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap min-h-[30px] ${
                mode === 'preview'
                  ? isLight
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'bg-zinc-800 text-white shadow-sm'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>2. Vista Previa 3D</span>
            </button>
          </nav>
        )}

        {/* Zone 3: Theme Switcher & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Desktop segmented theme selector (>= md) */}
          <div
            role="group"
            aria-label="Selector de tema"
            className={`hidden md:flex items-center p-0.5 rounded-lg border transition-colors ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-850'
            }`}
          >
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onThemeChange(opt.id)}
                title={`Tema: ${opt.name}`}
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded transition-all ${
                  theme === opt.id
                    ? isLight
                      ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                      : 'bg-zinc-800 text-white shadow-sm font-semibold'
                    : isLight
                    ? 'text-zinc-500 hover:text-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                <span>{opt.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Mobile compact theme cycle button (< md) */}
          <button
            type="button"
            onClick={cycleTheme}
            title={`Tema actual: ${currentThemeOpt.name}. Toca para cambiar.`}
            className={`md:hidden flex items-center gap-1 px-1.5 sm:px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors shrink-0 ${
              isLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-700 active:bg-zinc-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 active:bg-zinc-850'
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${currentThemeOpt.dotColor}`} />
            <span className="hidden xxs:inline text-[10px] uppercase font-mono">{currentThemeOpt.shortLabel}</span>
          </button>

          {hasImage ? (
            <>
              <button
                type="button"
                onClick={onHelpClick}
                title="Atajos de teclado y ayuda"
                aria-label="Atajos de teclado y ayuda"
                className={`hidden lg:flex items-center justify-center w-7 h-7 rounded-lg border transition-colors ${
                  isLight
                    ? 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    : 'border-zinc-850 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onNewImageClick}
                title="Subir otra imagen"
                className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap min-h-[28px] sm:min-h-[30px] shrink-0 ${
                  isLight
                    ? 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-850 hover:text-white'
                }`}
              >
                <Upload className="w-3 h-3 shrink-0" />
                <span className="text-[10px] sm:text-xs">Foto</span>
              </button>

              <button
                type="button"
                onClick={onExportClick}
                disabled={isExporting}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap min-h-[30px] disabled:opacity-50 shrink-0 ${
                  isLight
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                    : 'bg-zinc-100 text-zinc-950 hover:bg-white font-semibold'
                }`}
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>{isExporting ? 'Exportando...' : 'Exportar (779px)'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onHelpClick}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors shrink-0 ${
                isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="text-[11px]">Guía</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Row: Full-width Segmented Mode Tabs (< sm) */}
      {hasImage && (
        <div className="sm:hidden px-2 pb-1.5 pt-0.5">
          <nav
            role="tablist"
            aria-label="Modo de aplicación"
            className={`grid grid-cols-2 p-0.5 rounded-lg border transition-colors ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-850'
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'production'}
              onClick={() => onModeChange('production')}
              className={`flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-medium rounded-md transition-all min-h-[32px] min-w-0 ${
                mode === 'production'
                  ? isLight
                    ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate text-[11px] xs:text-xs">Corte 58mm</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'preview'}
              onClick={() => onModeChange('preview')}
              className={`flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-medium rounded-md transition-all min-h-[32px] min-w-0 ${
                mode === 'preview'
                  ? isLight
                    ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate text-[11px] xs:text-xs">Vista 3D</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import { X, Keyboard, ShieldCheck } from 'lucide-react';
import { AppTheme } from '../constants/specs';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'paper-light';
  const isMinimalBlack = theme === 'minimal-black';

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

  const kbdBg = isLight
    ? 'bg-white border-zinc-300 text-zinc-800'
    : 'bg-zinc-900 border-zinc-750 text-zinc-200';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none overflow-y-auto"
    >
      <div className={`relative w-full max-w-lg max-h-[92dvh] overflow-y-auto border rounded-2xl p-4 xs:p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 transition-colors ${modalBg}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-inherit gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg border border-inherit shrink-0">
              <Keyboard className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="min-w-0">
              <h2 id="modal-title" className="text-xs sm:text-sm font-bold truncate">
                Atajos de teclado
              </h2>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate">
                Control rápido para diseño y encuadre
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

        {/* Shortcuts List */}
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className={`flex items-center justify-between p-2 rounded-xl border ${cardBg}`}>
              <span className="text-zinc-400">Mover máscara</span>
              <kbd className={`px-2 py-0.5 rounded border font-mono text-[11px] ${kbdBg}`}>
                ↑ ↓ ← →
              </kbd>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-xl border ${cardBg}`}>
              <span className="text-zinc-400">Paso rápido</span>
              <kbd className={`px-2 py-0.5 rounded border font-mono text-[11px] ${kbdBg}`}>
                Shift + Flechas
              </kbd>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-xl border ${cardBg}`}>
              <span className="text-zinc-400">Zoom +/-</span>
              <kbd className={`px-2 py-0.5 rounded border font-mono text-[11px] ${kbdBg}`}>
                + / -
              </kbd>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-xl border ${cardBg}`}>
              <span className="text-zinc-400">Girar 90°</span>
              <kbd className={`px-2 py-0.5 rounded border font-mono text-[11px] ${kbdBg}`}>
                R
              </kbd>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-xl border ${cardBg}`}>
              <span className="text-zinc-400">Voltear</span>
              <kbd className={`px-2 py-0.5 rounded border font-mono text-[11px] ${kbdBg}`}>
                H / V
              </kbd>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-xl border ${cardBg}`}>
              <span className="text-zinc-400">Centrar máscara</span>
              <kbd className={`px-2 py-0.5 rounded border font-mono text-[11px] ${kbdBg}`}>
                C
              </kbd>
            </div>
          </div>
        </div>

        {/* Specs recap */}
        <div className={`p-3 rounded-xl border space-y-1.5 text-xs ${cardBg}`}>
          <div className="flex items-center gap-1.5 font-semibold text-[11px] text-emerald-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fórmula de resolución exacta (300 DPI)</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            300 DPI = 118.11 px/cm. Chapa física de 5.8 cm con 4 mm de sangría (6.6 cm) $\to$ archivo de corte a <strong className="text-zinc-200 font-mono">779 × 779 px</strong> transparente.
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`w-full py-2 text-xs font-semibold rounded-xl border transition-colors ${
            isLight
              ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
              : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-200'
          }`}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

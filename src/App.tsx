import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PHYSICAL_SPECS, AppMode, CropState, QualityAnalysis, ImageMetadata, AppTheme } from './constants/specs';
import { SAMPLE_BADGES, SampleBadge } from './constants/samples';
import { clampCrop, analyzeQuality, renderProductionCanvas, downloadCanvas } from './utils/imageMath';
import { saveSession, loadSession, clearSession, createPersistentDataUrl } from './utils/storage';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ProductionCanvas } from './components/ProductionCanvas';
import { DesktopSidebar } from './components/DesktopSidebar';
import { MobileControls } from './components/MobileControls';
import { ThreePinPreview } from './components/ThreePinPreview';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('pinstudio_theme_v1');
      if (saved === 'minimal-black' || saved === 'slate-dark' || saved === 'paper-light') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'minimal-black'; // Default: new minimalist black theme!
  });

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('pinstudio_theme_v1', newTheme);
    } catch {
      // ignore
    }
  };

  const [mode, setMode] = useState<AppMode>('production');
  const [crop, setCrop] = useState<CropState>({
    x: 0,
    y: 0,
    zoom: 1.0,
    rotation: 0,
    flipH: false,
    flipV: false,
  });
  const [showGuides, setShowGuides] = useState(true);
  const [showFoldOverlay, setShowFoldOverlay] = useState(false);

  // Image states
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  /**
   * 1. Restore session on mount from localStorage
   */
  useEffect(() => {
    const session = loadSession();
    if (session) {
      if (session.activeMode) setMode(session.activeMode);
      if (session.showGuides !== undefined) setShowGuides(session.showGuides);
      if (session.showFoldOverlay !== undefined) setShowFoldOverlay(session.showFoldOverlay);

      if (session.imageMeta && session.imageMeta.dataUrl) {
        setIsLoading(true);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setImageElement(img);
          setImageMeta(session.imageMeta);
          if (session.crop) {
            setCrop(clampCrop(session.crop, img.naturalWidth, img.naturalHeight));
          }
          setIsLoading(false);
        };
        img.onerror = () => {
          console.warn('Could not restore image from saved session');
          setIsLoading(false);
        };
        img.src = session.imageMeta.dataUrl;
      }
    }
  }, []);

  /**
   * 2. Save session to localStorage when state updates
   */
  useEffect(() => {
    if (!imageElement || !imageMeta) return;

    saveSession({
      crop,
      activeMode: mode,
      showGuides,
      showFoldOverlay,
      imageMeta: {
        name: imageMeta.name,
        width: imageElement.naturalWidth,
        height: imageElement.naturalHeight,
        fileSize: imageMeta.fileSize,
        dataUrl: imageMeta.dataUrl,
      },
    });
  }, [crop, mode, showGuides, showFoldOverlay, imageElement, imageMeta]);

  /**
   * Load image helper from URL / dataURL
   */
  const loadImageFromSource = useCallback(
    (src: string, name: string, fileSize: number) => {
      setIsLoading(true);
      setErrorMessage(null);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        setImageElement(img);
        const persistentDataUrl = await createPersistentDataUrl(img, src);
        setImageMeta({
          name,
          width: img.naturalWidth,
          height: img.naturalHeight,
          fileSize,
          dataUrl: persistentDataUrl,
        });

        // Initialize centered crop
        const initialCrop: CropState = {
          x: 0,
          y: 0,
          zoom: 1.0,
          rotation: 0,
          flipH: false,
          flipV: false,
        };
        setCrop(clampCrop(initialCrop, img.naturalWidth, img.naturalHeight));
        setIsLoading(false);
      };

      img.onerror = () => {
        setErrorMessage('No se pudo cargar la imagen seleccionada. Intenta con otro archivo.');
        setIsLoading(false);
      };

      img.src = src;
    },
    []
  );

  /**
   * Handle user file upload
   */
  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        loadImageFromSource(dataUrl, file.name, file.size);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo desde el dispositivo.');
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle sample badge preset selection
   */
  const handleSelectSample = (sample: SampleBadge) => {
    loadImageFromSource(sample.src, `${sample.id}.jpg`, 450 * 1024);
  };

  /**
   * Quality analysis derived from current crop & image
   */
  const quality: QualityAnalysis = useMemo(() => {
    if (!imageElement) {
      return {
        ratio: 1,
        level: 'acceptable',
        effectiveDpi: 300,
        title: 'Estándar',
        badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        advice: '',
      };
    }
    return analyzeQuality(crop, imageElement.naturalWidth, imageElement.naturalHeight);
  }, [crop, imageElement]);

  /**
   * Direct high-resolution 300 DPI PNG download
   */
  const handleDirectExport = async () => {
    if (!imageElement) return;
    try {
      setIsExporting(true);
      const canvas = renderProductionCanvas(imageElement, crop);
      await downloadCanvas(
        canvas,
        `pinstudio-corte-imprenta-66mm-300dpi-${Date.now()}.png`
      );
    } catch (err) {
      console.error('Error during direct export:', err);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Desktop Keyboard Shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!imageElement) return;

      const step = e.shiftKey ? 10 : 2;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setCrop((prev) =>
            clampCrop(
              { ...prev, x: prev.x - step },
              imageElement.naturalWidth,
              imageElement.naturalHeight
            )
          );
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCrop((prev) =>
            clampCrop(
              { ...prev, x: prev.x + step },
              imageElement.naturalWidth,
              imageElement.naturalHeight
            )
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setCrop((prev) =>
            clampCrop(
              { ...prev, y: prev.y - step },
              imageElement.naturalWidth,
              imageElement.naturalHeight
            )
          );
          break;
        case 'ArrowDown':
          e.preventDefault();
          setCrop((prev) =>
            clampCrop(
              { ...prev, y: prev.y + step },
              imageElement.naturalWidth,
              imageElement.naturalHeight
            )
          );
          break;
        case '+':
        case '=':
          e.preventDefault();
          setCrop((prev) =>
            clampCrop(
              { ...prev, zoom: prev.zoom + 0.1 },
              imageElement.naturalWidth,
              imageElement.naturalHeight
            )
          );
          break;
        case '-':
        case '_':
          e.preventDefault();
          setCrop((prev) =>
            clampCrop(
              { ...prev, zoom: prev.zoom - 0.1 },
              imageElement.naturalWidth,
              imageElement.naturalHeight
            )
          );
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setCrop((prev) =>
            clampCrop(
              { ...prev, rotation: (prev.rotation + 90) % 360 },
              imageElement.naturalWidth,
              imageElement.naturalHeight
            )
          );
          break;
        case 'f':
        case 'F':
        case 'h':
        case 'H':
          e.preventDefault();
          setCrop((prev) => ({ ...prev, flipH: !prev.flipH }));
          break;
        case 'v':
        case 'V':
          e.preventDefault();
          setCrop((prev) => ({ ...prev, flipV: !prev.flipV }));
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          setCrop((prev) =>
            clampCrop(
              { ...prev, x: 0, y: 0 },
              imageElement.naturalWidth,
              imageElement.naturalHeight
            )
          );
          break;
        case '1':
          e.preventDefault();
          setMode('production');
          break;
        case '2':
          e.preventDefault();
          setMode('preview');
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setShowGuides((prev) => !prev);
          break;
        case '?':
          e.preventDefault();
          setIsShortcutsOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageElement]);

  const handleResetImage = () => {
    setImageElement(null);
    setImageMeta(null);
    clearSession();
  };

  const isLight = theme === 'paper-light';
  const isMinimalBlack = theme === 'minimal-black';

  const rootBgClass = isLight
    ? 'bg-zinc-100 text-zinc-900'
    : isMinimalBlack
    ? 'bg-black text-zinc-100'
    : 'bg-slate-950 text-slate-100';

  return (
    <div className={`h-full h-[100dvh] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden transition-colors duration-200 ${rootBgClass}`}>
      {/* 1. Universal Top Bar */}
      <Header
        mode={mode}
        onModeChange={setMode}
        theme={theme}
        onThemeChange={handleThemeChange}
        hasImage={!!imageElement}
        onNewImageClick={handleResetImage}
        onExportClick={() => setIsExportModalOpen(true)}
        onHelpClick={() => setIsShortcutsOpen(true)}
        isExporting={isExporting}
      />

      {/* 2. Main Workspace Body */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {!imageElement ? (
          /* Landing Screen when no image is loaded */
          <div className="flex-1 overflow-y-auto">
            <DropZone
              onFileSelect={handleFileSelect}
              onSelectSample={handleSelectSample}
              theme={theme}
              errorMessage={errorMessage}
              isLoading={isLoading}
            />
          </div>
        ) : mode === 'production' ? (
          /* Mode 1: Production (Corte para imprenta a 300 DPI) */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Canvas Area */}
            <div className="flex-1 relative h-full min-h-0 overflow-hidden">
              <ProductionCanvas
                image={imageElement}
                crop={crop}
                onCropChange={setCrop}
                showGuides={showGuides}
                onToggleGuides={() => setShowGuides(!showGuides)}
                showFoldOverlay={showFoldOverlay}
                onToggleFoldOverlay={() => setShowFoldOverlay(!showFoldOverlay)}
                theme={theme}
              />
            </div>

            {/* Desktop Sidebar (>= 768px) */}
            <div className="hidden md:block h-full shrink-0">
              <DesktopSidebar
                crop={crop}
                onCropChange={setCrop}
                naturalWidth={imageElement.naturalWidth}
                naturalHeight={imageElement.naturalHeight}
                quality={quality}
                theme={theme}
                onExportClick={() => setIsExportModalOpen(true)}
                isExporting={isExporting}
              />
            </div>

            {/* Mobile Bottom Touch Controls (< 768px) */}
            <MobileControls
              crop={crop}
              onCropChange={setCrop}
              naturalWidth={imageElement.naturalWidth}
              naturalHeight={imageElement.naturalHeight}
              quality={quality}
              theme={theme}
              onExportClick={() => setIsExportModalOpen(true)}
              isExporting={isExporting}
            />
          </div>
        ) : (
          /* Mode 2: Vista previa 3D interactiva */
          <div className="flex-1 relative h-full min-h-0 overflow-hidden">
            <ThreePinPreview
              image={imageElement}
              crop={crop}
              quality={quality}
              theme={theme}
              showFoldOverlay={showFoldOverlay}
              onToggleFoldOverlay={() => setShowFoldOverlay(!showFoldOverlay)}
              onBackToProduction={() => setMode('production')}
              onExportProduction={() => setIsExportModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* 3. Export Dialog & Verification Checklist */}
      {imageElement && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          image={imageElement}
          crop={crop}
          quality={quality}
          theme={theme}
        />
      )}

      {/* 4. Keyboard Shortcuts & Specs Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        theme={theme}
      />
    </div>
  );
}

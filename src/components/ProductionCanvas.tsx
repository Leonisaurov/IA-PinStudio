import React, { useRef, useEffect, useCallback } from 'react';
import { PHYSICAL_SPECS, CropState, QualityAnalysis, AppTheme } from '../constants/specs';
import { clampCrop, getOrientedDimensions, analyzeQuality } from '../utils/imageMath';
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical, Move } from 'lucide-react';

interface ProductionCanvasProps {
  image: HTMLImageElement;
  crop: CropState;
  onCropChange: (newCrop: CropState) => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  showFoldOverlay: boolean;
  onToggleFoldOverlay: () => void;
  theme: AppTheme;
}

export const ProductionCanvas: React.FC<ProductionCanvasProps> = ({
  image,
  crop,
  onCropChange,
  showGuides,
  onToggleGuides,
  showFoldOverlay,
  onToggleFoldOverlay,
  theme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dragging state refs (kept in refs for 60fps gesture response without re-rendering)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    initialCropX: number;
    initialCropY: number;
  }>({ pointerX: 0, pointerY: 0, initialCropX: 0, initialCropY: 0 });

  // Pinch-to-zoom tracking for mobile touch devices
  const touchPinchRef = useRef<{
    initialDistance: number;
    initialZoom: number;
  } | null>(null);

  // Layout metrics calculated on each render/resize
  const metricsRef = useRef<{
    width: number;
    height: number;
    dpr: number;
    maskRadiusScreen: number; // outer 6.6cm circle radius on screen
    visibleRadiusScreen: number; // inner 5.8cm circle radius on screen
    screenScale: number; // pixels on screen per source pixel
    centerScreenX: number;
    centerScreenY: number;
  }>({
    width: 0,
    height: 0,
    dpr: 1,
    maskRadiusScreen: 150,
    visibleRadiusScreen: 130,
    screenScale: 1,
    centerScreenX: 0,
    centerScreenY: 0,
  });

  const cropRef = useRef(crop);
  cropRef.current = crop;

  const showGuidesRef = useRef(showGuides);
  showGuidesRef.current = showGuides;

  const showFoldOverlayRef = useRef(showFoldOverlay);
  showFoldOverlayRef.current = showFoldOverlay;

  /**
   * Main high-performance render function
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(60, Math.floor(rect.width));
    const height = Math.max(60, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Theme constants
    const isLight = theme === 'paper-light';
    const isMinimalBlack = theme === 'minimal-black';

    // Canvas backdrop
    ctx.fillStyle = isMinimalBlack ? '#050507' : isLight ? '#f4f4f6' : '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Subtle checkered grid pattern for transparency awareness
    const gridSize = 20;
    ctx.fillStyle = isMinimalBlack ? '#0c0c0e' : isLight ? '#e4e4e9' : '#0e1320';
    for (let x = 0; x < width; x += gridSize * 2) {
      for (let y = 0; y < height; y += gridSize * 2) {
        ctx.fillRect(x, y, gridSize, gridSize);
        ctx.fillRect(x + gridSize, y + gridSize, gridSize, gridSize);
      }
    }

    const currentCrop = cropRef.current;
    const { width: effW, height: effH } = getOrientedDimensions(
      image.naturalWidth,
      image.naturalHeight,
      currentCrop.rotation
    );

    // The mask radius on screen dynamically adapts to both width and height safety bounds
    const minViewportDim = Math.min(width, height);
    const maxRadiusForHeight = Math.max(25, Math.floor((height - 76) / 2));
    const maxRadiusForWidth = Math.max(25, Math.floor((width - 32) / 2));
    const maskRadiusScreen = Math.max(
      35,
      Math.min(Math.floor(minViewportDim * 0.38), maxRadiusForHeight, maxRadiusForWidth)
    );
    const visibleRadiusScreen = maskRadiusScreen * PHYSICAL_SPECS.VISIBLE_TO_CUT_RATIO;

    const centerScreenX = width / 2;
    const centerScreenY = height / 2;

    // Source image dimensions mapped to cut circle
    const minSrcDim = Math.min(effW, effH);
    const cutDiameterSrc = minSrcDim / currentCrop.zoom;
    const screenScale = (maskRadiusScreen * 2) / cutDiameterSrc;

    // Store metrics for event handlers
    metricsRef.current = {
      width,
      height,
      dpr,
      maskRadiusScreen,
      visibleRadiusScreen,
      screenScale,
      centerScreenX,
      centerScreenY,
    };

    // 1. Draw the user's photo transformed
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Move to center of the viewport
    ctx.translate(centerScreenX, centerScreenY);

    // Scale from image source pixels to screen pixels
    ctx.scale(screenScale, screenScale);

    // Pan image opposite to crop offset
    // Note: crop.x and crop.y are in oriented image space
    const rad = (-currentCrop.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const unrotatedCropX = currentCrop.x * cos - currentCrop.y * sin;
    const unrotatedCropY = currentCrop.x * sin + currentCrop.y * cos;

    // Apply rotation around image center
    ctx.rotate((currentCrop.rotation * Math.PI) / 180);

    // Apply flips
    ctx.scale(currentCrop.flipH ? -1 : 1, currentCrop.flipV ? -1 : 1);

    // Shift to align center of image
    ctx.translate(-image.naturalWidth / 2 - unrotatedCropX, -image.naturalHeight / 2 - unrotatedCropY);

    // Draw full natural image
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

    ctx.restore();

    // 2. Dimmed overlay outside 6.6 cm cutting circle
    ctx.save();
    ctx.fillStyle = isMinimalBlack
      ? 'rgba(5, 5, 7, 0.88)'
      : isLight
      ? 'rgba(244, 244, 246, 0.86)'
      : 'rgba(7, 10, 19, 0.78)';
    ctx.beginPath();
    // Fill entire screen
    ctx.rect(0, 0, width, height);
    // Cut out outer circle (counter-clockwise)
    ctx.arc(centerScreenX, centerScreenY, maskRadiusScreen, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // 3. Bleed fold visualizer overlay (Franja de sangrado de 4 mm)
    if (showFoldOverlayRef.current) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerScreenX, centerScreenY, maskRadiusScreen, 0, Math.PI * 2, false);
      ctx.arc(centerScreenX, centerScreenY, visibleRadiusScreen, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.fill();

      // Hatching stripes for bleed
      ctx.clip();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 1;
      for (let i = -width; i < width + height; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Cutting and visible guides with high contrast labels
    if (showGuidesRef.current) {
      // 4a. Outer circle: 6.6 cm - corte imprenta (dashed)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerScreenX, centerScreenY, maskRadiusScreen, 0, Math.PI * 2);
      ctx.strokeStyle = isLight ? '#18181b' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.stroke();

      // Secondary contrasting ring under dash
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.restore();

      // 4b. Inner circle: 5.8 cm - zona visible (continuous)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerScreenX, centerScreenY, visibleRadiusScreen, 0, Math.PI * 2);
      ctx.strokeStyle = isLight ? '#0284c7' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.restore();

      // 4c. Center crosshair
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(24, 24, 27, 0.35)' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      const crossSize = 10;
      ctx.beginPath();
      ctx.moveTo(centerScreenX - crossSize, centerScreenY);
      ctx.lineTo(centerScreenX + crossSize, centerScreenY);
      ctx.moveTo(centerScreenX, centerScreenY - crossSize);
      ctx.lineTo(centerScreenX, centerScreenY + crossSize);
      ctx.stroke();
      ctx.restore();

      // 4d. Guide labels (Adaptive contrast badges)
      ctx.save();
      const isExtraNarrow = width < 360 || height < 360;
      const isNarrow = width < 440;
      ctx.font = isExtraNarrow
        ? '600 9px "Plus Jakarta Sans", sans-serif'
        : isNarrow
        ? '600 10px "Plus Jakarta Sans", sans-serif'
        : '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Top label for 6.6 cm cut
      const topLabel = isExtraNarrow
        ? '6.6 cm · Corte'
        : isNarrow
        ? '6.6 cm · Corte imprenta'
        : '6.6 cm — corte imprenta (sangría 4mm)';
      const topLabelWidth = ctx.measureText(topLabel).width;
      const badgeH = isExtraNarrow ? 16 : isNarrow ? 18 : 20;
      const pad = isExtraNarrow ? 4 : isNarrow ? 6 : 8;
      const topLabelY = Math.max(badgeH / 2 + 38, centerScreenY - maskRadiusScreen - (isExtraNarrow ? 11 : isNarrow ? 13 : 16));

      ctx.fillStyle = isLight
        ? 'rgba(255, 255, 255, 0.95)'
        : isMinimalBlack
        ? 'rgba(18, 18, 20, 0.95)'
        : 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = isLight ? 'rgba(212, 212, 216, 0.9)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      roundRect(ctx, centerScreenX - topLabelWidth / 2 - pad, topLabelY - badgeH / 2, topLabelWidth + pad * 2, badgeH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLight ? '#18181b' : '#f8fafc';
      ctx.fillText(topLabel, centerScreenX, topLabelY);

      // Bottom label for 5.8 cm visible
      const bottomLabel = isExtraNarrow
        ? '5.8 cm · Visible'
        : isNarrow
        ? '5.8 cm · Cara visible'
        : '5.8 cm — zona visible del pin';
      const bottomLabelWidth = ctx.measureText(bottomLabel).width;
      const bottomLabelY = Math.min(height - badgeH / 2 - 8, centerScreenY + visibleRadiusScreen - (isExtraNarrow ? 10 : isNarrow ? 13 : 16));

      ctx.fillStyle = isLight
        ? 'rgba(255, 255, 255, 0.95)'
        : isMinimalBlack
        ? 'rgba(18, 18, 20, 0.95)'
        : 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.4)' : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      roundRect(
        ctx,
        centerScreenX - bottomLabelWidth / 2 - pad,
        bottomLabelY - badgeH / 2,
        bottomLabelWidth + pad * 2,
        badgeH,
        4
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLight ? '#0369a1' : '#38bdf8';
      ctx.fillText(bottomLabel, centerScreenX, bottomLabelY);

      ctx.restore();
    }

    ctx.restore();
  }, [image]);

  // Request animation frame runner on crop / guide changes + ResizeObserver
  useEffect(() => {
    let animId: number;
    const scheduleRender = () => {
      animId = requestAnimationFrame(render);
    };
    scheduleRender();

    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleRender();
      });
      resizeObserver.observe(container);
    }

    const handleResize = () => {
      scheduleRender();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [render, crop, showGuides, showFoldOverlay]);

  /**
   * Pointer Event Handlers for smooth, lag-free dragging
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialCropX: cropRef.current.x,
      initialCropY: cropRef.current.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();

    const { pointerX, pointerY, initialCropX, initialCropY } = dragStartRef.current;
    const { screenScale } = metricsRef.current;
    if (screenScale <= 0) return;

    // Delta in screen pixels
    const deltaScreenX = e.clientX - pointerX;
    const deltaScreenY = e.clientY - pointerY;

    // Convert screen delta to image coordinates
    // When the user drags the mask to the right, the offset shifts in sync
    const deltaImgX = deltaScreenX / screenScale;
    const deltaImgY = deltaScreenY / screenScale;

    // Clamp crop to strictly prevent empty zone
    const updatedCrop = clampCrop(
      {
        ...cropRef.current,
        x: initialCropX + deltaImgX,
        y: initialCropY + deltaImgY,
      },
      image.naturalWidth,
      image.naturalHeight
    );

    onCropChange(updatedCrop);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const canvas = canvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      isDraggingRef.current = false;
    }
  };

  /**
   * Desktop Mouse Wheel Zoom with cursor as anchor
   */
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { screenScale, centerScreenX, centerScreenY } = metricsRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cursorScreenX = e.clientX - rect.left;
    const cursorScreenY = e.clientY - rect.top;

    // Offset of cursor relative to canvas center
    const relX = cursorScreenX - centerScreenX;
    const relY = cursorScreenY - centerScreenY;

    // Zoom multiplier
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const currentCrop = cropRef.current;
    const newZoom = currentCrop.zoom * zoomFactor;

    // Anchoring: adjust x & y so the point under cursor remains stable
    const zoomRatio = newZoom / currentCrop.zoom;
    const newX = currentCrop.x + (relX / screenScale) * (1 - 1 / zoomRatio);
    const newY = currentCrop.y + (relY / screenScale) * (1 - 1 / zoomRatio);

    const clamped = clampCrop(
      {
        ...currentCrop,
        zoom: newZoom,
        x: newX,
        y: newY,
      },
      image.naturalWidth,
      image.naturalHeight
    );

    onCropChange(clamped);
  };

  /**
   * Mobile touch pinch-to-zoom
   */
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchPinchRef.current = {
        initialDistance: dist,
        initialZoom: cropRef.current.zoom,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && touchPinchRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / touchPinchRef.current.initialDistance;
      const targetZoom = touchPinchRef.current.initialZoom * ratio;

      const clamped = clampCrop(
        {
          ...cropRef.current,
          zoom: targetZoom,
        },
        image.naturalWidth,
        image.naturalHeight
      );

      onCropChange(clamped);
    }
  };

  const handleTouchEnd = () => {
    touchPinchRef.current = null;
  };

  const isLight = theme === 'paper-light';
  const isMinimalBlack = theme === 'minimal-black';

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none touch-none transition-colors duration-200 ${
        isLight ? 'bg-zinc-100' : isMinimalBlack ? 'bg-black' : 'bg-slate-950'
      }`}
    >
      <canvas
        ref={canvasRef}
        role="region"
        aria-label="Lienzo de edición de corte de pin con máscara circular arrastrable"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
      />

      {/* Floating Canvas Top Overlay: Guide Toggles & Quick Controls */}
      <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-4 sm:right-4 flex items-center justify-between pointer-events-none z-10 gap-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleGuides}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] xs:text-[11px] sm:text-xs font-medium rounded-lg border backdrop-blur-md transition-all shadow-sm min-h-[28px] sm:min-h-[32px] ${
              showGuides
                ? isLight
                  ? 'bg-white/95 text-zinc-900 border-zinc-300 hover:bg-white'
                  : 'bg-zinc-900/95 text-zinc-100 border-zinc-800 hover:bg-zinc-850'
                : isLight
                ? 'bg-zinc-100/70 text-zinc-400 border-zinc-300 hover:text-zinc-700'
                : 'bg-black/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'
            }`}
          >
            {showGuides ? <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> : <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />}
            <span>Guías</span>
          </button>

          <button
            type="button"
            onClick={onToggleFoldOverlay}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] xs:text-[11px] sm:text-xs font-medium rounded-lg border backdrop-blur-md transition-all shadow-sm min-h-[28px] sm:min-h-[32px] ${
              showFoldOverlay
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                : isLight
                ? 'bg-white/80 text-zinc-500 border-zinc-300 hover:text-zinc-800'
                : 'bg-black/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'
            }`}
          >
            <span className="hidden xxs:inline">Franja </span>
            <span>4mm</span>
          </button>
        </div>

        {/* Small Drag Hint (Desktop / Tablet only) */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium backdrop-blur-md border rounded-lg shadow-sm ${
            isLight
              ? 'bg-white/80 text-zinc-500 border-zinc-200'
              : 'bg-zinc-950/80 text-zinc-400 border-zinc-850'
          }`}
        >
          <Move className="w-3 h-3 text-zinc-400" />
          <span>Arrastra la máscara · Rueda para zoom</span>
        </div>
      </div>
    </div>
  );
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

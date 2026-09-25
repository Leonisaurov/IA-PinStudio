import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PHYSICAL_SPECS, CropState, QualityAnalysis, AppTheme } from '../constants/specs';
import { renderProductionCanvas, downloadCanvas } from '../utils/imageMath';
import {
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Camera,
  ArrowLeft,
  Play,
  Pause,
  Move
} from 'lucide-react';

interface ThreePinPreviewProps {
  image: HTMLImageElement;
  crop: CropState;
  quality: QualityAnalysis;
  theme: AppTheme;
  showFoldOverlay: boolean;
  onToggleFoldOverlay: () => void;
  onBackToProduction: () => void;
  onExportProduction: () => void;
}

export const ThreePinPreview: React.FC<ThreePinPreviewProps> = ({
  image,
  crop,
  quality,
  theme,
  showFoldOverlay,
  onToggleFoldOverlay,
  onBackToProduction,
  onExportProduction,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pinGroupRef = useRef<THREE.Group | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);

  // Free Rotation & Interaction Refs
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const targetDistRef = useRef(7.8);
  const currentDistRef = useRef(7.8);
  const isResettingRef = useRef(false);
  const touchPinchDistRef = useRef<number | null>(null);

  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isCapturingPreview, setIsCapturingPreview] = useState(false);

  const autoRotateRef = useRef(isAutoRotating);
  autoRotateRef.current = isAutoRotating;

  /**
   * Updates dynamic canvas texture for 3D face
   */
  const updateTexture = useCallback(() => {
    if (!image) return;

    const sourceCanvas = renderProductionCanvas(image, crop);
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = PHYSICAL_SPECS.CUT_PX;
    textureCanvas.height = PHYSICAL_SPECS.CUT_PX;
    const ctx = textureCanvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(sourceCanvas, 0, 0);

      if (showFoldOverlay) {
        const center = PHYSICAL_SPECS.CUT_PX / 2;
        const outerR = center;
        const innerR = PHYSICAL_SPECS.VISIBLE_PX / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center, outerR, 0, Math.PI * 2, false);
        ctx.arc(center, center, innerR, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.38)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(center, center, innerR, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (textureRef.current) {
      textureRef.current.image = textureCanvas;
      textureRef.current.needsUpdate = true;
    } else {
      const tex = new THREE.CanvasTexture(textureCanvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      textureRef.current = tex;
    }
  }, [image, crop, showFoldOverlay]);

  // Helper for responsive camera distance based on viewport aspect ratio
  const calcDistanceForViewport = (w: number, h: number) => {
    const aspect = w / Math.max(1, h);
    if (aspect >= 1.0) {
      return 7.8;
    }
    // On mobile portrait (aspect ~0.48 to 0.8), zoom camera out so pin (diameter ~4.4 units) is framed comfortably with padding
    return Math.max(7.8, Math.min(15.5, 7.8 / Math.max(0.46, aspect * 1.08)));
  };

  // Main Three.js Scene Setup with Completely Free Trackball Rotation
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera: dynamically framed perspective
    const w = container.clientWidth;
    const h = container.clientHeight;
    const aspect = w / Math.max(1, h);
    const initialDist = calcDistanceForViewport(w, h);
    targetDistRef.current = initialDist;
    currentDistRef.current = initialDist;

    const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 100);
    camera.position.set(0, 0.4, initialDist);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = 'none';
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Studio Lighting (Full 360 spherical rig so all angles shine)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Front Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // Front-Left Fill Light
    const fillLight = new THREE.DirectionalLight(0xe4e4e7, 1.2);
    fillLight.position.set(-5, 2, 4);
    scene.add(fillLight);

    // Back Light (for metal plate and safety pin)
    const backKeyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    backKeyLight.position.set(0, 4, -6);
    scene.add(backKeyLight);

    // Rim / Edge Highlighters
    const rimLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    rimLight1.position.set(0, -6, -5);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight2.position.set(0, 6, 2);
    scene.add(rimLight2);

    // 5. Build Realistic 3D Pin Badge Assembly
    const pinGroup = new THREE.Group();
    pinGroupRef.current = pinGroup;
    scene.add(pinGroup);

    updateTexture();

    const rimRadius = 3.2;
    const crownHeight = 0.28;

    // Front domed geometry
    const frontGeom = new THREE.CylinderGeometry(rimRadius, rimRadius, 0.15, 64, 1, false);
    const posAttr = frontGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      if (y > 0) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        const dist = Math.hypot(x, z);
        const normDist = Math.min(1, dist / rimRadius);
        const domeOffset = Math.cos((normDist * Math.PI) / 2) * crownHeight;
        posAttr.setY(i, y + domeOffset);
      }
    }
    frontGeom.computeVertexNormals();

    // Planar UV mapping for front face
    const uvAttr = frontGeom.attributes.uv;
    for (let i = 0; i < uvAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = posAttr.getY(i);
      if (y > 0) {
        uvAttr.setXY(i, x / (rimRadius * 2) + 0.5, z / (rimRadius * 2) + 0.5);
      }
    }

    // High gloss front Mylar material
    const frontMaterial = new THREE.MeshPhysicalMaterial({
      map: textureRef.current,
      roughness: 0.12,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.9,
    });

    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.94,
      roughness: 0.22,
    });

    const frontMesh = new THREE.Mesh(frontGeom, [
      metalMaterial, // side edge
      frontMaterial, // printed domed face
      metalMaterial, // inner back
    ]);
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;
    pinGroup.add(frontMesh);

    // Curled metal rim ring
    const rimGeom = new THREE.TorusGeometry(rimRadius - 0.05, 0.08, 16, 64);
    rimGeom.rotateX(Math.PI / 2);
    rimGeom.translate(0, -0.05, 0);
    const rimMesh = new THREE.Mesh(rimGeom, metalMaterial);
    pinGroup.add(rimMesh);

    // Recessed backplate
    const backplateGeom = new THREE.CylinderGeometry(rimRadius - 0.2, rimRadius - 0.2, 0.04, 48);
    backplateGeom.translate(0, -0.1, 0);
    const backplateMesh = new THREE.Mesh(backplateGeom, metalMaterial);
    pinGroup.add(backplateMesh);

    // Safety pin fastener on the back
    const pinMechanicGroup = new THREE.Group();
    pinMechanicGroup.position.set(0, -0.15, 0);

    const pinWireMaterial = new THREE.MeshStandardMaterial({
      color: 0xc4c4c8,
      metalness: 0.96,
      roughness: 0.16,
    });

    // Pin wire across the back
    const wireGeom = new THREE.CylinderGeometry(0.035, 0.035, 3.4, 16);
    wireGeom.rotateZ(Math.PI / 2);
    const wireMesh = new THREE.Mesh(wireGeom, pinWireMaterial);
    pinMechanicGroup.add(wireMesh);

    // Clasp hook
    const claspGeom = new THREE.BoxGeometry(0.35, 0.25, 0.15);
    claspGeom.translate(1.6, 0.08, 0);
    const claspMesh = new THREE.Mesh(claspGeom, metalMaterial);
    pinMechanicGroup.add(claspMesh);

    // Hinge coil
    const hingeGeom = new THREE.TorusGeometry(0.12, 0.04, 12, 24);
    const hingeMesh = new THREE.Mesh(hingeGeom, pinWireMaterial);
    hingeMesh.position.set(-1.6, 0.05, 0);
    pinMechanicGroup.add(hingeMesh);

    pinGroup.add(pinMechanicGroup);

    // Neutral floor shadow plane
    const shadowGeom = new THREE.PlaneGeometry(16, 16);
    const shadowMat = new THREE.ShadowMaterial({
      opacity: theme === 'paper-light' ? 0.2 : 0.4,
    });
    const shadowPlane = new THREE.Mesh(shadowGeom, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.8;
    shadowPlane.receiveShadow = true;
    shadowPlaneRef.current = shadowPlane;
    scene.add(shadowPlane);

    // Initial orientation: facing forward with subtle tilt
    const initialQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -0.2, 0));
    pinGroup.quaternion.copy(initialQuat);

    // 6. Completely Free Virtual Trackball Quaternion Event Listeners
    const domEl = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      domEl.setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      isResettingRef.current = false;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      velocityRef.current = { x: 0, y: 0 };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !pinGroupRef.current) return;
      e.preventDefault();

      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      const rotateSpeed = 0.0075;
      velocityRef.current = { x: dx * rotateSpeed, y: dy * rotateSpeed };

      // Apply camera-relative free rotation without poles or gimbal lock
      // Horizontal drag rotates around camera Up axis (0, 1, 0)
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * rotateSpeed);
      // Vertical drag rotates around camera Right axis (1, 0, 0)
      const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * rotateSpeed);
      const qDelta = new THREE.Quaternion().multiplyQuaternions(qy, qx);

      // Premultiplying applies rotation in world/camera space infinitely in all directions!
      pinGroupRef.current.quaternion.premultiply(qDelta);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (domEl.hasPointerCapture(e.pointerId)) {
        domEl.releasePointerCapture(e.pointerId);
      }
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentContainer = mountRef.current;
      const baseDist = currentContainer ? calcDistanceForViewport(currentContainer.clientWidth, currentContainer.clientHeight) : 7.8;
      const maxDist = Math.max(16.0, baseDist * 1.5);
      targetDistRef.current = Math.min(maxDist, Math.max(2.4, targetDistRef.current + e.deltaY * 0.006));
    };

    // Mobile Pinch-To-Zoom Touch Listeners
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isDraggingRef.current = false;
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchPinchDistRef.current = dist;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / touchPinchDistRef.current;
        touchPinchDistRef.current = dist;

        const currentContainer = mountRef.current;
        const baseDist = currentContainer ? calcDistanceForViewport(currentContainer.clientWidth, currentContainer.clientHeight) : 7.8;
        const maxDist = Math.max(16.0, baseDist * 1.5);

        const zoomDelta = (1 - ratio) * 6;
        targetDistRef.current = Math.min(maxDist, Math.max(2.4, targetDistRef.current + zoomDelta));
      }
    };

    const onTouchEnd = () => {
      touchPinchDistRef.current = null;
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('pointercancel', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });
    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    domEl.addEventListener('touchmove', onTouchMove, { passive: false });
    domEl.addEventListener('touchend', onTouchEnd, { passive: true });

    // 7. Continuous Animation Loop with Smooth Momentum & Reset Slerp
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (pinGroupRef.current) {
        // Auto-rotation when active and not dragging
        if (autoRotateRef.current && !isDraggingRef.current) {
          const qAuto = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.012);
          pinGroupRef.current.quaternion.premultiply(qAuto);
        }

        // Smooth momentum / inertia on release
        if (!isDraggingRef.current && !isResettingRef.current) {
          const vx = velocityRef.current.x;
          const vy = velocityRef.current.y;
          if (Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001) {
            const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), vx);
            const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), vy);
            const qDelta = new THREE.Quaternion().multiplyQuaternions(qy, qx);
            pinGroupRef.current.quaternion.premultiply(qDelta);

            // Friction damping
            velocityRef.current.x *= 0.94;
            velocityRef.current.y *= 0.94;
          }
        }

        // Smooth Reset Slerp
        if (isResettingRef.current) {
          const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -0.2, 0));
          pinGroupRef.current.quaternion.slerp(targetQuat, 0.12);
          if (pinGroupRef.current.quaternion.angleTo(targetQuat) < 0.01) {
            pinGroupRef.current.quaternion.copy(targetQuat);
            isResettingRef.current = false;
          }
        }
      }

      // Smooth camera zoom lerping
      if (cameraRef.current) {
        currentDistRef.current += (targetDistRef.current - currentDistRef.current) * 0.12;
        cameraRef.current.position.set(0, 0.4, currentDistRef.current);
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler with ResizeObserver
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('pointercancel', onPointerUp);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('touchstart', onTouchStart);
      domEl.removeEventListener('touchmove', onTouchMove);
      domEl.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, []);

  // Update texture whenever image, crop, or fold overlay changes
  useEffect(() => {
    updateTexture();
  }, [updateTexture]);

  // Update shadow opacity on theme change
  useEffect(() => {
    if (shadowPlaneRef.current) {
      const mat = shadowPlaneRef.current.material as THREE.ShadowMaterial;
      mat.opacity = theme === 'paper-light' ? 0.2 : 0.4;
      mat.needsUpdate = true;
    }
  }, [theme]);

  /**
   * Reset view smoothly to beauty center angle
   */
  const handleResetView = () => {
    isResettingRef.current = true;
    velocityRef.current = { x: 0, y: 0 };
    const container = mountRef.current;
    if (container) {
      targetDistRef.current = calcDistanceForViewport(container.clientWidth, container.clientHeight);
    } else {
      targetDistRef.current = 7.8;
    }
  };

  /**
   * Capture 3D scene mockup for download
   */
  const handleDownloadPreview = async () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    try {
      setIsCapturingPreview(true);
      renderer.render(scene, camera);
      const canvas = renderer.domElement;
      await downloadCanvas(canvas, 'pinstudio-mockup-3d-chapa-58mm.png');
    } catch (err) {
      console.error('Error downloading 3D preview:', err);
    } finally {
      setIsCapturingPreview(false);
    }
  };

  const isLight = theme === 'paper-light';

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none transition-colors duration-200 ${
        isLight ? 'bg-zinc-100 text-zinc-900' : 'bg-black text-zinc-100'
      }`}
    >
      {/* 3D WebGL Canvas Mount Container with infinite free trackball */}
      <div
        ref={mountRef}
        role="region"
        aria-label="Visualizador 3D interactivo del pin físico con rotación libre 360°"
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* Floating Top Controls HUD */}
      <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-4 sm:right-4 flex items-center justify-between pointer-events-none z-10 gap-1 sm:gap-1.5">
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={onBackToProduction}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] xs:text-[11px] sm:text-xs font-medium rounded-lg border shadow-sm backdrop-blur-md transition-colors min-h-[28px] sm:min-h-[32px] shrink-0 ${
              isLight
                ? 'bg-white/90 text-zinc-800 border-zinc-300 hover:bg-white'
                : 'bg-zinc-900/90 text-zinc-200 border-zinc-800 hover:bg-zinc-850'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xxs:inline">Volver</span>
          </button>

          <button
            type="button"
            onClick={onToggleFoldOverlay}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] xs:text-[11px] sm:text-xs font-medium rounded-lg border backdrop-blur-md transition-all shadow-sm min-h-[28px] sm:min-h-[32px] shrink-0 ${
              showFoldOverlay
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                : isLight
                ? 'bg-white/80 text-zinc-600 border-zinc-300 hover:text-zinc-900'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {showFoldOverlay ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
            <span className="hidden xs:inline">Sangría 4mm</span>
            <span className="xs:hidden">4mm</span>
          </button>
        </div>

        {/* View Controls: Auto-Rotate & Reset */}
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] xs:text-[11px] sm:text-xs font-medium rounded-lg border backdrop-blur-md transition-colors min-h-[28px] sm:min-h-[32px] shrink-0 ${
              isAutoRotating
                ? 'bg-zinc-100 text-zinc-900 border-zinc-300'
                : isLight
                ? 'bg-white/90 text-zinc-700 border-zinc-300 hover:bg-white'
                : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
            title="Activar/pausar rotación continua automática"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
            <span className="hidden sm:inline">Giro continuo</span>
            <span className="hidden xxs:inline sm:hidden">Giro</span>
          </button>

          <button
            type="button"
            onClick={handleResetView}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] xs:text-[11px] sm:text-xs font-medium rounded-lg border backdrop-blur-md transition-colors min-h-[28px] sm:min-h-[32px] shrink-0 ${
              isLight
                ? 'bg-white/90 text-zinc-700 border-zinc-300 hover:bg-white'
                : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
            title="Restablecer posición inicial de la chapa"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xxs:inline">Centrar</span>
          </button>
        </div>
      </div>

      {/* Subtle Hint Overlay */}
      <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 pointer-events-none z-10 hidden md:flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium backdrop-blur-md rounded-full border opacity-70 hover:opacity-100 transition-opacity">
        <Move className="w-3 h-3 text-zinc-400" />
        <span className="text-zinc-400">Arrastre 360° libre en cualquier dirección</span>
      </div>

      {/* Bottom Floating Info & Download Bar */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-3 pointer-events-none z-10">
        {/* Quality Indicator Box */}
        <div
          className={`pointer-events-auto flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl backdrop-blur-md border shadow-lg text-[10px] xs:text-[11px] sm:text-xs min-h-[30px] sm:min-h-[36px] ${
            isLight
              ? 'bg-white/95 border-zinc-200 text-zinc-800'
              : 'bg-zinc-900/95 border-zinc-850 text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
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
            <span className="font-semibold truncate">{quality.title}</span>
            <span className="font-mono text-zinc-400 tabular-nums text-[10px] sm:text-xs shrink-0">
              ({quality.effectiveDpi} DPI)
            </span>
          </div>

          <span className="text-zinc-600 hidden lg:inline">·</span>
          <span className="hidden lg:inline text-zinc-400 text-[11px] max-w-xs truncate">
            {quality.advice}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownloadPreview}
            disabled={isCapturingPreview}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded-lg sm:rounded-xl border shadow-sm backdrop-blur-md transition-all whitespace-nowrap min-h-[34px] sm:min-h-[38px] min-w-0 truncate disabled:opacity-50 ${
              isLight
                ? 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-800'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate hidden xxs:inline">Foto 3D</span>
            <span className="truncate xxs:hidden">Foto</span>
          </button>

          <button
            type="button"
            onClick={onExportProduction}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white bg-zinc-900 dark:bg-white dark:text-zinc-950 hover:opacity-90 rounded-lg sm:rounded-xl shadow-sm transition-all whitespace-nowrap min-h-[34px] sm:min-h-[38px] min-w-0 truncate border border-zinc-700 dark:border-white"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate hidden xs:inline">Exportar (779px)</span>
            <span className="truncate xs:hidden">Exportar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

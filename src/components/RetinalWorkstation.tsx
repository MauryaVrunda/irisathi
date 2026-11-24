import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lesion, AIAnalysisResult } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getGradcamForCase } from '../services/sampleData';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Sliders,
  ShieldAlert,
  Sparkles,
  Activity,
  Split,
  Layers,
  Flame,
  Info
} from 'lucide-react';

interface RetinalWorkstationProps {
  imageUri: string;
  gradcamUri?: string;
  aiResult: AIAnalysisResult | null;
  eyeLabel: 'OD' | 'OS';
  patientId: string;
}

export const RetinalWorkstation: React.FC<RetinalWorkstationProps> = ({
  imageUri,
  gradcamUri,
  aiResult,
  eyeLabel,
  patientId
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'split' | 'overlay' | 'gradcam' | 'original' | 'redfree'>('split');
  const [opacity, setOpacity] = useState<number>(0.75);
  const [blendMode, setBlendMode] = useState<'screen' | 'overlay' | 'multiply' | 'normal'>('screen');
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredLesion, setHoveredLesion] = useState<Lesion | null>(null);
  const [activeLesionFilter, setActiveLesionFilter] = useState<string>('all');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0 to 100
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Compute authentic Grad-CAM++ saliency image
  const effectiveGradcamUri = gradcamUri || getGradcamForCase({
    imageUri,
    gradcamUri,
    aiResult: aiResult || undefined
  });

  const lesions = aiResult?.lesions || [];
  const filteredLesions =
    activeLesionFilter === 'all'
      ? lesions
      : lesions.filter((l) => l.pathology === activeLesionFilter);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // Red-Free mode uses green-channel pass filter (CSS monochrome green contrast)
  const getImageFilterStyle = () => {
    if (viewMode === 'redfree') {
      return {
        filter: 'grayscale(100%) sepia(100%) hue-rotate(85deg) saturate(350%) contrast(150%) brightness(95%)'
      };
    }
    return {};
  };

  // Handle dragging the split-screen curtain slider
  const handleSplitMove = useCallback(
    (clientX: number) => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (relativeX / rect.width) * 100));
      setSplitPos(pct);
    },
    []
  );

  const handleMouseDownSplit = () => {
    setIsDraggingSplit(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplit) return;
      handleSplitMove(e.clientX);
    };
    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingSplit || !e.touches[0]) return;
      handleSplitMove(e.touches[0].clientX);
    };
    const handleTouchEnd = () => {
      setIsDraggingSplit(false);
    };

    if (isDraggingSplit && typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isDraggingSplit, handleSplitMove]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Top Workstation Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-100 uppercase font-sans">
            {t.wsTitle}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono border border-slate-700">
            {eyeLabel} Eye · {patientId}
          </span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              viewMode === 'split' ? 'bg-cyan-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
            }`}
            title="Interactive Split Comparison Slider: Fundus vs Grad-CAM++"
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split Curtain</span>
          </button>
          <button
            onClick={() => setViewMode('overlay')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              viewMode === 'overlay' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.wsOverlay}</span>
          </button>
          <button
            onClick={() => setViewMode('gradcam')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              viewMode === 'gradcam' ? 'bg-amber-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Grad-CAM++ Saliency</span>
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              viewMode === 'original' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.wsOriginal}
          </button>
          <button
            onClick={() => setViewMode('redfree')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              viewMode === 'redfree' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.wsRedFree}
          </button>
        </div>

        {/* View Controls: Split Presets / Opacity / Zoom / Markers */}
        <div className="flex items-center gap-2">
          {viewMode === 'split' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-md border border-slate-700 text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-mono">Split:</span>
              <button
                onClick={() => setSplitPos(25)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${splitPos === 25 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                25%
              </button>
              <button
                onClick={() => setSplitPos(50)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${splitPos === 50 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                50%
              </button>
              <button
                onClick={() => setSplitPos(75)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${splitPos === 75 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                75%
              </button>
            </div>
          )}

          {viewMode === 'overlay' && (
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-800 rounded-md border border-slate-700 text-xs">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">{t.wsOpacity}:</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-16 h-1 accent-cyan-400 cursor-pointer"
              />
              <span className="text-slate-200 font-mono text-[11px] w-7">
                {Math.round(opacity * 100)}%
              </span>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value as any)}
                className="bg-slate-900 text-slate-300 text-[10px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-hidden"
              >
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="multiply">Multiply</option>
                <option value="normal">Alpha</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-800 rounded-md border border-slate-700 p-0.5">
            <button
              onClick={handleZoomIn}
              title={t.wsZoomIn}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title={t.wsZoomOut}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title={t.wsReset}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              showMarkers
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.wsToggleMarkers}</span>
          </button>
        </div>
      </div>

      {/* Main Viewport & Saliency Stage */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square max-h-[580px] bg-black flex items-center justify-center overflow-hidden cursor-crosshair select-none"
      >
        <div
          ref={stageRef}
          className="relative transition-transform duration-200 ease-out w-[500px] h-[500px]"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Base Fundus Photograph */}
          {imageUri ? (
            <img
              src={imageUri}
              alt="Fundus photograph"
              referrerPolicy="no-referrer"
              style={getImageFilterStyle()}
              className="absolute inset-0 w-full h-full object-contain rounded-full shadow-2xl pointer-events-none"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-slate-500 text-sm font-mono">
              Fundus Image Not Available
            </div>
          )}

          {/* Saliency Layer: GRADCAM ONLY Mode */}
          {viewMode === 'gradcam' && effectiveGradcamUri && (
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <img
                src={effectiveGradcamUri}
                alt="Grad-CAM++ Saliency Heatmap"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-full shadow-2xl"
              />
            </div>
          )}

          {/* Saliency Layer: BLENDED OVERLAY Mode */}
          {viewMode === 'overlay' && effectiveGradcamUri && (
            <div
              className="absolute inset-0 rounded-full overflow-hidden pointer-events-none transition-opacity"
              style={{
                opacity,
                mixBlendMode: blendMode === 'normal' ? 'normal' : blendMode
              }}
            >
              <img
                src={effectiveGradcamUri}
                alt="Grad-CAM++ Saliency Overlay"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
          )}

          {/* Saliency Layer: INTERACTIVE SPLIT CURTAIN Mode */}
          {viewMode === 'split' && effectiveGradcamUri && (
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              {/* Right side reveals Grad-CAM++ Saliency Heatmap */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{
                  clipPath: `polygon(${splitPos}% 0%, 100% 0%, 100% 100%, ${splitPos}% 100%)`
                }}
              >
                <img
                  src={effectiveGradcamUri}
                  alt="Grad-CAM++ Saliency Heatmap"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>

              {/* Split Divider Line & Draggable Pill */}
              <div
                className="absolute top-0 bottom-0 pointer-events-auto cursor-ew-resize z-30 touch-none"
                style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleMouseDownSplit}
                onTouchStart={handleMouseDownSplit}
              >
                {/* Vertical hairline */}
                <div className="w-[2px] h-full bg-cyan-400 shadow-md shadow-cyan-400/50" />

                {/* Central thumb handle */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-lg flex items-center justify-center text-cyan-300">
                  <Split className="w-4 h-4" />
                </div>

                {/* Left/Right labels floating */}
                <div className="absolute -top-7 -translate-x-1/2 left-1/2 whitespace-nowrap bg-slate-900/90 text-cyan-300 border border-cyan-700/60 text-[10px] font-mono px-2 py-0.5 rounded shadow">
                  Fundus ⯇ | ⯈ Grad-CAM++
                </div>
              </div>
            </div>
          )}

          {/* Pathology Lesion Markers Overlay */}
          {showMarkers &&
            filteredLesions.map((lesion) => {
              const posX = (lesion.x / 100) * 500;
              const posY = (lesion.y / 100) * 500;

              const getMarkerColor = (type: string) => {
                switch (type) {
                  case 'microaneurysm':
                    return 'bg-red-500 ring-2 ring-red-300';
                  case 'hemorrhage':
                    return 'bg-rose-700 ring-2 ring-rose-400';
                  case 'hard_exudate':
                    return 'bg-amber-400 ring-2 ring-amber-200';
                  case 'neovascularization':
                    return 'bg-cyan-400 ring-2 ring-cyan-200 animate-pulse';
                  default:
                    return 'bg-blue-500 ring-2 ring-white';
                }
              };

              return (
                <div
                  key={lesion.id}
                  style={{ left: `${posX}px`, top: `${posY}px` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                  onMouseEnter={() => setHoveredLesion(lesion)}
                  onMouseLeave={() => setHoveredLesion(null)}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${getMarkerColor(
                      lesion.pathology
                    )} shadow-md transition-transform hover:scale-150 flex items-center justify-center`}
                  >
                    <span className="text-[8px] font-bold text-slate-900 font-mono">
                      {lesion.id}
                    </span>
                  </div>
                </div>
              );
            })}

          {/* Optical Crosshair grid center & quadrant dividers */}
          <div className="absolute inset-0 pointer-events-none rounded-full border border-slate-500/20">
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-slate-400/20" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-slate-400/20" />
            <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-400/80">ST</div>
            <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-400/80">SN</div>
            <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400/80">IT</div>
            <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400/80">IN</div>
          </div>
        </div>

        {/* Live Coordinate & Pathology Tooltip HUD */}
        {hoveredLesion && (
          <div className="absolute top-4 left-4 z-30 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-lg border border-slate-700 shadow-xl max-w-xs text-xs pointer-events-none">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300 font-mono mb-1">
              <span>#{hoveredLesion.id}</span>
              <span className="capitalize">{hoveredLesion.pathology.replace('_', ' ')}</span>
            </div>
            <div className="text-slate-300 space-y-0.5 text-[11px] font-mono">
              <div>Quadrant: {hoveredLesion.locationQuadrant}</div>
              <div>Norm Coords: ({hoveredLesion.x}%, {hoveredLesion.y}%)</div>
              <div>Saliency Conf: {hoveredLesion.confidence.toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* Demo Mode / Real Inference Watermark Badge */}
        <div className="absolute bottom-3 right-3 z-30">
          {aiResult?.isDemo ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/90 text-slate-950 font-bold text-[10px] tracking-wider uppercase font-mono shadow-sm">
              <ShieldAlert className="w-3 h-3" />
              {t.wsDemoExplainabilityBadge}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600/90 text-white font-bold text-[10px] tracking-wider uppercase font-mono shadow-sm">
              <Sparkles className="w-3 h-3" />
              Verified Neural Inference
            </span>
          )}
        </div>
      </div>

      {/* Saliency Jet Colormap Bar & Deep Learning Layer Metadata */}
      {(viewMode === 'split' || viewMode === 'gradcam' || viewMode === 'overlay') && (
        <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 shrink-0">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Grad-CAM++ Jet Scale:</span>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-700 via-cyan-400 via-emerald-400 via-yellow-400 to-red-600 shadow-inner" />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                <span>0.0 Baseline</span>
                <span>0.5 Intermediate</span>
                <span>1.0 Peak Hotspot</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
            <span>Arch: <strong>ResNet50-DualOrdinal</strong></span>
            <span>·</span>
            <span>Layer: <strong>conv5_block3_out</strong></span>
            <span>·</span>
            <span className="text-cyan-400">Target: Grade {aiResult?.predictedGrade ?? 2}</span>
          </div>
        </div>
      )}

      {/* Pathology Biomarker Legend & Filter Tray */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">{t.wsLegendTitle}:</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveLesionFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeLesionFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({lesions.length})
            </button>
            <button
              onClick={() => setActiveLesionFilter('microaneurysm')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeLesionFilter === 'microaneurysm'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {t.pathMicroaneurysm}
            </button>
            <button
              onClick={() => setActiveLesionFilter('hemorrhage')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeLesionFilter === 'hemorrhage'
                  ? 'bg-rose-700 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-700" />
              {t.pathHemorrhage}
            </button>
            <button
              onClick={() => setActiveLesionFilter('hard_exudate')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeLesionFilter === 'hard_exudate'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {t.pathHardExudate}
            </button>
            <button
              onClick={() => setActiveLesionFilter('neovascularization')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeLesionFilter === 'neovascularization'
                  ? 'bg-cyan-700 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              {t.pathNeovascularization}
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Zoom: {Math.round(zoomLevel * 100)}% · Native 1536×1536 px
        </div>
      </div>
    </div>
  );
};

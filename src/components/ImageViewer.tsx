import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Eye, 
  Sliders, 
  Maximize2, 
  Minimize2, 
  Crosshair, 
  Sparkles, 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Ruler, 
  Square, 
  Compass, 
  Sun, 
  Radio, 
  Download, 
  Grid, 
  Zap, 
  Activity, 
  Flame, 
  Droplets, 
  Trees, 
  Split, 
  Search, 
  Timer, 
  Move, 
  X,
  TrendingUp,
  Scan,
  Video,
  Image as ImageIcon,
  Copy,
  Check,
  Target,
  Navigation,
  Pin,
  Send,
  Columns,
  Play,
  Pause,
  ArrowLeftRight
} from 'lucide-react';
import { BoundingBoxEvidence, ChangeEvidence, RemoteSensingImage } from '../types';
import { 
  pixelToGeo, 
  calculateGroundDistance, 
  calculateGroundArea, 
  calculateScaleBar, 
  probePixelSpectra, 
  sampleCrossSection, 
  PixelProbeData 
} from '../utils/gisCalculations';
import { 
  computePixelDifference, 
  DifferenceResult, 
  DifferenceOverlayStyle 
} from '../utils/pixelDifferencing';
import { SatelliteFootagePlayer } from './SatelliteFootagePlayer';
import { CompareEpochsToolbar, CompareLayoutMode } from './CompareEpochsToolbar';

export type BandFilterMode = 'rgb' | 'cir' | 'ndvi' | 'ndwi' | 'swir' | 'sar' | 'thermal' | 'edge';
export type ToolMode = 'navigate' | 'crosshair' | 'ruler' | 'area' | 'transect';

interface ImageViewerProps {
  images: RemoteSensingImage[];
  boundingBoxes?: BoundingBoxEvidence[];
  changeAnalysis?: ChangeEvidence;
  activeBandMode?: string;
  setActiveBandMode?: (mode: any) => void;
  highlightedBoxId?: number | null;
  onHoverBox?: (index: number | null) => void;
  onCaptureFrame?: (capturedImage: RemoteSensingImage) => void;
  onPinCoordinates?: (coordsText: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  boundingBoxes = [],
  changeAnalysis,
  activeBandMode: propBandMode,
  setActiveBandMode: propSetBandMode,
  highlightedBoxId,
  onHoverBox,
  onCaptureFrame,
  onPinCoordinates
}) => {
  // Mode: Static High-Res Imagery vs Live Satellite Video Footage
  const [viewMode, setViewMode] = useState<'imagery' | 'footage'>('imagery');
  // Primary / Secondary Image Layers with Epoch Swapping
  const [epochOrderReversed, setEpochOrderReversed] = useState<boolean>(false);
  const primaryImage = images[0];
  const secondaryImage = images[1] || images[0];
  const effectivePrimary = epochOrderReversed ? (images[1] || images[0]) : images[0];
  const effectiveSecondary = epochOrderReversed ? images[0] : (images[1] || images[0]);
  const hasDualLayers = images.length >= 2;
  const isSar = effectivePrimary?.modality === 'sar' || effectivePrimary?.role === 'sar';
  const gsdMeters = effectivePrimary?.metadata?.gsdMeters || 10;
  const bbox = effectivePrimary?.metadata?.bbox;

  // Viewport Transform State (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Spectral / Band Filter
  const [bandMode, setBandMode] = useState<BandFilterMode>((propBandMode as BandFilterMode) || 'rgb');
  useEffect(() => {
    if (propBandMode && propBandMode !== bandMode) {
      setBandMode(propBandMode as BandFilterMode);
    }
  }, [propBandMode]);

  const handleBandSelect = (mode: BandFilterMode) => {
    setBandMode(mode);
    if (propSetBandMode) propSetBandMode(mode);
  };

  // Image Enhancement Settings
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [showEnhanceMenu, setShowEnhanceMenu] = useState<boolean>(false);

  // Multi-Modality Comparison State & Epoch Slider
  const [isCompareActive, setIsCompareActive] = useState<boolean>(hasDualLayers);
  const [compareLayout, setCompareLayout] = useState<CompareLayoutMode>('curtain');
  const [splitPos, setSplitPos] = useState<number>(50); // % for split curtain
  const [isAutoSweeping, setIsAutoSweeping] = useState<boolean>(false);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [dissolveAlpha, setDissolveAlpha] = useState<number>(50); // %
  const [spotlightRadius, setSpotlightRadius] = useState<number>(120); // px
  const [blinkState, setBlinkState] = useState<boolean>(false);

  // Pixel-Level Differencing Engine State
  const [showPixelChangeOverlay, setShowPixelChangeOverlay] = useState<boolean>(hasDualLayers);
  const [changeOverlayStyle, setChangeOverlayStyle] = useState<DifferenceOverlayStyle>('semantic');
  const [changeThreshold, setChangeThreshold] = useState<number>(24);
  const [changeOpacity, setChangeOpacity] = useState<number>(0.85);
  const [diffResult, setDiffResult] = useState<DifferenceResult | null>(null);
  const [isComputingDiff, setIsComputingDiff] = useState<boolean>(false);

  // Overlays & Layers
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showMask, setShowMask] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [showScanlines, setShowScanlines] = useState<boolean>(true);

  // GIS Tools (Navigate, Crosshair Coordinate Inspector, Distance Ruler, Area Polygon, Transect Cross-Section)
  const [activeTool, setActiveTool] = useState<ToolMode>('crosshair');
  const [pinnedTarget, setPinnedTarget] = useState<{
    normX: number;
    normY: number;
    px: { x: number; y: number };
    geoPixel: { x: number; y: number };
    probe: PixelProbeData;
  } | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const [rulerPoints, setRulerPoints] = useState<{ p1: { x: number; y: number } | null; p2: { x: number; y: number } | null }>({ p1: null, p2: null });
  const [areaPoints, setAreaPoints] = useState<{ p1: { x: number; y: number } | null; p2: { x: number; y: number } | null }>({ p1: null, p2: null });
  const [transectPoints, setTransectPoints] = useState<{ p1: { x: number; y: number } | null; p2: { x: number; y: number } | null }>({ p1: null, p2: null });
  const [transectData, setTransectData] = useState<Array<{ index: number; distPercent: number; elevationM: number; ndvi: number; intensity: number; sarDb: number }> | null>(null);

  // Probe / Telemetry Cursor State
  const [probe, setProbe] = useState<PixelProbeData | null>(null);
  const [mouseContainerPos, setMouseContainerPos] = useState<{ x: number; y: number } | null>(null);

  // DOM Refs
  const viewportRef = useRef<HTMLDivElement>(null);

  // Auto-sync dual layers
  useEffect(() => {
    setIsCompareActive(hasDualLayers);
    setShowPixelChangeOverlay(hasDualLayers);
  }, [hasDualLayers]);

  // Auto-sweep split curtain timer
  useEffect(() => {
    if (!isAutoSweeping || compareLayout !== 'curtain' || !isCompareActive) return;
    let dir = 1;
    const interval = setInterval(() => {
      setSplitPos(prev => {
        if (prev >= 92) dir = -1;
        if (prev <= 8) dir = 1;
        return Number((prev + dir * 1.5).toFixed(1));
      });
    }, 45);
    return () => clearInterval(interval);
  }, [isAutoSweeping, compareLayout, isCompareActive]);

  // Blink Comparator timer
  useEffect(() => {
    if (compareLayout !== 'blink' || !isCompareActive) return;
    const interval = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 650);
    return () => clearInterval(interval);
  }, [compareLayout, isCompareActive]);

  // Compute Pixel Difference between effectivePrimary and effectiveSecondary
  useEffect(() => {
    if (!hasDualLayers || !effectivePrimary?.dataUrl || !effectiveSecondary?.dataUrl) {
      setDiffResult(null);
      return;
    }

    let isMounted = true;
    setIsComputingDiff(true);

    computePixelDifference(effectivePrimary.dataUrl, effectiveSecondary.dataUrl, {
      threshold: changeThreshold,
      style: changeOverlayStyle,
      opacity: changeOpacity,
      resolution: 512
    })
      .then(res => {
        if (isMounted) {
          setDiffResult(res);
          setIsComputingDiff(false);
        }
      })
      .catch(err => {
        console.warn('Pixel differencing warning:', err);
        if (isMounted) setIsComputingDiff(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    hasDualLayers,
    effectivePrimary?.dataUrl,
    effectiveSecondary?.dataUrl,
    changeThreshold,
    changeOverlayStyle,
    changeOpacity,
    epochOrderReversed
  ]);

  // Dynamic Scale Bar Calculation
  const scaleBar = calculateScaleBar(zoom, gsdMeters, 512);

  // Copy coordinate to clipboard helper
  const handleCopyCoord = (text: string, type: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  // Reset Viewport to Default 100% Fit
  const handleResetViewport = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Zoom In / Out Handlers
  const handleZoomChange = (delta: number) => {
    setZoom(prev => Math.max(1.0, Math.min(10.0, Number((prev + delta).toFixed(2)))));
  };

  // Mouse Wheel Zoom centered at cursor
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.18 : 0.85;
    setZoom(prev => Math.max(1.0, Math.min(10.0, Number((prev * zoomFactor).toFixed(2)))));
  };

  // Mouse Down: Start Pan or GIS Measurement Placement
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Calculate unzoomed normalized pixel (0-512)
    const normX = Math.max(0, Math.min(1, (clientX - pan.x) / (rect.width * zoom)));
    const normY = Math.max(0, Math.min(1, (clientY - pan.y) / (rect.height * zoom)));
    const px = { x: normX * 512, y: normY * 512 };

    if (activeTool === 'crosshair') {
      const dimW = primaryImage?.metadata?.dimensions?.width || 1600;
      const dimH = primaryImage?.metadata?.dimensions?.height || 1067;
      const probeResult = probePixelSpectra(normX, normY, isSar, bbox);
      setPinnedTarget({
        normX,
        normY,
        px,
        geoPixel: { x: Math.round(normX * dimW), y: Math.round(normY * dimH) },
        probe: probeResult
      });
      return;
    }

    if (activeTool === 'ruler') {
      if (!rulerPoints.p1 || (rulerPoints.p1 && rulerPoints.p2)) {
        setRulerPoints({ p1: px, p2: null });
      } else {
        setRulerPoints(prev => ({ ...prev, p2: px }));
      }
      return;
    }

    if (activeTool === 'area') {
      if (!areaPoints.p1 || (areaPoints.p1 && areaPoints.p2)) {
        setAreaPoints({ p1: px, p2: null });
      } else {
        setAreaPoints(prev => ({ ...prev, p2: px }));
      }
      return;
    }

    if (activeTool === 'transect') {
      if (!transectPoints.p1 || (transectPoints.p1 && transectPoints.p2)) {
        setTransectPoints({ p1: px, p2: null });
        setTransectData(null);
      } else {
        setTransectPoints(prev => ({ ...prev, p2: px }));
        const profile = sampleCrossSection(transectPoints.p1, px, 24);
        setTransectData(profile);
      }
      return;
    }

    // Default Pan Mode
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleSplitDividerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  // Mouse Move: Update Pan, Split Divider Drag, or Radiometric Probe Data
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (isDraggingSplit) {
      const newPct = Math.max(0, Math.min(100, Math.round((clientX / rect.width) * 100)));
      setSplitPos(newPct);
      return;
    }

    setMouseContainerPos({ x: clientX, y: clientY });

    if (isPanning && activeTool === 'navigate') {
      const newPanX = e.clientX - dragStart.x;
      const newPanY = e.clientY - dragStart.y;
      // Clamp pan bounds according to zoom
      const maxPanX = (rect.width * (zoom - 1)) / 2 + 150;
      const maxPanY = (rect.height * (zoom - 1)) / 2 + 150;
      setPan({
        x: Math.max(-maxPanX, Math.min(maxPanX, newPanX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newPanY))
      });
    }

    // Calculate Normalized Pixel for Radiometric Probe
    const normX = Math.max(0, Math.min(1, (clientX - pan.x) / (rect.width * zoom)));
    const normY = Math.max(0, Math.min(1, (clientY - pan.y) / (rect.height * zoom)));

    const probeResult = probePixelSpectra(normX, normY, isSar, bbox);
    setProbe(probeResult);

    // Live update dynamic endpoints when placing tools
    const curPx = { x: normX * 512, y: normY * 512 };
    if (activeTool === 'ruler' && rulerPoints.p1 && !rulerPoints.p2) {
      setRulerPoints(prev => ({ ...prev, p2: curPx }));
    }
    if (activeTool === 'area' && areaPoints.p1 && !areaPoints.p2) {
      setAreaPoints(prev => ({ ...prev, p2: curPx }));
    }
    if (activeTool === 'transect' && transectPoints.p1 && !transectPoints.p2) {
      setTransectPoints(prev => ({ ...prev, p2: curPx }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
    setProbe(null);
    setMouseContainerPos(null);
  };

  // Distance / Area measurement calculations
  const distanceMeasure = (rulerPoints.p1 && rulerPoints.p2)
    ? calculateGroundDistance(rulerPoints.p1, rulerPoints.p2, 512, 512, gsdMeters, bbox)
    : null;

  const areaMeasure = (areaPoints.p1 && areaPoints.p2)
    ? calculateGroundArea(areaPoints.p1, areaPoints.p2, 512, 512, gsdMeters)
    : null;

  // Export Viewport Snapshot
  const handleExportSnapshot = () => {
    if (!primaryImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = primaryImage.dataUrl;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1024, 1024);

      // Burn in military telemetry HUD banner
      ctx.fillStyle = 'rgba(12, 13, 14, 0.85)';
      ctx.fillRect(0, 940, 1024, 84);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`SATQUERY AI TELEMETRY // ${primaryImage.name}`, 24, 972);

      ctx.fillStyle = '#8e9299';
      ctx.font = '16px monospace';
      ctx.fillText(`CRS: ${primaryImage.metadata.crs || 'EPSG:32631'} | GSD: ${gsdMeters}m | BAND: ${bandMode.toUpperCase()} | TIME: ${primaryImage.metadata.acquisitionDate || '2024-05-18'}`, 24, 1004);

      const a = document.createElement('a');
      a.download = `SATQUERY_${primaryImage.name.replace(/\.[^/.]+$/, "")}_SNAP.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
  };

  // CSS Filter string based on active band and adjustments
  const getFilterStyle = (): string => {
    let filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (bandMode === 'cir') filter += ' hue-rotate(290deg) saturate(2.4) contrast(1.35)';
    else if (bandMode === 'ndvi') filter += ' hue-rotate(85deg) saturate(3.2) contrast(1.5)';
    else if (bandMode === 'ndwi') filter += ' hue-rotate(180deg) saturate(2.8) contrast(1.6)';
    else if (bandMode === 'swir') filter += ' hue-rotate(40deg) saturate(2.5) contrast(1.4)';
    else if (bandMode === 'sar') filter += ' grayscale(100%) contrast(1.8)';
    else if (bandMode === 'thermal') filter += ' invert(100%) hue-rotate(180deg) saturate(3) contrast(1.7)';
    else if (bandMode === 'edge') filter += ' contrast(2.5) grayscale(100%) invert(100%)';
    return filter;
  };

  if (viewMode === 'footage') {
    return (
      <div className="space-y-3">
        {/* Mode Switcher Banner */}
        <div className="bg-[#151619] border border-[#2a2c31] p-1.5 rounded flex items-center justify-between">
          <div className="flex items-center space-x-1 mono text-xs">
            <button
              onClick={() => setViewMode('imagery')}
              className="px-3 py-1.5 rounded text-[#8e9299] hover:text-[#e1e1e1] hover:bg-[#0c0d0e] transition-all flex items-center space-x-1.5"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>SATELLITE TILES (GEOTIFF)</span>
            </button>
            <button
              onClick={() => setViewMode('footage')}
              className="px-3 py-1.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40 font-bold transition-all flex items-center space-x-1.5"
            >
              <Video className="h-3.5 w-3.5" />
              <span>LIVE ORBITAL FOOTAGE STREAM</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8] animate-ping" />
            </button>
          </div>
          <span className="text-[10px] mono text-[#8e9299] pr-2 hidden sm:inline">
            NASA ISS / Himawari / Sentinel Video Feeds
          </span>
        </div>

        {/* Live Satellite Footage Player */}
        <SatelliteFootagePlayer
          onCaptureFrame={(img) => {
            if (onCaptureFrame) onCaptureFrame(img);
            setViewMode('imagery');
          }}
          activeBandMode={bandMode}
          setActiveBandMode={handleBandSelect}
        />
      </div>
    );
  }

  return (
    <div className={`bg-[#151619] border border-[#2a2c31] p-3.5 sm:p-4.5 flex flex-col space-y-3 shadow-2xl rounded ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      
      {/* 1. TOP MASTER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2a2c31] pb-3">
        {/* Left: Viewport Name & View Mode Switcher */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#0c0d0e] rounded border border-[#2a2c31] p-0.5 mono text-[10px]">
            <button
              onClick={() => setViewMode('imagery')}
              className="px-2.5 py-1 rounded bg-[#4ade80]/20 text-[#4ade80] font-bold flex items-center space-x-1"
              title="Static Satellite GeoTIFF / Optical & SAR Tiles"
            >
              <ImageIcon className="h-3 w-3" />
              <span>TILES</span>
            </button>
            <button
              onClick={() => setViewMode('footage')}
              className="px-2.5 py-1 rounded text-[#8e9299] hover:text-[#38bdf8] hover:bg-[#151619] flex items-center space-x-1 font-semibold"
              title="Switch to Live Satellite Footage & Orbital Pass Video Feeds"
            >
              <Video className="h-3 w-3" />
              <span>FOOTAGE</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8]" />
            </button>
          </div>
          {hasDualLayers && (
            <span className="text-[9px] mono px-2 py-0.5 rounded bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30 uppercase font-bold flex items-center space-x-1">
              <Split className="h-2.5 w-2.5" />
              <span>CO-REGISTERED PAIR</span>
            </span>
          )}
        </div>

        {/* Right: Quick Tools (Zoom HUD, Measurement Tools, Fullscreen) */}
        <div className="flex items-center space-x-1.5 mono">
          
          {/* Zoom Level Indicator & Controls */}
          <div className="flex items-center bg-[#0c0d0e] rounded border border-[#2a2c31] p-0.5 text-xs">
            <button
              onClick={() => handleZoomChange(-0.5)}
              className="p-1 text-[#8e9299] hover:text-[#e1e1e1] hover:bg-[#151619] rounded"
              title="Zoom Out (Wheel Down)"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-bold text-[10px] text-[#4ade80] min-w-[48px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoomChange(0.5)}
              className="p-1 text-[#8e9299] hover:text-[#e1e1e1] hover:bg-[#151619] rounded"
              title="Zoom In (Wheel Up)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            {zoom !== 1.0 && (
              <button
                onClick={handleResetViewport}
                className="px-1.5 py-0.5 text-[9px] text-[#8e9299] hover:text-[#4ade80] border-l border-[#2a2c31] font-bold"
                title="Reset Viewport to 1:1"
              >
                1:1
              </button>
            )}
          </div>

          {/* GIS Tactical Tools Selector */}
          <div className="flex items-center bg-[#0c0d0e] rounded border border-[#2a2c31] p-0.5 text-[10px]">
            <button
              onClick={() => setActiveTool('navigate')}
              className={`p-1 rounded transition-colors ${activeTool === 'navigate' ? 'bg-[#4ade80]/20 text-[#4ade80]' : 'text-[#8e9299] hover:text-[#e1e1e1]'}`}
              title="Pan / Navigate Mode"
            >
              <Move className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setActiveTool('crosshair')}
              className={`p-1 rounded transition-colors ${activeTool === 'crosshair' ? 'bg-[#4ade80]/25 text-[#4ade80]' : 'text-[#8e9299] hover:text-[#e1e1e1]'}`}
              title="Crosshair Tool: Real-time GeoTIFF Lat/Lon Coordinates"
            >
              <Crosshair className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setActiveTool('ruler');
                setRulerPoints({ p1: null, p2: null });
              }}
              className={`p-1 rounded transition-colors ${activeTool === 'ruler' ? 'bg-[#3b82f6]/25 text-[#3b82f6]' : 'text-[#8e9299] hover:text-[#e1e1e1]'}`}
              title="Distance Ruler (Click 2 points)"
            >
              <Ruler className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setActiveTool('area');
                setAreaPoints({ p1: null, p2: null });
              }}
              className={`p-1 rounded transition-colors ${activeTool === 'area' ? 'bg-[#f59e0b]/25 text-[#f59e0b]' : 'text-[#8e9299] hover:text-[#e1e1e1]'}`}
              title="Area Surface Calculator (Click/drag box)"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setActiveTool('transect');
                setTransectPoints({ p1: null, p2: null });
                setTransectData(null);
              }}
              className={`p-1 rounded transition-colors ${activeTool === 'transect' ? 'bg-[#ec4899]/25 text-[#ec4899]' : 'text-[#8e9299] hover:text-[#e1e1e1]'}`}
              title="Spectral Transect / Cross-Section Profile Line"
            >
              <Activity className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Toggle Grid */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded border transition-colors ${showGrid ? 'bg-[#4ade80]/20 text-[#4ade80] border-[#4ade80]/40' : 'bg-[#0c0d0e] text-[#8e9299] border-[#2a2c31] hover:text-[#e1e1e1]'}`}
            title="Toggle MGRS / UTM Coordinate Grid"
          >
            <Grid className="h-3.5 w-3.5" />
          </button>

          {/* Image Radiometry Tuning Menu Toggle */}
          <button
            onClick={() => setShowEnhanceMenu(!showEnhanceMenu)}
            className={`p-1.5 rounded border transition-colors ${showEnhanceMenu ? 'bg-[#4ade80]/20 text-[#4ade80] border-[#4ade80]/40' : 'bg-[#0c0d0e] text-[#8e9299] border-[#2a2c31] hover:text-[#e1e1e1]'}`}
            title="Radiometric Enhancement (Brightness / Contrast)"
          >
            <Sun className="h-3.5 w-3.5" />
          </button>

          {/* Export Viewport Snapshot */}
          <button
            onClick={handleExportSnapshot}
            className="p-1.5 rounded bg-[#0c0d0e] text-[#8e9299] hover:text-[#4ade80] border border-[#2a2c31] hover:border-[#4ade80]/40 transition-colors"
            title="Export High-Res Viewport Snapshot PNG"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded bg-[#0c0d0e] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31] transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. SPECTRAL BANDS & MULTI-MODALITY CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0c0d0e] p-2 rounded border border-[#2a2c31] text-[10px] mono">
        
        {/* Spectral Band Selector */}
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
          <span className="text-[#8e9299] font-bold uppercase mr-1 text-[9px] flex items-center space-x-1">
            <Radio className="h-3 w-3 text-[#4ade80]" />
            <span>Spectral:</span>
          </span>

          <button
            onClick={() => handleBandSelect('rgb')}
            className={`px-2.5 py-1 rounded font-bold uppercase transition-all ${
              bandMode === 'rgb' ? 'bg-[#4ade80] text-black font-bold shadow' : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
          >
            True Color (RGB)
          </button>

          <button
            onClick={() => handleBandSelect('cir')}
            className={`px-2 py-1 rounded font-bold uppercase transition-all flex items-center space-x-1 ${
              bandMode === 'cir' ? 'bg-[#ec4899] text-white font-bold shadow' : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
            title="Color-Infrared (NIR false color highlighting vegetation)"
          >
            <Trees className="h-3 w-3" />
            <span>CIR (NIR)</span>
          </button>

          <button
            onClick={() => handleBandSelect('ndvi')}
            className={`px-2 py-1 rounded font-bold uppercase transition-all flex items-center space-x-1 ${
              bandMode === 'ndvi' ? 'bg-[#22c55e] text-black font-bold shadow' : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
            title="Normalized Difference Vegetation Index"
          >
            <Zap className="h-3 w-3" />
            <span>NDVI Index</span>
          </button>

          <button
            onClick={() => handleBandSelect('ndwi')}
            className={`px-2 py-1 rounded font-bold uppercase transition-all flex items-center space-x-1 ${
              bandMode === 'ndwi' ? 'bg-[#0ea5e9] text-black font-bold shadow' : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
            title="Normalized Difference Water Index / Flood Inundation"
          >
            <Droplets className="h-3 w-3" />
            <span>NDWI Water</span>
          </button>

          <button
            onClick={() => handleBandSelect('swir')}
            className={`px-2 py-1 rounded font-bold uppercase transition-all ${
              bandMode === 'swir' ? 'bg-[#f97316] text-black font-bold shadow' : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
            title="Short-Wave Infrared for Soil & Crop Discrimination"
          >
            SWIR Agri
          </button>

          <button
            onClick={() => handleBandSelect('sar')}
            className={`px-2 py-1 rounded font-bold uppercase transition-all ${
              bandMode === 'sar' ? 'bg-[#a855f7] text-white font-bold shadow' : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
            title="Synthetic Aperture Radar Backscatter Profile"
          >
            SAR dB
          </button>

          <button
            onClick={() => handleBandSelect('thermal')}
            className={`px-2 py-1 rounded font-bold uppercase transition-all flex items-center space-x-1 ${
              bandMode === 'thermal' ? 'bg-[#ef4444] text-white font-bold shadow' : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
            title="Thermal Infrared & Hotspot Anomaly"
          >
            <Flame className="h-3 w-3" />
            <span>Thermal IR</span>
          </button>

          <button
            onClick={() => handleBandSelect('edge')}
            className={`px-2 py-1 rounded font-bold uppercase transition-all ${
              bandMode === 'edge' ? 'bg-[#eab308] text-black font-bold shadow' : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
            title="Sobel Structural Edge Detection"
          >
            Edge / Sobel
          </button>
        </div>

        {/* Multi-Layer Comparison Toggle (when Pair exists) */}
        {hasDualLayers && (
          <div className="flex items-center space-x-1 border-l border-[#2a2c31] pl-2">
            <button
              onClick={() => setIsCompareActive(!isCompareActive)}
              className={`px-2 py-0.5 rounded font-bold uppercase flex items-center space-x-1 transition-all ${
                isCompareActive ? 'bg-[#3b82f6] text-white shadow' : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
              }`}
            >
              <Split className="h-3 w-3" />
              <span>{isCompareActive ? 'Comparing Epochs' : 'Compare Epochs'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2.1 COMPARE EPOCHS TOOLBAR & PIXEL DIFFERENCING CONTROLS */}
      {hasDualLayers && (
        <CompareEpochsToolbar
          isCompareActive={isCompareActive}
          setIsCompareActive={setIsCompareActive}
          compareLayout={compareLayout}
          setCompareLayout={setCompareLayout}
          splitPos={splitPos}
          setSplitPos={setSplitPos}
          isAutoSweeping={isAutoSweeping}
          setIsAutoSweeping={setIsAutoSweeping}
          epochOrderReversed={epochOrderReversed}
          setEpochOrderReversed={setEpochOrderReversed}
          primaryImage={effectivePrimary}
          secondaryImage={effectiveSecondary}
          showPixelChangeOverlay={showPixelChangeOverlay}
          setShowPixelChangeOverlay={setShowPixelChangeOverlay}
          changeOverlayStyle={changeOverlayStyle}
          setChangeOverlayStyle={setChangeOverlayStyle}
          changeThreshold={changeThreshold}
          setChangeThreshold={setChangeThreshold}
          changeOpacity={changeOpacity}
          setChangeOpacity={setChangeOpacity}
          diffResult={diffResult}
          isComputingDiff={isComputingDiff}
          onPinCoordinates={onPinCoordinates}
        />
      )}

      {/* 2.2 EXPANDABLE RADIOMETRIC ENHANCEMENT PANEL */}
      {showEnhanceMenu && (
        <div className="bg-[#0c0d0e] p-3 rounded border border-[#2a2c31] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mono">
          <div>
            <div className="flex justify-between text-[10px] text-[#8e9299] mb-1">
              <span>Brightness</span>
              <span className="text-[#4ade80]">{brightness}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full h-1 bg-[#2a2c31] rounded accent-[#4ade80] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-[#8e9299] mb-1">
              <span>Contrast</span>
              <span className="text-[#4ade80]">{contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="220"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full h-1 bg-[#2a2c31] rounded accent-[#4ade80] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 sm:pt-0">
            <button
              onClick={() => {
                setBrightness(100);
                setContrast(100);
              }}
              className="px-2.5 py-1 bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] rounded border border-[#2a2c31] text-[10px] uppercase font-bold"
            >
              Reset Curves
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN SATELLITE VIEWPORT STAGE */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className={`relative w-full aspect-square ${isFullscreen ? 'h-full max-h-[85vh]' : 'max-h-[540px]'} rounded overflow-hidden bg-[#070809] border border-[#2a2c31] select-none ${
          activeTool === 'navigate' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
        } group flex items-center justify-center`}
      >
        {/* Subtle Satellite Scanline */}
        {showScanlines && (
          <div className="absolute inset-0 scan-line pointer-events-none opacity-20 z-10"></div>
        )}

        {/* MGRS / UTM Coordinate Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 grid-overlay pointer-events-none opacity-40 z-15"></div>
        )}

        {/* TRANSFORMATION CONTAINER (Pan & Zoom) */}
        <div
          className="relative w-full h-full transform-gpu transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          {/* COMPARISON LAYOUT: SIDE BY SIDE */}
          {hasDualLayers && isCompareActive && compareLayout === 'side_by_side' ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-1 pointer-events-none h-full w-full">
              {/* Left Pane: Effective Primary Image (Epoch 1) */}
              <div className="relative w-full h-full overflow-hidden border-r border-[#2a2c31]">
                <img
                  src={effectivePrimary.dataUrl}
                  alt={effectivePrimary.name}
                  style={{ filter: getFilterStyle() }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-[#0c0d0e]/90 px-2 py-0.5 rounded border border-[#4ade80]/50 text-[9px] mono text-[#4ade80] font-bold">
                  ◀ EPOCH 1: {effectivePrimary.name?.substring(0, 20) || 'Pre-Event'}
                </div>
              </div>

              {/* Right Pane: Effective Secondary Image (Epoch 2) */}
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={effectiveSecondary.dataUrl}
                  alt={effectiveSecondary.name}
                  style={{ filter: getFilterStyle() }}
                  className="w-full h-full object-cover"
                />
                {/* Pixel Change Overlay on Right Pane */}
                {showPixelChangeOverlay && diffResult?.overlayDataUrl && (
                  <img
                    src={diffResult.overlayDataUrl}
                    alt="Pixel Difference Overlay"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none z-22"
                    style={{ opacity: changeOpacity }}
                  />
                )}
                <div className="absolute top-2 left-2 bg-[#0c0d0e]/90 px-2 py-0.5 rounded border border-[#3b82f6]/50 text-[9px] mono text-[#3b82f6] font-bold">
                  EPOCH 2: {effectiveSecondary.name?.substring(0, 20) || 'Post-Event'} ▶
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Base Layer: Primary Satellite Image */}
              {effectivePrimary && (
                <img
                  src={effectivePrimary.dataUrl}
                  alt={effectivePrimary.name}
                  style={{ filter: getFilterStyle() }}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}

              {/* DUAL LAYER COMPARISON MODES (Curtain, Dissolve, Blink, Spotlight) */}
              {hasDualLayers && isCompareActive && (
                <>
                  {/* MODE A: SPLIT CURTAIN */}
                  {compareLayout === 'curtain' && (
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)` }}
                    >
                      <img
                        src={effectiveSecondary.dataUrl}
                        alt={effectiveSecondary.name}
                        style={{ filter: getFilterStyle() }}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* MODE B: DISSOLVE OPACITY */}
                  {compareLayout === 'dissolve' && (
                    <img
                      src={effectiveSecondary.dataUrl}
                      alt={effectiveSecondary.name}
                      style={{
                        filter: getFilterStyle(),
                        opacity: dissolveAlpha / 100
                      }}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-100"
                    />
                  )}

                  {/* MODE C: BLINK COMPARATOR */}
                  {compareLayout === 'blink' && blinkState && (
                    <img
                      src={effectiveSecondary.dataUrl}
                      alt={effectiveSecondary.name}
                      style={{ filter: getFilterStyle() }}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                  )}

                  {/* MODE D: SPOTLIGHT / SPYGLASS LOUPE */}
                  {compareLayout === 'spotlight' && mouseContainerPos && (
                    <div
                      className="absolute pointer-events-none rounded-full overflow-hidden border-2 border-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                      style={{
                        width: `${spotlightRadius * 2}px`,
                        height: `${spotlightRadius * 2}px`,
                        left: `${(mouseContainerPos.x - pan.x) / zoom - spotlightRadius}px`,
                        top: `${(mouseContainerPos.y - pan.y) / zoom - spotlightRadius}px`,
                        zIndex: 25
                      }}
                    >
                      <img
                        src={effectiveSecondary.dataUrl}
                        alt={effectiveSecondary.name}
                        style={{
                          position: 'absolute',
                          maxWidth: 'none',
                          left: `-${(mouseContainerPos.x - pan.x) / zoom - spotlightRadius}px`,
                          top: `-${(mouseContainerPos.y - pan.y) / zoom - spotlightRadius}px`,
                          width: '512px',
                          height: '512px',
                          filter: getFilterStyle()
                        }}
                      />
                      {/* Spyglass Reticle */}
                      <div className="absolute inset-0 border border-white/40 rounded-full pointer-events-none flex items-center justify-center">
                        <Crosshair className="h-4 w-4 text-[#3b82f6] opacity-75" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* PIXEL-LEVEL DIFFERENCE OVERLAY */}
              {showPixelChangeOverlay && diffResult?.overlayDataUrl && (
                <img
                  src={diffResult.overlayDataUrl}
                  alt="Bi-Temporal Pixel Change Overlay"
                  className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none z-22"
                  style={{ opacity: changeOpacity }}
                />
              )}
            </>
          )}

          {/* Change Heatmap Mask Overlay (Bi-temporal differencing from Gemini Evidence) */}
          {showMask && changeAnalysis?.heatmapMaskUrl && (
            <img
              src={changeAnalysis.heatmapMaskUrl}
              alt="Change Difference Heatmap"
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80 pointer-events-none z-20"
            />
          )}

          {/* SVG OVERLAY: Bounding Boxes Grounding */}
          {showBoxes && boundingBoxes.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-25" viewBox="0 0 1000 1000" preserveAspectRatio="none">
              {boundingBoxes.map((box, idx) => {
                const [ymin, xmin, ymax, xmax] = box.box2d;
                const isHovered = highlightedBoxId === idx;
                const color = idx % 3 === 0 ? '#4ade80' : (idx % 3 === 1 ? '#3b82f6' : '#f59e0b');

                return (
                  <g
                    key={idx}
                    className="pointer-events-auto cursor-pointer transition-all"
                    onMouseEnter={() => onHoverBox && onHoverBox(idx)}
                    onMouseLeave={() => onHoverBox && onHoverBox(null)}
                  >
                    <rect
                      x={xmin}
                      y={ymin}
                      width={xmax - xmin}
                      height={ymax - ymin}
                      fill={isHovered ? `${color}35` : `${color}15`}
                      stroke={color}
                      strokeWidth={isHovered ? 4 : 2.5}
                      strokeDasharray={isHovered ? 'none' : '4 2'}
                    />
                    <rect
                      x={xmin}
                      y={Math.max(0, ymin - 32)}
                      width={Math.max(140, box.label.length * 10 + 60)}
                      height={28}
                      fill="#0c0d0e"
                      stroke={color}
                      strokeWidth={1.5}
                    />
                    <text
                      x={xmin + 6}
                      y={Math.max(18, ymin - 12)}
                      fill="#e1e1e1"
                      fontSize={15}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      [{box.label.toUpperCase()}] {Math.round(box.confidence * 100)}%
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* SVG OVERLAY: GIS Tactical Measurements (Ruler / Area / Transect) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 512 512">
            
            {/* PINNED TARGET BEACON */}
            {pinnedTarget && (
              <g className="animate-in fade-in duration-200">
                {/* Outer ring */}
                <circle cx={pinnedTarget.px.x} cy={pinnedTarget.px.y} r="18" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3 2" />
                {/* Inner target circle */}
                <circle cx={pinnedTarget.px.x} cy={pinnedTarget.px.y} r="7" fill="#4ade8025" stroke="#4ade80" strokeWidth="1.8" />
                {/* Center point */}
                <circle cx={pinnedTarget.px.x} cy={pinnedTarget.px.y} r="2" fill="#4ade80" />
                {/* Target reticle cross ticks */}
                <line x1={pinnedTarget.px.x - 22} y1={pinnedTarget.px.y} x2={pinnedTarget.px.x - 10} y2={pinnedTarget.px.y} stroke="#4ade80" strokeWidth="1.5" />
                <line x1={pinnedTarget.px.x + 10} y1={pinnedTarget.px.y} x2={pinnedTarget.px.x + 22} y2={pinnedTarget.px.y} stroke="#4ade80" strokeWidth="1.5" />
                <line x1={pinnedTarget.px.x} y1={pinnedTarget.px.y - 22} x2={pinnedTarget.px.x} y2={pinnedTarget.px.y - 10} stroke="#4ade80" strokeWidth="1.5" />
                <line x1={pinnedTarget.px.x} y1={pinnedTarget.px.y + 10} x2={pinnedTarget.px.x} y2={pinnedTarget.px.y + 22} stroke="#4ade80" strokeWidth="1.5" />
                {/* Target Pin Label */}
                <g transform={`translate(${pinnedTarget.px.x + 12}, ${pinnedTarget.px.y - 14})`}>
                  <rect x="0" y="-12" width="135" height="18" rx="2" fill="#0c0d0e" stroke="#4ade80" strokeWidth="1" />
                  <text x="6" y="1" fill="#4ade80" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    📍 {pinnedTarget.probe.geo.lat.toFixed(5)}°, {pinnedTarget.probe.geo.lon.toFixed(5)}°
                  </text>
                </g>
              </g>
            )}

            {/* RULER LINE */}
            {rulerPoints.p1 && rulerPoints.p2 && (
              <g>
                <line
                  x1={rulerPoints.p1.x}
                  y1={rulerPoints.p1.y}
                  x2={rulerPoints.p2.x}
                  y2={rulerPoints.p2.y}
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                <circle cx={rulerPoints.p1.x} cy={rulerPoints.p1.y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={rulerPoints.p2.x} cy={rulerPoints.p2.y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />

                {distanceMeasure && (
                  <g transform={`translate(${(rulerPoints.p1.x + rulerPoints.p2.x) / 2}, ${(rulerPoints.p1.y + rulerPoints.p2.y) / 2 - 12})`}>
                    <rect x="-60" y="-12" width="120" height="22" rx="3" fill="#0c0d0e" stroke="#3b82f6" strokeWidth="1" />
                    <text x="0" y="3" fill="#4ade80" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      {distanceMeasure.formattedDistance} ({distanceMeasure.bearingDegrees}°)
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* AREA BOX */}
            {areaPoints.p1 && areaPoints.p2 && (
              <g>
                <rect
                  x={Math.min(areaPoints.p1.x, areaPoints.p2.x)}
                  y={Math.min(areaPoints.p1.y, areaPoints.p2.y)}
                  width={Math.abs(areaPoints.p2.x - areaPoints.p1.x)}
                  height={Math.abs(areaPoints.p2.y - areaPoints.p1.y)}
                  fill="#f59e0b20"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                {areaMeasure && (
                  <g transform={`translate(${Math.min(areaPoints.p1.x, areaPoints.p2.x) + 8}, ${Math.min(areaPoints.p1.y, areaPoints.p2.y) + 20})`}>
                    <rect x="0" y="-12" width="140" height="20" rx="3" fill="#0c0d0e" stroke="#f59e0b" strokeWidth="1" />
                    <text x="70" y="2" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      {areaMeasure.formatted}
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* TRANSECT LINE */}
            {transectPoints.p1 && transectPoints.p2 && (
              <g>
                <line
                  x1={transectPoints.p1.x}
                  y1={transectPoints.p1.y}
                  x2={transectPoints.p2.x}
                  y2={transectPoints.p2.y}
                  stroke="#ec4899"
                  strokeWidth="2.5"
                />
                <circle cx={transectPoints.p1.x} cy={transectPoints.p1.y} r="4" fill="#ec4899" />
                <circle cx={transectPoints.p2.x} cy={transectPoints.p2.y} r="4" fill="#ec4899" />
              </g>
            )}
          </svg>
        </div>

        {/* SPLIT SLIDER DIVIDER LINE (When in Curtain Mode) */}
        {hasDualLayers && isCompareActive && compareLayout === 'curtain' && (
          <div
            className="absolute top-0 bottom-0 z-30 w-[2px] bg-[#4ade80] pointer-events-none shadow-[0_0_15px_rgba(74,222,128,0.9)]"
            style={{ left: `${splitPos}%` }}
          >
            {/* Draggable Knob */}
            <div
              onMouseDown={handleSplitDividerMouseDown}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-[#0c0d0e] border-2 border-[#4ade80] text-[#4ade80] hover:scale-110 flex items-center justify-center shadow-2xl pointer-events-auto cursor-ew-resize transition-transform"
              title="Drag to Compare Epochs"
            >
              <Sliders className="h-3.5 w-3.5" />
            </div>

            {/* Epoch Tags */}
            <div className="absolute top-3 -translate-x-full pr-2 pointer-events-none">
              <span className="bg-[#0c0d0e]/90 text-[8px] mono text-[#4ade80] px-1.5 py-0.5 rounded border border-[#4ade80]/40 font-bold whitespace-nowrap shadow">
                ◀ {effectivePrimary.name?.substring(0, 16) || 'Epoch 1'}
              </span>
            </div>
            <div className="absolute top-3 pl-2 pointer-events-none">
              <span className="bg-[#0c0d0e]/90 text-[8px] mono text-[#3b82f6] px-1.5 py-0.5 rounded border border-[#3b82f6]/40 font-bold whitespace-nowrap shadow">
                {effectiveSecondary.name?.substring(0, 16) || 'Epoch 2'} ▶
              </span>
            </div>
          </div>
        )}

        {/* CROSSHAIR FULL-VIEWPORT LASER RETICLE & FLOATING HUD (Active Tool: Crosshair) */}
        {activeTool === 'crosshair' && mouseContainerPos && (
          <>
            {/* Horizontal Laser Line */}
            <div
              className="absolute left-0 right-0 h-[1px] bg-[#4ade80]/70 pointer-events-none z-30 shadow-[0_0_6px_rgba(74,222,128,0.8)]"
              style={{ top: `${mouseContainerPos.y}px` }}
            />
            {/* Vertical Laser Line */}
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-[#4ade80]/70 pointer-events-none z-30 shadow-[0_0_6px_rgba(74,222,128,0.8)]"
              style={{ left: `${mouseContainerPos.x}px` }}
            />

            {/* Tactical Reticle Ring at Cursor */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-35 flex items-center justify-center"
              style={{ left: `${mouseContainerPos.x}px`, top: `${mouseContainerPos.y}px` }}
            >
              <div className="relative h-11 w-11 flex items-center justify-center">
                {/* Outer Reticle Ring */}
                <div className="absolute inset-0 rounded-full border border-[#4ade80]/80 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                {/* Inner Reticle Ring */}
                <div className="h-4 w-4 rounded-full border border-[#4ade80]" />
                {/* Center Aim Dot */}
                <div className="h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_4px_#4ade80]" />
                {/* Cardinal Tick Marks */}
                <div className="absolute top-0 h-1.5 w-[1.5px] bg-[#4ade80]" />
                <div className="absolute bottom-0 h-1.5 w-[1.5px] bg-[#4ade80]" />
                <div className="absolute left-0 w-1.5 h-[1.5px] bg-[#4ade80]" />
                <div className="absolute right-0 w-1.5 h-[1.5px] bg-[#4ade80]" />
              </div>
            </div>

            {/* Dynamic Real-Time Floating Coordinate Badge */}
            {probe && (
              <div
                className="absolute pointer-events-none z-40 bg-[#0c0d0e]/95 backdrop-blur-sm border border-[#4ade80]/70 rounded p-2 text-[9px] mono text-[#e1e1e1] shadow-2xl space-y-1 min-w-[210px]"
                style={{
                  left: mouseContainerPos.x > 280 ? `${mouseContainerPos.x - 225}px` : `${mouseContainerPos.x + 18}px`,
                  top: mouseContainerPos.y > 320 ? `${mouseContainerPos.y - 120}px` : `${mouseContainerPos.y + 18}px`
                }}
              >
                <div className="flex items-center justify-between border-b border-[#2a2c31] pb-1 text-[#4ade80] font-bold">
                  <span className="flex items-center space-x-1">
                    <Crosshair className="h-3 w-3" />
                    <span>REAL-TIME GEO COORDS</span>
                  </span>
                  <span className="text-[8px] text-[#8e9299]">GeoTIFF</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[8.5px]">
                  <span className="text-[#8e9299]">LATITUDE:</span>
                  <span className="text-[#4ade80] font-bold text-right">{probe.geo.lat}° N</span>
                  <span className="text-[#8e9299]">LONGITUDE:</span>
                  <span className="text-[#4ade80] font-bold text-right">{probe.geo.lon}° E</span>
                  <span className="text-[#8e9299]">DMS:</span>
                  <span className="text-[#3b82f6] text-right truncate" title={`${probe.geo.latStr} ${probe.geo.lonStr}`}>
                    {probe.geo.latStr}
                  </span>
                  <span className="text-[#8e9299]">MGRS:</span>
                  <span className="text-[#e1e1e1] font-bold text-right">{probe.geo.mgrs}</span>
                  <span className="text-[#8e9299]">TIFF PIXEL:</span>
                  <span className="text-[#e1e1e1] text-right">
                    [{Math.round(probe.pixelX * (primaryImage?.metadata?.dimensions?.width || 1600) / 512)}, {Math.round(probe.pixelY * (primaryImage?.metadata?.dimensions?.height || 1067) / 512)}]
                  </span>
                </div>
                <div className="pt-0.5 border-t border-[#2a2c31] flex items-center justify-between text-[8px] text-[#f59e0b]">
                  <span>NDVI: {probe.ndvi.toFixed(2)}</span>
                  <span className="text-[#8e9299]">Click to Pin Target</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* BOTTOM HUD OVERLAYS */}
        
        {/* Dynamic Scale Bar (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-30 bg-black/80 px-2.5 py-1.5 rounded border border-[#2a2c31] text-[9px] mono text-[#e1e1e1] shadow flex flex-col space-y-1">
          <div className="flex items-center justify-between text-[#8e9299]">
            <span>SCALE</span>
            <span className="text-[#4ade80] font-bold">{scaleBar.label}</span>
          </div>
          <div className="h-1.5 bg-[#4ade80] border border-white/40" style={{ width: `${scaleBar.barWidthPx}px` }}></div>
        </div>

        {/* Compass & Orbit Track Heading (Top Right) */}
        <div className="absolute top-3 right-3 z-30 bg-black/80 p-2 rounded border border-[#2a2c31] shadow flex flex-col items-center space-y-1 text-[8px] mono text-[#8e9299]">
          <div className="relative h-9 w-9 rounded-full border border-[#2a2c31] bg-[#0c0d0e] flex items-center justify-center">
            {/* North Arrow */}
            <div className="absolute top-1 text-[#4ade80] font-bold text-[8px]">N</div>
            <div className="h-4 w-0.5 bg-[#4ade80] -translate-y-1 rounded"></div>
            {/* Sun Azimuth Beam */}
            <div className="absolute h-4 w-0.5 bg-[#f59e0b] origin-bottom rotate-45 rounded" title="Solar Azimuth 142°"></div>
          </div>
          <span className="text-[#e1e1e1] font-bold">142° AZ</span>
        </div>

        {/* Mini-Map / Radar PiP (Bottom Right) */}
        {showMinimap && zoom > 1.1 && primaryImage && (
          <div className="absolute bottom-3 right-3 z-30 w-24 h-24 bg-black/90 rounded border border-[#4ade80]/50 overflow-hidden shadow-2xl p-1 pointer-events-none">
            <div className="relative w-full h-full">
              <img src={primaryImage.dataUrl} alt="Mini-map" className="w-full h-full object-cover opacity-60" />
              {/* Visible Viewport Box */}
              <div
                className="absolute border-2 border-[#4ade80] bg-[#4ade80]/20"
                style={{
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                  left: `${Math.max(0, Math.min(100 - 100 / zoom, 50 - (pan.x / (512 * zoom)) * 100 - (50 / zoom)))}%`,
                  top: `${Math.max(0, Math.min(100 - 100 / zoom, 50 - (pan.y / (512 * zoom)) * 100 - (50 / zoom)))}%`
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Interactive Split Slider Control (Bottom Bar when in Curtain Mode) */}
        {hasDualLayers && isCompareActive && compareLayout === 'curtain' && (
          <input
            type="range"
            min="0"
            max="100"
            value={splitPos}
            onChange={(e) => setSplitPos(Number(e.target.value))}
            className="absolute inset-x-20 bottom-3 z-30 opacity-75 hover:opacity-100 cursor-ew-resize accent-[#4ade80] h-1.5 bg-black/80 rounded"
          />
        )}

        {/* Interactive Dissolve Slider (Bottom Bar when in Dissolve Mode) */}
        {hasDualLayers && isCompareActive && compareLayout === 'dissolve' && (
          <div className="absolute inset-x-20 bottom-3 z-30 bg-black/90 px-4 py-1.5 rounded border border-[#2a2c31] flex items-center space-x-3 text-[9px] mono">
            <span className="text-[#8e9299]">Epoch 1</span>
            <input
              type="range"
              min="0"
              max="100"
              value={dissolveAlpha}
              onChange={(e) => setDissolveAlpha(Number(e.target.value))}
              className="flex-1 h-1.5 bg-[#2a2c31] rounded accent-[#3b82f6] cursor-pointer"
            />
            <span className="text-[#3b82f6] font-bold">Epoch 2 ({dissolveAlpha}%)</span>
          </div>
        )}

        {/* Active Tool Status Banner */}
        {activeTool !== 'navigate' && (
          <div className="absolute top-3 left-3 z-30 bg-black/90 px-3 py-1 rounded border border-[#2a2c31] text-[10px] mono flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-[#4ade80] animate-pulse"></span>
            <span className="font-bold text-[#e1e1e1] uppercase">
              {activeTool === 'crosshair' && 'CROSSHAIR INSPECTOR: Real-Time GeoTIFF Coordinates (Click to Pin)'}
              {activeTool === 'ruler' && 'DISTANCE RULER: Click 2 Points'}
              {activeTool === 'area' && 'AREA MEASURE: Click & Drag Box'}
              {activeTool === 'transect' && 'TRANSECT: Click Start & End'}
            </span>
            <button
              onClick={() => {
                setActiveTool('navigate');
                setRulerPoints({ p1: null, p2: null });
                setAreaPoints({ p1: null, p2: null });
                setTransectPoints({ p1: null, p2: null });
                setTransectData(null);
              }}
              className="ml-2 text-[#8e9299] hover:text-[#e1e1e1]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

      </div>

      {/* LOCKED / PINNED TARGET INSPECTOR CARD */}
      {pinnedTarget && (
        <div className="bg-[#0c0d0e] p-3 rounded border border-[#4ade80]/50 shadow-lg text-xs mono animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-[#2a2c31] pb-2 mb-2">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-[#4ade80] animate-ping"></span>
              <span className="text-[#4ade80] font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <Target className="h-4 w-4" />
                <span>Locked Target Geodetic Coordinates (GeoTIFF)</span>
              </span>
            </div>
            <button
              onClick={() => setPinnedTarget(null)}
              className="text-[#8e9299] hover:text-[#e1e1e1] p-1 hover:bg-[#151619] rounded"
              title="Dismiss Pinned Target"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="bg-[#151619] p-2 rounded border border-[#2a2c31]">
              <span className="text-[#8e9299] block text-[9px] uppercase">WGS 84 Lat / Lon (DD)</span>
              <span className="text-[#4ade80] font-bold text-xs block mt-0.5">
                {pinnedTarget.probe.geo.lat.toFixed(6)}°, {pinnedTarget.probe.geo.lon.toFixed(6)}°
              </span>
              <span className="text-[9px] text-[#8e9299]">Decimal Degrees</span>
            </div>

            <div className="bg-[#151619] p-2 rounded border border-[#2a2c31]">
              <span className="text-[#8e9299] block text-[9px] uppercase">DMS Format</span>
              <span className="text-[#3b82f6] font-bold text-xs block mt-0.5 truncate" title={`${pinnedTarget.probe.geo.latStr} ${pinnedTarget.probe.geo.lonStr}`}>
                {pinnedTarget.probe.geo.latStr}, {pinnedTarget.probe.geo.lonStr}
              </span>
              <span className="text-[9px] text-[#8e9299]">Deg Min Sec</span>
            </div>

            <div className="bg-[#151619] p-2 rounded border border-[#2a2c31]">
              <span className="text-[#8e9299] block text-[9px] uppercase">Military Grid (MGRS)</span>
              <span className="text-[#e1e1e1] font-bold text-xs block mt-0.5">
                {pinnedTarget.probe.geo.mgrs}
              </span>
              <span className="text-[9px] text-[#8e9299]">{pinnedTarget.probe.geo.utm}</span>
            </div>

            <div className="bg-[#151619] p-2 rounded border border-[#2a2c31]">
              <span className="text-[#8e9299] block text-[9px] uppercase">Raster Dimensions & Class</span>
              <span className="text-[#f59e0b] font-bold text-xs block mt-0.5">
                Col {pinnedTarget.geoPixel.x}, Row {pinnedTarget.geoPixel.y}
              </span>
              <span className="text-[9px] text-[#8e9299] truncate block" title={pinnedTarget.probe.surfaceType}>
                {pinnedTarget.probe.surfaceType}
              </span>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-[#2a2c31] text-[10px]">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleCopyCoord(`${pinnedTarget.probe.geo.lat.toFixed(6)}, ${pinnedTarget.probe.geo.lon.toFixed(6)}`, 'dd')}
                className="px-2 py-1 bg-[#151619] hover:bg-[#202227] text-[#e1e1e1] rounded border border-[#2a2c31] flex items-center space-x-1 transition-colors"
              >
                {copiedType === 'dd' ? <Check className="h-3 w-3 text-[#4ade80]" /> : <Copy className="h-3 w-3 text-[#8e9299]" />}
                <span>{copiedType === 'dd' ? 'Copied DD!' : 'Copy Lat/Lon'}</span>
              </button>

              <button
                onClick={() => handleCopyCoord(`${pinnedTarget.probe.geo.latStr} ${pinnedTarget.probe.geo.lonStr}`, 'dms')}
                className="px-2 py-1 bg-[#151619] hover:bg-[#202227] text-[#e1e1e1] rounded border border-[#2a2c31] flex items-center space-x-1 transition-colors"
              >
                {copiedType === 'dms' ? <Check className="h-3 w-3 text-[#4ade80]" /> : <Copy className="h-3 w-3 text-[#8e9299]" />}
                <span>{copiedType === 'dms' ? 'Copied DMS!' : 'Copy DMS'}</span>
              </button>

              <button
                onClick={() => handleCopyCoord(pinnedTarget.probe.geo.mgrs, 'mgrs')}
                className="px-2 py-1 bg-[#151619] hover:bg-[#202227] text-[#e1e1e1] rounded border border-[#2a2c31] flex items-center space-x-1 transition-colors"
              >
                {copiedType === 'mgrs' ? <Check className="h-3 w-3 text-[#4ade80]" /> : <Copy className="h-3 w-3 text-[#8e9299]" />}
                <span>{copiedType === 'mgrs' ? 'Copied MGRS!' : 'Copy MGRS'}</span>
              </button>
            </div>

            {onPinCoordinates && (
              <button
                onClick={() => {
                  const queryStr = `Inspect target location at Lat: ${pinnedTarget.probe.geo.lat.toFixed(6)}°N, Lon: ${pinnedTarget.probe.geo.lon.toFixed(6)}°E (MGRS ${pinnedTarget.probe.geo.mgrs}, GeoTIFF pixel [${pinnedTarget.geoPixel.x}, ${pinnedTarget.geoPixel.y}]). Describe the surface characteristics and features visible.`;
                  onPinCoordinates(queryStr);
                }}
                className="px-2.5 py-1 bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] rounded border border-[#4ade80]/40 flex items-center space-x-1.5 font-bold transition-colors shadow-sm"
              >
                <Send className="h-3 w-3" />
                <span>Send Coordinates to AI Query</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. REAL-TIME RADIOMETRIC & GEODETIC TELEMETRY HUD */}
      <div className="bg-[#0c0d0e] rounded p-2.5 border border-[#2a2c31] text-[10px] mono grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#8e9299]">
        
        {/* Cursor Coordinates */}
        <div className="flex items-center space-x-1.5">
          <Crosshair className="h-3.5 w-3.5 text-[#4ade80]" />
          <div>
            <span className="text-[#e1e1e1] font-bold block">
              {probe ? `PX: [${probe.pixelX}, ${probe.pixelY}]` : 'POS: [STANDBY]'}
            </span>
            <span className="text-[9px] text-[#8e9299]">
              {probe ? probe.geo.mgrs : 'MGRS 31U ET'}
            </span>
          </div>
        </div>

        {/* WGS 84 Geodesic Coordinates */}
        <div className="flex items-center space-x-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#3b82f6]" />
          <div>
            <span className="text-[#3b82f6] font-bold block">
              {probe ? `${probe.geo.lat}°N, ${probe.geo.lon}°E` : 'LAT/LON WGS 84'}
            </span>
            <span className="text-[9px] text-[#8e9299]">
              {probe ? `${probe.geo.latStr}, ${probe.geo.lonStr}` : 'DMS FORMAT'}
            </span>
          </div>
        </div>

        {/* Spectral Index & Reflectance */}
        <div className="flex items-center space-x-1.5">
          <Zap className="h-3.5 w-3.5 text-[#f59e0b]" />
          <div>
            <span className="text-[#f59e0b] font-bold block">
              {probe ? `NDVI: ${probe.ndvi.toFixed(2)} | REFL: ${Math.round(probe.reflectance * 100)}%` : 'SPECTRAL PROBE'}
            </span>
            <span className="text-[9px] text-[#8e9299] truncate block max-w-[140px]" title={probe?.surfaceType}>
              {probe ? probe.surfaceType : 'Vegetation / Soil'}
            </span>
          </div>
        </div>

        {/* SAR dB & GSD Resolution */}
        <div className="flex items-center space-x-1.5">
          <Radio className="h-3.5 w-3.5 text-[#ec4899]" />
          <div>
            <span className="text-[#ec4899] font-bold block">
              {probe ? `SAR: ${probe.sarSigma0Db.toFixed(1)} dB` : `GSD: ${gsdMeters}.0 m/px`}
            </span>
            <span className="text-[9px] text-[#8e9299]">
              CRS: {primaryImage?.metadata?.crs?.split(' ')[0] || 'EPSG:32631'}
            </span>
          </div>
        </div>

      </div>

      {/* 5. 1D TRANSECT PROFILE GRAPH (When Transect Tool is active) */}
      {transectData && transectData.length > 0 && (
        <div className="bg-[#0c0d0e] p-3 rounded border border-[#ec4899]/40 space-y-2 text-xs mono animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] border-b border-[#2a2c31] pb-1">
            <span className="text-[#ec4899] font-bold uppercase flex items-center space-x-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Transect Cross-Section: Elevation & NDVI Profile</span>
            </span>
            <span className="text-[9px] text-[#8e9299]">{transectData.length} SAMPLE NODES</span>
          </div>

          {/* Mini Bar Plot */}
          <div className="h-20 flex items-end space-x-1 pt-2 pb-1 border-b border-[#2a2c31]">
            {transectData.map((d) => (
              <div key={d.index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                <div
                  className="w-full bg-[#4ade80] rounded-t transition-all hover:bg-[#3b82f6]"
                  style={{ height: `${Math.max(10, (d.elevationM / 50) * 100)}%` }}
                ></div>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-black px-1.5 py-0.5 rounded text-[8px] text-white border border-[#2a2c31] whitespace-nowrap z-30">
                  Elev: {d.elevationM}m | NDVI: {d.ndvi.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[9px] text-[#8e9299]">
            <span>Start Node (A)</span>
            <span>Elevation: 12m - 47m | Peak NDVI: 0.72</span>
            <span>End Node (B)</span>
          </div>
        </div>
      )}

    </div>
  );
};

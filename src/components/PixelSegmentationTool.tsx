import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers,
  Crop,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  Download,
  Target,
  Trees,
  Droplets,
  Building,
  Wheat,
  Sun,
  Snowflake,
  BarChart3,
  Globe,
  Radio,
  Check,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Info,
  ShieldCheck,
  ZoomIn,
  Move,
  ArrowRight
} from 'lucide-react';
import { RemoteSensingImage } from '../types';
import {
  LAND_COVER_CLASSES,
  LandCoverClassDef,
  SATELLITE_MISSIONS,
  SatelliteMission
} from '../data/satelliteMissions';
import {
  IdentifiedObjectRecord,
  LandCoverClassMetrics,
  LandCoverSegmentationResult,
  performPixelSegmentation,
  PRESET_ROIS,
  RegionOfInterest
} from '../utils/landCoverClassifier';

interface PixelSegmentationToolProps {
  image: RemoteSensingImage;
  onApplyObjectsToStudio?: (objects: IdentifiedObjectRecord[]) => void;
  onClose?: () => void;
}

export const PixelSegmentationTool: React.FC<PixelSegmentationToolProps> = ({
  image,
  onApplyObjectsToStudio,
  onClose
}) => {
  // Mission Configuration
  const [selectedMissionId, setSelectedMissionId] = useState<string>(() => {
    const sat = image.metadata?.satellite?.toLowerCase() || '';
    if (sat.includes('cartosat')) return 'isro_cartosat3';
    if (sat.includes('resourcesat') || sat.includes('liss')) return 'isro_resourcesat2_liss4';
    if (sat.includes('risat') || sat.includes('sar')) return 'isro_risat1a_sar';
    if (sat.includes('landsat')) return 'nasa_landsat9_oli2';
    if (sat.includes('modis') || sat.includes('terra')) return 'nasa_terra_modis';
    if (sat.includes('nisar')) return 'nasa_isro_nisar';
    return 'isro_cartosat3';
  });

  // Region of Interest (ROI)
  const [selectedRoi, setSelectedRoi] = useState<RegionOfInterest>(PRESET_ROIS[0]);
  const [customRoiBox, setCustomRoiBox] = useState<[number, number, number, number] | null>(null);
  const [isDrawingRoi, setIsDrawingRoi] = useState<boolean>(false);
  const [roiDrawStart, setRoiDrawStart] = useState<{ x: number; y: number } | null>(null);

  // Class Visibility Filters
  const [classFilters, setClassFilters] = useState<Record<string, boolean>>({
    urban: true,
    forest: true,
    water: true,
    agriculture: true,
    barren: true,
    snow_cloud: true
  });

  // Display and Rendering Settings
  const [viewMode, setViewMode] = useState<'overlay' | 'split' | 'mask_only' | 'raw'>('overlay');
  const [maskOpacity, setMaskOpacity] = useState<number>(0.68);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [splitCurtainPos, setSplitCurtainPos] = useState<number>(50); // % for split view

  // Object Inspection & Highlighting
  const [highlightedObjectId, setHighlightedObjectId] = useState<string | null>(null);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classes' | 'objects' | 'sensor_specs' | 'export'>('classes');

  // Segmentation State
  const [isSegmenting, setIsSegmenting] = useState<boolean>(false);
  const [segmentationResult, setSegmentationResult] = useState<LandCoverSegmentationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Canvas Refs for interactive viewport
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active mission profile
  const currentMission = SATELLITE_MISSIONS[selectedMissionId] || SATELLITE_MISSIONS['isro_cartosat3'];

  // Run Segmentation Calculation
  const runSegmentation = useCallback(async () => {
    if (!image.dataUrl) return;

    setIsSegmenting(true);
    setError(null);

    try {
      const effectiveRoi: RegionOfInterest = customRoiBox
        ? { id: 'custom_roi', name: 'Custom User Region Box', box: customRoiBox }
        : selectedRoi;

      const result = await performPixelSegmentation(
        image.dataUrl,
        selectedMissionId,
        effectiveRoi,
        classFilters,
        maskOpacity,
        showContours
      );

      setSegmentationResult(result);
    } catch (err: any) {
      setError(err?.message || 'Segmentation processing error');
    } finally {
      setIsSegmenting(false);
    }
  }, [image.dataUrl, selectedMissionId, selectedRoi, customRoiBox, classFilters, maskOpacity, showContours]);

  // Trigger segmentation when inputs change
  useEffect(() => {
    runSegmentation();
  }, [runSegmentation]);

  // Handle ROI Canvas Drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setIsDrawingRoi(true);
    setRoiDrawStart({ x, y });
    setCustomRoiBox([y, x, y + 0.01, x + 0.01]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingRoi || !roiDrawStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const curY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const ymin = Math.min(roiDrawStart.y, curY);
    const xmin = Math.min(roiDrawStart.x, curX);
    const ymax = Math.max(roiDrawStart.y, curY);
    const xmax = Math.max(roiDrawStart.x, curX);

    setCustomRoiBox([ymin, xmin, ymax, xmax]);
  };

  const handleCanvasMouseUp = () => {
    if (isDrawingRoi) {
      setIsDrawingRoi(false);
      setRoiDrawStart(null);
      if (customRoiBox) {
        // If box is big enough, keep custom ROI
        const [ymin, xmin, ymax, xmax] = customRoiBox;
        if (ymax - ymin > 0.05 && xmax - xmin > 0.05) {
          // Custom ROI is valid
        } else {
          setCustomRoiBox(null);
        }
      }
    }
  };

  const toggleClassFilter = (classId: string) => {
    setClassFilters(prev => ({
      ...prev,
      [classId]: !prev[classId]
    }));
  };

  const handleExportMask = () => {
    if (!segmentationResult?.maskDataUrl) return;
    const a = document.createElement('a');
    a.href = segmentationResult.maskDataUrl;
    a.download = `LULC_Mask_${image.name.replace(/\.[^/.]+$/, '')}_${selectedMissionId}.png`;
    a.click();
  };

  const handleExportCsv = () => {
    if (!segmentationResult) return;
    const metricsList = Object.values(segmentationResult.metricsByClass) as LandCoverClassMetrics[];
    const rows = [
      ['Class ID', 'Class Name', 'Pixel Count', 'Percentage (%)', 'Area (m2)', 'Area (ha)', 'Area (km2)', 'Sensor GSD (m)', 'Confidence'],
      ...metricsList.map(m => [
        m.classDef.id,
        `"${m.classDef.name}"`,
        m.pixelCount,
        m.percentage,
        m.areaM2,
        m.areaHectares,
        m.areaKm2,
        segmentationResult.mission.gsdMeters,
        m.confidence
      ]),
      [],
      ['Total Classified Pixels', segmentationResult.totalPixelsAnalyzed],
      ['Total Scene Ground Area (ha)', segmentationResult.totalGroundAreaHectares],
      ['Total Scene Ground Area (km2)', segmentationResult.totalGroundAreaKm2],
      ['Satellite Mission', segmentationResult.mission.name],
      ['Agency', segmentationResult.mission.agency],
      ['Sensor', segmentationResult.mission.sensor]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `LULC_Area_Analysis_${image.name.replace(/\.[^/.]+$/, '')}.csv`;
    a.click();
  };

  const handleApplyToStudio = () => {
    if (segmentationResult?.identifiedObjects && onApplyObjectsToStudio) {
      onApplyObjectsToStudio(segmentationResult.identifiedObjects);
    }
  };

  const getClassIcon = (classId: string) => {
    switch (classId) {
      case 'urban': return <Building className="h-3.5 w-3.5 text-[#f43f5e]" />;
      case 'forest': return <Trees className="h-3.5 w-3.5 text-[#22c55e]" />;
      case 'water': return <Droplets className="h-3.5 w-3.5 text-[#3b82f6]" />;
      case 'agriculture': return <Wheat className="h-3.5 w-3.5 text-[#eab308]" />;
      case 'barren': return <Sun className="h-3.5 w-3.5 text-[#d97706]" />;
      case 'snow_cloud': return <Snowflake className="h-3.5 w-3.5 text-[#06b6d4]" />;
      default: return <Layers className="h-3.5 w-3.5 text-[#e1e1e1]" />;
    }
  };

  return (
    <div className="bg-[#111215] border border-[#2a2c31] rounded-lg shadow-2xl flex flex-col overflow-hidden text-[#e1e1e1] font-mono text-xs">
      {/* Top Header & Mission Selector */}
      <div className="p-3.5 bg-[#151619] border-b border-[#2a2c31] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="h-7 w-7 rounded bg-[#4ade80]/10 border border-[#4ade80]/40 flex items-center justify-center text-[#4ade80]">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#e1e1e1]">
                Pixel-Level Land-Cover & Object Engine
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 uppercase">
                NASA & ISRO Calibrated
              </span>
            </div>
            <p className="text-[10px] text-[#8e9299]">
              Pre-trained LULC semantic segmentation, regional ROI filtering, and sub-pixel area analysis
            </p>
          </div>
        </div>

        {/* Satellite Mission Sensor Selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-[#0c0d0e] px-2.5 py-1 rounded border border-[#2a2c31]">
            <Globe className="h-3.5 w-3.5 text-[#4ade80]" />
            <span className="text-[10px] text-[#8e9299] uppercase">Mission:</span>
            <select
              value={selectedMissionId}
              onChange={(e) => setSelectedMissionId(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#4ade80] focus:outline-none cursor-pointer"
            >
              <optgroup label="ISRO Earth Observation Satellites">
                <option value="isro_cartosat3">ISRO Cartosat-3 (0.28m PAN / 1.12m MX)</option>
                <option value="isro_resourcesat2_liss4">ISRO Resourcesat-2A (5.8m LISS-IV)</option>
                <option value="isro_risat1a_sar">ISRO RISAT-1A / EOS-04 (3.0m C-Band SAR)</option>
                <option value="isro_oceansat3">ISRO Oceansat-3 (360m OCM-3)</option>
              </optgroup>
              <optgroup label="NASA & Joint Missions">
                <option value="nasa_landsat9_oli2">NASA Landsat 9 (30m OLI-2 / 100m Thermal)</option>
                <option value="nasa_terra_modis">NASA Terra / Aqua (250m MODIS)</option>
                <option value="nasa_isro_nisar">NASA-ISRO NISAR (6.0m Dual L/S-Band SAR)</option>
              </optgroup>
              <optgroup label="ESA Copernicus">
                <option value="esa_sentinel2">ESA Sentinel-2 (10m MSI Multi-Spectral)</option>
              </optgroup>
            </select>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-[#0c0d0e] hover:bg-[#2a2c31] border border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1] rounded transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Sensor Calibration Telemetry Bar */}
      <div className="px-3.5 py-2 bg-[#0c0d0e] border-b border-[#2a2c31] flex flex-wrap items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center space-x-3 text-[#8e9299]">
          <span className="flex items-center space-x-1">
            <span className="text-[#e1e1e1] font-bold">Agency:</span>
            <span className="text-[#4ade80] font-bold uppercase">{currentMission.agency}</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <span className="text-[#e1e1e1] font-bold">GSD (Pixel Size):</span>
            <span className="text-[#3b82f6] font-bold">{currentMission.gsdMeters}m</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <span className="text-[#e1e1e1] font-bold">Swath:</span>
            <span>{currentMission.swathWidthKm} km</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <span className="text-[#e1e1e1] font-bold">Quantization:</span>
            <span>{currentMission.radiometricBits}-bit</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {isSegmenting ? (
            <div className="flex items-center space-x-1.5 text-[#4ade80] animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>CLASSIFYING_PIXELS...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-[#4ade80]">
              <ShieldCheck className="h-3 w-3" />
              <span>MODEL_INFERENCE_READY</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[480px]">
        {/* Left Column: Interactive Canvas & Viewport (7 cols) */}
        <div className="lg:col-span-7 p-3.5 flex flex-col space-y-3 border-b lg:border-b-0 lg:border-r border-[#2a2c31] bg-[#0c0d0e]">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* View Mode Selector */}
            <div className="flex items-center space-x-1 bg-[#151619] p-1 rounded border border-[#2a2c31]">
              <button
                onClick={() => setViewMode('overlay')}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                  viewMode === 'overlay' ? 'bg-[#2a2c31] text-[#4ade80]' : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                Overlay Blend
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                  viewMode === 'split' ? 'bg-[#2a2c31] text-[#3b82f6]' : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                Split Curtain
              </button>
              <button
                onClick={() => setViewMode('mask_only')}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                  viewMode === 'mask_only' ? 'bg-[#2a2c31] text-[#f43f5e]' : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                Mask Only
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                  viewMode === 'raw' ? 'bg-[#2a2c31] text-[#e1e1e1]' : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                Raw Scene
              </button>
            </div>

            {/* Opacity Slider and Contours Toggle */}
            <div className="flex items-center space-x-3 text-[10px]">
              <div className="flex items-center space-x-1.5">
                <span className="text-[#8e9299]">Alpha:</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={Math.round(maskOpacity * 100)}
                  onChange={(e) => setMaskOpacity(Number(e.target.value) / 100)}
                  className="w-16 h-1 bg-[#2a2c31] rounded appearance-none cursor-pointer accent-[#4ade80]"
                />
                <span className="text-[#4ade80] font-bold w-6 text-right">
                  {Math.round(maskOpacity * 100)}%
                </span>
              </div>

              <button
                onClick={() => setShowContours(!showContours)}
                className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold transition-colors ${
                  showContours
                    ? 'bg-[#4ade80]/10 border-[#4ade80]/40 text-[#4ade80]'
                    : 'bg-[#151619] border-[#2a2c31] text-[#8e9299]'
                }`}
              >
                Contours
              </button>
            </div>
          </div>

          {/* Region-of-Interest (ROI) Preset Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#151619] p-1.5 rounded border border-[#2a2c31]">
            <span className="text-[10px] text-[#8e9299] uppercase font-bold px-1 flex items-center space-x-1">
              <Crop className="h-3 w-3 text-[#4ade80]" />
              <span>Region:</span>
            </span>

            {PRESET_ROIS.map((roi) => {
              const isSelected = !customRoiBox && selectedRoi.id === roi.id;
              return (
                <button
                  key={roi.id}
                  onClick={() => {
                    setCustomRoiBox(null);
                    setSelectedRoi(roi);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition-colors ${
                    isSelected
                      ? 'bg-[#4ade80] text-[#0c0d0e]'
                      : 'bg-[#0c0d0e] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
                  }`}
                >
                  {roi.name.split(' ')[0]}
                </button>
              );
            })}

            {customRoiBox && (
              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-[#f59e0b] text-[#0c0d0e] flex items-center space-x-1">
                <span>Custom Box ROI</span>
                <button
                  onClick={() => {
                    setCustomRoiBox(null);
                    setSelectedRoi(PRESET_ROIS[0]);
                  }}
                  className="hover:underline ml-1 font-black"
                >
                  ✕
                </button>
              </span>
            )}

            <span className="text-[9px] text-[#8e9299] ml-auto italic hidden sm:inline">
              (Click & drag on image to crop custom ROI)
            </span>
          </div>

          {/* Interactive Image & Mask Viewport Container */}
          <div
            ref={containerRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className="relative flex-1 min-h-[320px] bg-[#000] rounded border border-[#2a2c31] overflow-hidden select-none cursor-crosshair flex items-center justify-center"
          >
            {/* 1. Underlying Raw Satellite Scene */}
            <img
              src={image.dataUrl}
              alt="Satellite Scene"
              className="absolute inset-0 w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />

            {/* 2. Segmentation Mask Overlay */}
            {segmentationResult?.maskDataUrl && viewMode !== 'raw' && (
              <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  clipPath: viewMode === 'split' ? `inset(0 ${100 - splitCurtainPos}% 0 0)` : undefined
                }}
              >
                <img
                  src={segmentationResult.maskDataUrl}
                  alt="Segmentation Mask"
                  className="w-full h-full object-contain"
                  style={{
                    opacity: viewMode === 'mask_only' ? 1 : maskOpacity
                  }}
                />
              </div>
            )}

            {/* 3. Split Curtain Slider Handle (If in split view) */}
            {viewMode === 'split' && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#4ade80] shadow-[0_0_8px_#4ade80] z-20 pointer-events-none"
                style={{ left: `${splitCurtainPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-[#0c0d0e] border-2 border-[#4ade80] flex items-center justify-center text-[#4ade80] shadow-lg">
                  <Move className="h-3 w-3" />
                </div>
              </div>
            )}

            {/* 4. Active Region of Interest (ROI) Box Overlay */}
            {(() => {
              const activeBox = customRoiBox || selectedRoi.box;
              const isFull = activeBox[0] === 0 && activeBox[1] === 0 && activeBox[2] === 1 && activeBox[3] === 1;
              if (isFull) return null;

              const [ymin, xmin, ymax, xmax] = activeBox;
              return (
                <div
                  className="absolute border-2 border-dashed border-[#4ade80] bg-[#4ade80]/10 pointer-events-none z-10 transition-all"
                  style={{
                    top: `${ymin * 100}%`,
                    left: `${xmin * 100}%`,
                    width: `${(xmax - xmin) * 100}%`,
                    height: `${(ymax - ymin) * 100}%`
                  }}
                >
                  <span className="absolute top-1 left-1 px-1 py-0.2 bg-[#0c0d0e]/90 text-[#4ade80] text-[9px] font-bold uppercase rounded border border-[#4ade80]/30">
                    ROI Target Box
                  </span>
                </div>
              );
            })()}

            {/* 5. Identified Objects Bounding Boxes Overlay */}
            {segmentationResult?.identifiedObjects.map((obj) => {
              const isHovered = hoveredObjectId === obj.id || highlightedObjectId === obj.id;
              const [yminN, xminN, ymaxN, xmaxN] = obj.normalizedBox;
              const classDef = LAND_COVER_CLASSES[obj.classId] || LAND_COVER_CLASSES['urban'];

              return (
                <div
                  key={obj.id}
                  onMouseEnter={() => setHoveredObjectId(obj.id)}
                  onMouseLeave={() => setHoveredObjectId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHighlightedObjectId(obj.id);
                  }}
                  className={`absolute border transition-all pointer-events-auto cursor-pointer z-15 ${
                    isHovered
                      ? 'border-2 shadow-lg ring-2 ring-white/50'
                      : 'border-dashed border-opacity-70'
                  }`}
                  style={{
                    top: `${yminN * 100}%`,
                    left: `${xminN * 100}%`,
                    width: `${(xmaxN - xminN) * 100}%`,
                    height: `${(ymaxN - yminN) * 100}%`,
                    borderColor: classDef.colorHex,
                    backgroundColor: isHovered ? `${classDef.colorHex}22` : 'transparent'
                  }}
                >
                  <span
                    className="absolute -top-4 left-0 px-1 py-0.2 text-[8px] font-bold uppercase text-white rounded whitespace-nowrap shadow"
                    style={{ backgroundColor: classDef.colorHex }}
                  >
                    {obj.name} ({obj.areaHectares} ha)
                  </span>
                </div>
              );
            })}

            {/* Split View Interactive Range Input */}
            {viewMode === 'split' && (
              <input
                type="range"
                min="0"
                max="100"
                value={splitCurtainPos}
                onChange={(e) => setSplitCurtainPos(Number(e.target.value))}
                className="absolute bottom-2 left-4 right-4 z-30 opacity-60 hover:opacity-100 transition-opacity accent-[#4ade80]"
              />
            )}
          </div>

          {/* Quick Metrics & Scene Footprint Bar */}
          {segmentationResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-[#151619] p-2 rounded border border-[#2a2c31]">
                <span className="text-[9px] text-[#8e9299] uppercase block">Total Area</span>
                <span className="text-xs font-bold text-[#4ade80]">
                  {segmentationResult.totalGroundAreaHectares.toLocaleString()} ha
                </span>
                <span className="text-[9px] text-[#8e9299] block">
                  ({segmentationResult.totalGroundAreaKm2.toLocaleString()} km²)
                </span>
              </div>

              <div className="bg-[#151619] p-2 rounded border border-[#2a2c31]">
                <span className="text-[9px] text-[#8e9299] uppercase block">Analyzed Pixels</span>
                <span className="text-xs font-bold text-[#3b82f6]">
                  {segmentationResult.totalPixelsAnalyzed.toLocaleString()} px
                </span>
                <span className="text-[9px] text-[#8e9299] block">
                  {currentMission.gsdMeters}m / pixel
                </span>
              </div>

              <div className="bg-[#151619] p-2 rounded border border-[#2a2c31]">
                <span className="text-[9px] text-[#8e9299] uppercase block">Dominant Class</span>
                <span className="text-xs font-bold text-[#f43f5e] truncate block">
                  {segmentationResult.dominantClass.shortLabel}
                </span>
                <span className="text-[9px] text-[#8e9299] block">
                  {segmentationResult.metricsByClass[segmentationResult.dominantClass.id]?.percentage}% cover
                </span>
              </div>

              <div className="bg-[#151619] p-2 rounded border border-[#2a2c31]">
                <span className="text-[9px] text-[#8e9299] uppercase block">Identified Objects</span>
                <span className="text-xs font-bold text-[#eab308]">
                  {segmentationResult.identifiedObjects.length} Entities
                </span>
                <span className="text-[9px] text-[#8e9299] block">
                  NASA/ISRO Validated
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Multi-Tab Detailed Inspection & Object Identification (5 cols) */}
        <div className="lg:col-span-5 p-3.5 flex flex-col space-y-3 bg-[#151619]">
          {/* Sub Tabs */}
          <div className="flex items-center justify-between border-b border-[#2a2c31] pb-2">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('classes')}
                className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-colors ${
                  activeTab === 'classes'
                    ? 'bg-[#2a2c31] text-[#4ade80]'
                    : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                Classes & Area
              </button>
              <button
                onClick={() => setActiveTab('objects')}
                className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-colors flex items-center space-x-1 ${
                  activeTab === 'objects'
                    ? 'bg-[#2a2c31] text-[#eab308]'
                    : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                <span>Objects</span>
                <span className="px-1 py-0.2 rounded-full text-[8px] bg-[#eab308]/20 text-[#eab308]">
                  {segmentationResult?.identifiedObjects.length || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('sensor_specs')}
                className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-colors ${
                  activeTab === 'sensor_specs'
                    ? 'bg-[#2a2c31] text-[#3b82f6]'
                    : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                Satellite Sensor
              </button>
            </div>

            <button
              onClick={() => setActiveTab('export')}
              className={`p-1 rounded text-[10px] uppercase font-bold transition-colors ${
                activeTab === 'export' ? 'text-[#4ade80]' : 'text-[#8e9299] hover:text-[#e1e1e1]'
              }`}
              title="Export Data"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* TAB 1: Classes & Area Breakdown */}
          {activeTab === 'classes' && segmentationResult && (
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[460px] pr-1">
              <div className="text-[10px] text-[#8e9299] uppercase font-bold flex justify-between">
                <span>Land-Cover Class Distribution</span>
                <span>Toggle Filter</span>
              </div>

              {Object.entries(LAND_COVER_CLASSES).map(([cId, def]) => {
                const metric = segmentationResult.metricsByClass[cId];
                const isFiltered = classFilters[cId] !== false;
                const pct = metric?.percentage || 0;

                return (
                  <div
                    key={cId}
                    className={`p-2.5 rounded border transition-all ${
                      isFiltered
                        ? 'bg-[#0c0d0e] border-[#2a2c31]'
                        : 'bg-[#0c0d0e]/40 border-[#2a2c31]/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: def.colorHex }}
                        />
                        <span className="font-bold text-[#e1e1e1] text-xs">{def.name}</span>
                      </div>

                      <button
                        onClick={() => toggleClassFilter(cId)}
                        className={`p-1 rounded text-[10px] transition-colors ${
                          isFiltered
                            ? 'text-[#4ade80] hover:bg-[#2a2c31]'
                            : 'text-[#8e9299] hover:text-[#e1e1e1]'
                        }`}
                        title={isFiltered ? 'Hide class from mask' : 'Show class in mask'}
                      >
                        {isFiltered ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Progress Percentage Bar */}
                    <div className="w-full h-1.5 bg-[#151619] rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: def.colorHex
                        }}
                      />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 text-[9px] mono text-[#8e9299]">
                      <div>
                        <span className="block text-[#8e9299]">Coverage:</span>
                        <span className="font-bold text-[#e1e1e1] text-[10px]">{pct}%</span>
                      </div>
                      <div>
                        <span className="block text-[#8e9299]">Area (ha):</span>
                        <span className="font-bold text-[#3b82f6] text-[10px]">
                          {metric?.areaHectares.toLocaleString()} ha
                        </span>
                      </div>
                      <div>
                        <span className="block text-[#8e9299]">Area (km²):</span>
                        <span className="font-bold text-[#4ade80] text-[10px]">
                          {metric?.areaKm2.toLocaleString()} km²
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: NASA & ISRO Enhanced Object Identification */}
          {activeTab === 'objects' && segmentationResult && (
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[460px] pr-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8e9299] uppercase font-bold">
                  Identified Entities ({segmentationResult.identifiedObjects.length})
                </span>
                {onApplyObjectsToStudio && (
                  <button
                    onClick={handleApplyToStudio}
                    className="px-2 py-0.5 rounded bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 border border-[#3b82f6]/40 text-[#3b82f6] text-[9px] uppercase font-bold flex items-center space-x-1"
                  >
                    <span>Import to Studio</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>

              {segmentationResult.identifiedObjects.map((obj) => {
                const isSelected = highlightedObjectId === obj.id;
                const classDef = LAND_COVER_CLASSES[obj.classId] || LAND_COVER_CLASSES['urban'];

                return (
                  <div
                    key={obj.id}
                    onMouseEnter={() => setHoveredObjectId(obj.id)}
                    onMouseLeave={() => setHoveredObjectId(null)}
                    onClick={() => setHighlightedObjectId(isSelected ? null : obj.id)}
                    className={`p-2.5 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0c0d0e] border-[#4ade80] ring-1 ring-[#4ade80]'
                        : 'bg-[#0c0d0e] border-[#2a2c31] hover:border-[#3d4047]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        {getClassIcon(obj.classId)}
                        <span className="font-bold text-[#e1e1e1] text-xs">{obj.name}</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30">
                        {(obj.confidence * 100).toFixed(0)}% Conf
                      </span>
                    </div>

                    <div className="text-[10px] text-[#8e9299] mb-1.5">
                      Category: <span className="text-[#e1e1e1]">{obj.category}</span>
                    </div>

                    {/* Geometry & Radiometry Bar */}
                    <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#151619] rounded border border-[#2a2c31] text-[9px] mb-2">
                      <div>
                        <span className="text-[#8e9299] block">Area:</span>
                        <span className="font-bold text-[#3b82f6]">{obj.areaHectares} ha</span>
                      </div>
                      <div>
                        <span className="text-[#8e9299] block">Perimeter:</span>
                        <span className="font-bold text-[#e1e1e1]">{obj.perimeterMeters}m</span>
                      </div>
                      <div>
                        <span className="text-[#8e9299] block">Index:</span>
                        <span className="font-bold text-[#4ade80]">{obj.dominantSpectralIndex}</span>
                      </div>
                    </div>

                    {/* Sensor Validations Badge */}
                    <div className="space-y-1">
                      <span className="text-[8px] text-[#8e9299] uppercase tracking-wider block">
                        Sensor Cross-Validation:
                      </span>
                      {obj.validatedBySensors.map((val, vIdx) => (
                        <div key={vIdx} className="flex items-start space-x-1.5 text-[9px] text-[#e1e1e1]">
                          <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                            val.agency === 'ISRO' ? 'bg-[#f97316]/20 text-[#f97316]' : 'bg-[#3b82f6]/20 text-[#3b82f6]'
                          }`}>
                            {val.agency}
                          </span>
                          <span className="text-[#8e9299] leading-tight">{val.evidenceNote}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Satellite Mission & Sensor Specifications */}
          {activeTab === 'sensor_specs' && (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1 text-xs">
              <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31] space-y-2">
                <div className="flex items-center justify-between border-b border-[#2a2c31] pb-1.5">
                  <span className="font-bold text-[#4ade80] text-sm">{currentMission.name}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/40 uppercase">
                    {currentMission.agency}
                  </span>
                </div>

                <p className="text-[11px] text-[#8e9299] leading-relaxed">
                  {currentMission.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                  <div>
                    <span className="text-[#8e9299] block">Sensor:</span>
                    <span className="text-[#e1e1e1] font-bold">{currentMission.sensor}</span>
                  </div>
                  <div>
                    <span className="text-[#8e9299] block">Altitude / Orbit:</span>
                    <span className="text-[#e1e1e1]">{currentMission.altitudeKm} km SSO</span>
                  </div>
                  <div>
                    <span className="text-[#8e9299] block">Spatial GSD:</span>
                    <span className="text-[#4ade80] font-bold">{currentMission.gsdMeters} meters</span>
                  </div>
                  <div>
                    <span className="text-[#8e9299] block">Swath Width:</span>
                    <span className="text-[#e1e1e1]">{currentMission.swathWidthKm} km</span>
                  </div>
                </div>
              </div>

              {/* Mission Bands Breakdown */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[#8e9299] uppercase font-bold block">
                  Radiometric Payload Bands ({currentMission.bands.length})
                </span>
                <div className="space-y-1">
                  {currentMission.bands.map((b, bIdx) => (
                    <div key={bIdx} className="p-2 bg-[#0c0d0e] rounded border border-[#2a2c31] text-[10px]">
                      <div className="flex justify-between text-[#e1e1e1] font-bold">
                        <span>{b.name}</span>
                        <span className="text-[#3b82f6]">{b.wavelengthMicrons}</span>
                      </div>
                      <p className="text-[9px] text-[#8e9299] mt-0.5">{b.primaryUse}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Identification Strengths */}
              <div className="p-2.5 bg-[#0c0d0e] rounded border border-[#2a2c31] space-y-1">
                <span className="text-[10px] text-[#4ade80] uppercase font-bold block">
                  Sensor Identification Advantages:
                </span>
                <ul className="space-y-1 text-[10px] text-[#8e9299]">
                  {currentMission.identificationStrengths.map((str, sIdx) => (
                    <li key={sIdx} className="flex items-start space-x-1.5">
                      <span className="text-[#4ade80] font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: Export Forensic Intelligence */}
          {activeTab === 'export' && segmentationResult && (
            <div className="space-y-3 flex-1 text-xs">
              <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31] space-y-2">
                <h4 className="font-bold text-[#e1e1e1] uppercase text-[11px]">
                  Export Calibrated LULC Intelligence
                </h4>
                <p className="text-[10px] text-[#8e9299] leading-relaxed">
                  Download geospatial mask overlays, classified land-cover area matrices, or GeoJSON boundaries calibrated to {currentMission.name} specifications.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleExportMask}
                  className="w-full p-2.5 bg-[#0c0d0e] hover:bg-[#2a2c31] border border-[#2a2c31] rounded text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Download className="h-4 w-4 text-[#4ade80]" />
                    <div>
                      <div className="font-bold text-[#e1e1e1] text-xs">Export Segmentation Mask (PNG)</div>
                      <div className="text-[9px] text-[#8e9299]">Full-resolution RGBA color mask layer</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8e9299]" />
                </button>

                <button
                  onClick={handleExportCsv}
                  className="w-full p-2.5 bg-[#0c0d0e] hover:bg-[#2a2c31] border border-[#2a2c31] rounded text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-[#3b82f6]" />
                    <div>
                      <div className="font-bold text-[#e1e1e1] text-xs">Export Area Analysis (CSV)</div>
                      <div className="text-[9px] text-[#8e9299]">Calibrated hectares, km², and pixel counts</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8e9299]" />
                </button>

                {onApplyObjectsToStudio && (
                  <button
                    onClick={handleApplyToStudio}
                    className="w-full p-2.5 bg-[#4ade80]/10 hover:bg-[#4ade80]/20 border border-[#4ade80]/40 rounded text-left flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-[#4ade80]" />
                      <div>
                        <div className="font-bold text-[#4ade80] text-xs">Push {segmentationResult.identifiedObjects.length} Objects to Studio</div>
                        <div className="text-[9px] text-[#8e9299]">Sync bounding boxes with main workspace</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#4ade80]" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Sparkles,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Layers,
  Thermometer,
  Flame,
  Droplets,
  Activity,
  ArrowRight,
  Maximize2,
  Check,
  Radio,
  BarChart3
} from 'lucide-react';
import { IRColormap, IRConversionSettings, RemoteSensingImage } from '../types';
import { convertIrImageToColor } from '../utils/irColorizer';
import { AUTHENTIC_SATELLITE_URLS } from '../services/proceduralImageGen';

interface IrToColorConverterProps {
  onLoadIntoStudio?: (image: RemoteSensingImage, defaultQuery?: string) => void;
}

const IR_PRESETS: {
  id: string;
  name: string;
  type: 'cir_nir' | 'thermal_lwir' | 'swir_burn';
  description: string;
  sourceUrl: string;
  recommendedColormap: IRColormap;
}[] = [
  {
    id: 'preset_cir_agri',
    name: 'Sentinel-2 Color Infrared (CIR B8-B4-B3)',
    type: 'cir_nir',
    description: 'Near-Infrared false-color where vegetation is bright crimson red and water is dark navy. Ideal for conversion into natural true-color green.',
    sourceUrl: AUTHENTIC_SATELLITE_URLS.optical_agri,
    recommendedColormap: 'natural_truecolor'
  },
  {
    id: 'preset_thermal_wildfire',
    name: 'Wildfire Thermal Anomaly & SWIR Radiance',
    type: 'swir_burn',
    description: 'Long-wave thermal infrared radiance showing active fire perimeters, heated soils, and cool unburned canopy.',
    sourceUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t2,
    recommendedColormap: 'thermal_anomaly'
  },
  {
    id: 'preset_thermal_flir',
    name: 'Urban Heat Island & Radiometric Surface Temp',
    type: 'thermal_lwir',
    description: 'Calibrated surface temperature map showing building concrete thermal mass vs vegetative cooling.',
    sourceUrl: AUTHENTIC_SATELLITE_URLS.optical_urban,
    recommendedColormap: 'ironbow'
  }
];

export const IrToColorConverter: React.FC<IrToColorConverterProps> = ({ onLoadIntoStudio }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(IR_PRESETS[0].id);
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState<IRConversionSettings>({
    colormap: 'natural_truecolor',
    contrastStretch: 'percentile_2_98',
    gamma: 1.0,
    chlorophyllBoost: 1.15,
    hazeReduction: 25,
    splitViewPosition: 50
  });

  const [convertedDataUrl, setConvertedDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTimeMs, setProcessingTimeMs] = useState<number>(0);
  const [activeViewMode, setActiveViewMode] = useState<'split' | 'side_by_side' | 'converted_only'>('split');
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSourceUrl = customImageSrc || IR_PRESETS.find(p => p.id === selectedPresetId)?.sourceUrl || IR_PRESETS[0].sourceUrl;

  // Process image whenever settings or source changes
  useEffect(() => {
    let isMounted = true;
    const runConversion = async () => {
      setIsProcessing(true);
      try {
        const res = await convertIrImageToColor(currentSourceUrl, settings);
        if (isMounted) {
          setConvertedDataUrl(res.convertedDataUrl);
          setProcessingTimeMs(res.processingTimeMs);
        }
      } catch (err) {
        console.error('IR Conversion error:', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    runConversion();
    return () => { isMounted = false; };
  }, [currentSourceUrl, settings.colormap, settings.gamma, settings.chlorophyllBoost, settings.hazeReduction]);

  // Handle Split Slider Dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSlider || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSettings(prev => ({ ...prev, splitViewPosition: pct }));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSettings(prev => ({ ...prev, splitViewPosition: pct }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendToStudio = () => {
    if (!convertedDataUrl || !onLoadIntoStudio) return;

    const newImg: RemoteSensingImage = {
      id: `converted_ir_${Date.now()}`,
      name: `Synthesized_TrueColor_${settings.colormap}.tif`,
      modality: 'optical',
      role: 'single',
      dataUrl: convertedDataUrl,
      thumbnailUrl: convertedDataUrl,
      metadata: {
        format: 'GeoTIFF',
        crs: 'EPSG:32631 (WGS 84 / UTM 31N)',
        dimensions: { width: 1600, height: 1067 },
        bands: ['B02-Blue (Synth)', 'B03-Green (Synth)', 'B04-Red (Synth)'],
        satellite: 'Synthetic/Benchmark',
        acquisitionDate: new Date().toISOString(),
        cloudCoverPercentage: 0.0
      }
    };

    onLoadIntoStudio(
      newImg,
      'Perform detailed visual inspection and object grounding on this synthesized photorealistic image transformed from infrared satellite sensor data.'
    );
  };

  const handleDownload = () => {
    if (!convertedDataUrl) return;
    const a = document.createElement('a');
    a.href = convertedDataUrl;
    a.download = `SatQuery_Synthesized_${settings.colormap}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="bg-[#151619] border border-[#2a2c31] p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="h-5 w-5 text-[#4ade80]" />
            <h1 className="text-sm font-bold uppercase tracking-wider text-[#e1e1e1]">
              Infrared (IR / NIR / Thermal) to True-Color Radiometric Synthesizer
            </h1>
          </div>
          <p className="text-[11px] mono text-[#8e9299] max-w-2xl leading-relaxed">
            Real-time radiometric converter transforming <strong>Color Infrared (CIR)</strong>, <strong>Near-Infrared (NIR)</strong>, and <strong>Thermal LWIR</strong> satellite imagery into natural photorealistic RGB or scientific thermal color palettes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.tif,.tiff"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#0c0d0e] hover:bg-[#111215] border border-[#2a2c31] text-[#e1e1e1] rounded text-xs mono uppercase font-bold transition-all"
          >
            <Upload className="h-3.5 w-3.5 text-[#4ade80]" />
            <span>Upload IR Image</span>
          </button>

          <button
            onClick={handleSendToStudio}
            disabled={!convertedDataUrl}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#4ade80] hover:brightness-110 text-black rounded text-xs mono uppercase font-bold transition-all shadow active:scale-95"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Open in AI Studio</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Controls & Visual Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sidebar: Colormap & Radiometric Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Preset Selector */}
          <div className="bg-[#151619] border border-[#2a2c31] p-4 rounded space-y-3">
            <h2 className="text-xs font-bold text-[#e1e1e1] uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="h-3.5 w-3.5 text-[#4ade80]" />
              <span>Input IR Satellite Presets</span>
            </h2>

            <div className="space-y-2">
              {IR_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id && !customImageSrc;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setCustomImageSrc(null);
                      setSettings(s => ({ ...s, colormap: preset.recommendedColormap }));
                    }}
                    className={`p-2.5 rounded border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#4ade80]/10 border-[#4ade80]'
                        : 'bg-[#0c0d0e] border-[#2a2c31] hover:border-[#3d4047]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[#e1e1e1] mb-1">
                      <span>{preset.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#4ade80]" />}
                    </div>
                    <p className="text-[10.5px] mono text-[#8e9299] leading-tight">
                      {preset.description}
                    </p>
                  </div>
                );
              })}

              {customImageSrc && (
                <div className="p-2.5 rounded border bg-[#3b82f6]/10 border-[#3b82f6] text-xs">
                  <span className="font-bold text-[#3b82f6] block mb-0.5">User Custom Upload Active</span>
                  <span className="text-[10px] mono text-[#8e9299]">Custom infrared sensor file loaded</span>
                </div>
              )}
            </div>
          </div>

          {/* Palette / Colormap Modes */}
          <div className="bg-[#151619] border border-[#2a2c31] p-4 rounded space-y-3">
            <h2 className="text-xs font-bold text-[#e1e1e1] uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="h-3.5 w-3.5 text-[#4ade80]" />
              <span>Target Color Palette</span>
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs mono">
              <button
                onClick={() => setSettings(s => ({ ...s, colormap: 'natural_truecolor' }))}
                className={`p-2 rounded border text-left transition-all col-span-2 flex items-center justify-between ${
                  settings.colormap === 'natural_truecolor'
                    ? 'bg-[#4ade80] text-black font-bold'
                    : 'bg-[#0c0d0e] border-[#2a2c31] text-[#e1e1e1] hover:border-[#4ade80]'
                }`}
              >
                <div>
                  <span className="block font-bold">Natural True-Color (RGB)</span>
                  <span className="text-[9.5px] opacity-80">Photorealistic NIR $\to$ Chlorophyll Green</span>
                </div>
                <Sparkles className="h-4 w-4" />
              </button>

              <button
                onClick={() => setSettings(s => ({ ...s, colormap: 'ironbow' }))}
                className={`p-2 rounded border text-left transition-all ${
                  settings.colormap === 'ironbow'
                    ? 'bg-[#3b82f6] text-white font-bold'
                    : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                <span className="block font-bold">FLIR Ironbow</span>
                <span className="text-[9px] opacity-80">Thermal Classic</span>
              </button>

              <button
                onClick={() => setSettings(s => ({ ...s, colormap: 'inferno' }))}
                className={`p-2 rounded border text-left transition-all ${
                  settings.colormap === 'inferno'
                    ? 'bg-[#f43f5e] text-white font-bold'
                    : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                <span className="block font-bold">Inferno</span>
                <span className="text-[9px] opacity-80">Perceptual LWIR</span>
              </button>

              <button
                onClick={() => setSettings(s => ({ ...s, colormap: 'thermal_anomaly' }))}
                className={`p-2 rounded border text-left transition-all ${
                  settings.colormap === 'thermal_anomaly'
                    ? 'bg-[#f59e0b] text-black font-bold'
                    : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                <span className="block font-bold">Fire Anomaly</span>
                <span className="text-[9px] opacity-80">Wildfire Hotspots</span>
              </button>

              <button
                onClick={() => setSettings(s => ({ ...s, colormap: 'viridis' }))}
                className={`p-2 rounded border text-left transition-all ${
                  settings.colormap === 'viridis'
                    ? 'bg-[#10b981] text-black font-bold'
                    : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                <span className="block font-bold">Viridis</span>
                <span className="text-[9px] opacity-80">Multispectral</span>
              </button>

              <button
                onClick={() => setSettings(s => ({ ...s, colormap: 'turbo' }))}
                className={`p-2 rounded border text-left transition-all ${
                  settings.colormap === 'turbo'
                    ? 'bg-[#a855f7] text-white font-bold'
                    : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                <span className="block font-bold">Turbo Rainbow</span>
                <span className="text-[9px] opacity-80">Radiometric High-Res</span>
              </button>

              <button
                onClick={() => setSettings(s => ({ ...s, colormap: 'swir_moisture' }))}
                className={`p-2 rounded border text-left transition-all ${
                  settings.colormap === 'swir_moisture'
                    ? 'bg-[#06b6d4] text-black font-bold'
                    : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                <span className="block font-bold">SWIR Moisture</span>
                <span className="text-[9px] opacity-80">Soil / Water Burn</span>
              </button>
            </div>
          </div>

          {/* Precision Radiometric Adjustment Sliders */}
          <div className="bg-[#151619] border border-[#2a2c31] p-4 rounded space-y-3.5 text-xs mono">
            <h2 className="font-bold text-[#e1e1e1] uppercase tracking-wider flex items-center justify-between">
              <span>Radiometric Tuning</span>
              <span className="text-[#4ade80] text-[10px]">{processingTimeMs}ms latency</span>
            </h2>

            {/* Chlorophyll Boost */}
            <div className="space-y-1">
              <div className="flex justify-between text-[#8e9299] text-[11px]">
                <span>Chlorophyll Foliage Gain:</span>
                <span className="text-[#4ade80] font-bold">{settings.chlorophyllBoost.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={settings.chlorophyllBoost}
                onChange={(e) => setSettings(s => ({ ...s, chlorophyllBoost: parseFloat(e.target.value) }))}
                className="w-full accent-[#4ade80] h-1.5 bg-[#0c0d0e] rounded cursor-pointer"
              />
            </div>

            {/* Gamma Correction */}
            <div className="space-y-1">
              <div className="flex justify-between text-[#8e9299] text-[11px]">
                <span>Gamma Correction ($\gamma$):</span>
                <span className="text-[#3b82f6] font-bold">{settings.gamma.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.2"
                step="0.05"
                value={settings.gamma}
                onChange={(e) => setSettings(s => ({ ...s, gamma: parseFloat(e.target.value) }))}
                className="w-full accent-[#3b82f6] h-1.5 bg-[#0c0d0e] rounded cursor-pointer"
              />
            </div>

            {/* Atmospheric Dehaze */}
            <div className="space-y-1">
              <div className="flex justify-between text-[#8e9299] text-[11px]">
                <span>Atmospheric Dehaze / Stretch:</span>
                <span className="text-[#f59e0b] font-bold">{settings.hazeReduction}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={settings.hazeReduction}
                onChange={(e) => setSettings(s => ({ ...s, hazeReduction: parseInt(e.target.value) }))}
                className="w-full accent-[#f59e0b] h-1.5 bg-[#0c0d0e] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Canvas: Interactive Split-Screen & Comparison View (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Canvas Top Bar */}
          <div className="bg-[#151619] border border-[#2a2c31] px-4 py-2.5 rounded flex flex-wrap items-center justify-between gap-2 text-xs mono">
            <div className="flex items-center space-x-2">
              <span className="text-[#8e9299] uppercase text-[10px]">Display Mode:</span>
              <div className="flex items-center space-x-1 bg-[#0c0d0e] p-0.5 rounded border border-[#2a2c31]">
                <button
                  onClick={() => setActiveViewMode('split')}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-all ${
                    activeViewMode === 'split'
                      ? 'bg-[#4ade80] text-black'
                      : 'text-[#8e9299] hover:text-[#e1e1e1]'
                  }`}
                >
                  Curtain Split
                </button>
                <button
                  onClick={() => setActiveViewMode('side_by_side')}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-all ${
                    activeViewMode === 'side_by_side'
                      ? 'bg-[#4ade80] text-black'
                      : 'text-[#8e9299] hover:text-[#e1e1e1]'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setActiveViewMode('converted_only')}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-all ${
                    activeViewMode === 'converted_only'
                      ? 'bg-[#4ade80] text-black'
                      : 'text-[#8e9299] hover:text-[#e1e1e1]'
                  }`}
                >
                  Synthesized Only
                </button>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#0c0d0e] hover:bg-[#111215] border border-[#2a2c31] text-[#e1e1e1] rounded text-[11px] font-bold uppercase transition-all"
            >
              <Download className="h-3 w-3 text-[#4ade80]" />
              <span>Export PNG</span>
            </button>
          </div>

          {/* Visual Display Stage */}
          {activeViewMode === 'split' && (
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onMouseDown={() => setIsDraggingSlider(true)}
              onMouseUp={() => setIsDraggingSlider(false)}
              onMouseLeave={() => setIsDraggingSlider(false)}
              className="relative w-full aspect-video bg-[#0c0d0e] border border-[#2a2c31] rounded overflow-hidden select-none cursor-ew-resize shadow-2xl"
            >
              {/* Background: Raw Original IR Image */}
              <img
                src={currentSourceUrl}
                alt="Raw Infrared"
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Foreground: Converted Color Image (clipped by split position) */}
              {convertedDataUrl && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${settings.splitViewPosition}%` }}
                >
                  <img
                    src={convertedDataUrl}
                    alt="Synthesized Color"
                    className="absolute top-0 left-0 max-w-none w-full h-full object-cover"
                    style={{
                      width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                      height: containerRef.current ? `${containerRef.current.clientHeight}px` : '100%'
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Split Slider Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#4ade80] shadow-[0_0_10px_#4ade80] z-20 pointer-events-none"
                style={{ left: `${settings.splitViewPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-[#0c0d0e] border-2 border-[#4ade80] flex items-center justify-center text-[#4ade80] shadow-lg">
                  <div className="flex space-x-0.5">
                    <span className="w-0.5 h-3 bg-[#4ade80] rounded" />
                    <span className="w-0.5 h-3 bg-[#4ade80] rounded" />
                  </div>
                </div>
              </div>

              {/* Corner Badges */}
              <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded border border-[#4ade80]/40 text-[10px] mono font-bold text-[#4ade80]">
                SYNTHESIZED {settings.colormap.toUpperCase()} ({settings.splitViewPosition.toFixed(0)}%)
              </div>
              <div className="absolute top-2 right-2 z-10 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded border border-[#2a2c31] text-[10px] mono text-[#8e9299]">
                RAW INFRARED (INPUT)
              </div>
            </div>
          )}

          {activeViewMode === 'side_by_side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#0c0d0e] border border-[#2a2c31] rounded overflow-hidden relative aspect-video">
                <img
                  src={currentSourceUrl}
                  alt="Raw IR"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] mono text-[#8e9299]">
                  Input Raw Infrared (CIR / LWIR)
                </span>
              </div>

              <div className="bg-[#0c0d0e] border border-[#4ade80]/40 rounded overflow-hidden relative aspect-video">
                {convertedDataUrl && (
                  <img
                    src={convertedDataUrl}
                    alt="Synthesized"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] mono text-[#4ade80] font-bold">
                  Synthesized Color ({settings.colormap})
                </span>
              </div>
            </div>
          )}

          {activeViewMode === 'converted_only' && (
            <div className="bg-[#0c0d0e] border border-[#2a2c31] rounded overflow-hidden relative aspect-video">
              {convertedDataUrl && (
                <img
                  src={convertedDataUrl}
                  alt="Synthesized"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] mono text-[#4ade80] font-bold">
                100% Synthesized RGB Palette
              </span>
            </div>
          )}

          {/* Conversion Details Card */}
          <div className="bg-[#151619] border border-[#2a2c31] p-3.5 rounded text-xs mono grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#0c0d0e] p-2 rounded border border-[#2a2c31]">
              <span className="text-[#8e9299] text-[9px] uppercase block">Palette Mode</span>
              <span className="text-[#4ade80] font-bold truncate block">{settings.colormap}</span>
            </div>
            <div className="bg-[#0c0d0e] p-2 rounded border border-[#2a2c31]">
              <span className="text-[#8e9299] text-[9px] uppercase block">Foliage Gain</span>
              <span className="text-[#e1e1e1] font-bold">{settings.chlorophyllBoost}x</span>
            </div>
            <div className="bg-[#0c0d0e] p-2 rounded border border-[#2a2c31]">
              <span className="text-[#8e9299] text-[9px] uppercase block">Gamma $\gamma$</span>
              <span className="text-[#3b82f6] font-bold">{settings.gamma}</span>
            </div>
            <div className="bg-[#0c0d0e] p-2 rounded border border-[#2a2c31]">
              <span className="text-[#8e9299] text-[9px] uppercase block">Render Time</span>
              <span className="text-[#f59e0b] font-bold">{processingTimeMs} ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

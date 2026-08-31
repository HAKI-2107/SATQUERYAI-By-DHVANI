import React from 'react';
import { 
  Split, 
  Columns, 
  Search, 
  Layers, 
  Timer, 
  Sparkles, 
  ArrowLeftRight, 
  Play, 
  Pause, 
  Flame, 
  Sliders, 
  Target, 
  Send,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { RemoteSensingImage } from '../types';
import { DifferenceResult, DifferenceOverlayStyle } from '../utils/pixelDifferencing';

export type CompareLayoutMode = 'curtain' | 'side_by_side' | 'spotlight' | 'dissolve' | 'blink';

interface CompareEpochsToolbarProps {
  isCompareActive: boolean;
  setIsCompareActive: (active: boolean) => void;
  compareLayout: CompareLayoutMode;
  setCompareLayout: (layout: CompareLayoutMode) => void;
  splitPos: number;
  setSplitPos: (pos: number) => void;
  isAutoSweeping: boolean;
  setIsAutoSweeping: (sweep: boolean) => void;
  epochOrderReversed: boolean;
  setEpochOrderReversed: (reversed: boolean | ((prev: boolean) => boolean)) => void;
  primaryImage: RemoteSensingImage;
  secondaryImage: RemoteSensingImage;
  showPixelChangeOverlay: boolean;
  setShowPixelChangeOverlay: (show: boolean | ((prev: boolean) => boolean)) => void;
  changeOverlayStyle: DifferenceOverlayStyle;
  setChangeOverlayStyle: (style: DifferenceOverlayStyle) => void;
  changeThreshold: number;
  setChangeThreshold: (thresh: number) => void;
  changeOpacity: number;
  setChangeOpacity: (op: number) => void;
  diffResult: DifferenceResult | null;
  isComputingDiff: boolean;
  onPinCoordinates?: (coordsText: string) => void;
}

export const CompareEpochsToolbar: React.FC<CompareEpochsToolbarProps> = ({
  isCompareActive,
  setIsCompareActive,
  compareLayout,
  setCompareLayout,
  splitPos,
  setSplitPos,
  isAutoSweeping,
  setIsAutoSweeping,
  epochOrderReversed,
  setEpochOrderReversed,
  primaryImage,
  secondaryImage,
  showPixelChangeOverlay,
  setShowPixelChangeOverlay,
  changeOverlayStyle,
  setChangeOverlayStyle,
  changeThreshold,
  setChangeThreshold,
  changeOpacity,
  setChangeOpacity,
  diffResult,
  isComputingDiff,
  onPinCoordinates
}) => {
  const gsdMeters = primaryImage?.metadata?.gsdMeters || 10;
  const approxTotalAreaKm2 = ((512 * gsdMeters * (512 * gsdMeters)) / 1000000).toFixed(2);
  const approxChangedAreaKm2 = diffResult
    ? (((diffResult.changePercentage / 100) * Number(approxTotalAreaKm2))).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-2.5">
      {/* Top Banner: Compare Epochs Mode & Layout Switcher */}
      <div className="bg-[#0c0d0e] p-2.5 rounded border border-[#2a2c31] flex flex-wrap items-center justify-between gap-2 text-xs mono">
        
        {/* Left: Mode Title and Epoch Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCompareActive(!isCompareActive)}
            className={`px-3 py-1 rounded font-bold uppercase transition-all flex items-center space-x-1.5 ${
              isCompareActive
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
          >
            <Split className="h-3.5 w-3.5" />
            <span>COMPARE EPOCHS</span>
            {isCompareActive && <span className="h-2 w-2 rounded-full bg-[#4ade80] animate-pulse" />}
          </button>

          {/* Epoch 1 & Epoch 2 Indicator Pills */}
          <div className="flex items-center space-x-1 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 truncate max-w-[150px]" title={primaryImage?.name}>
              T1: {primaryImage?.metadata?.acquisitionDate ? primaryImage.metadata.acquisitionDate.split('T')[0] : 'Pre-Event'}
            </span>
            <button
              onClick={() => setEpochOrderReversed(prev => !prev)}
              className="p-1 hover:bg-[#1f2127] rounded text-[#8e9299] hover:text-[#4ade80] transition-colors"
              title="Swap Epochs (T1 ↔ T2)"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-500/30 truncate max-w-[150px]" title={secondaryImage?.name}>
              T2: {secondaryImage?.metadata?.acquisitionDate ? secondaryImage.metadata.acquisitionDate.split('T')[0] : 'Post-Event'}
            </span>
          </div>
        </div>

        {/* Right: Layout Switcher */}
        {isCompareActive && (
          <div className="flex items-center space-x-1 bg-[#151619] p-0.5 rounded border border-[#2a2c31] text-[10px]">
            <button
              onClick={() => setCompareLayout('curtain')}
              className={`px-2 py-1 rounded font-semibold transition-all flex items-center space-x-1 ${
                compareLayout === 'curtain' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-[#8e9299] hover:text-[#e1e1e1]'
              }`}
              title="Split Curtain Slider (Drag divider to compare)"
            >
              <Split className="h-3 w-3" />
              <span>Split Curtain</span>
            </button>

            <button
              onClick={() => setCompareLayout('side_by_side')}
              className={`px-2 py-1 rounded font-semibold transition-all flex items-center space-x-1 ${
                compareLayout === 'side_by_side' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-[#8e9299] hover:text-[#e1e1e1]'
              }`}
              title="Side-by-Side Dual Synchronized Split View"
            >
              <Columns className="h-3 w-3" />
              <span>Side-by-Side</span>
            </button>

            <button
              onClick={() => setCompareLayout('spotlight')}
              className={`px-2 py-1 rounded font-semibold transition-all flex items-center space-x-1 ${
                compareLayout === 'spotlight' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-[#8e9299] hover:text-[#e1e1e1]'
              }`}
              title="Spyglass circular loupe"
            >
              <Search className="h-3 w-3" />
              <span>Spyglass</span>
            </button>

            <button
              onClick={() => setCompareLayout('dissolve')}
              className={`px-2 py-1 rounded font-semibold transition-all flex items-center space-x-1 ${
                compareLayout === 'dissolve' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-[#8e9299] hover:text-[#e1e1e1]'
              }`}
              title="Alpha Dissolve Overlay"
            >
              <Layers className="h-3 w-3" />
              <span>Dissolve</span>
            </button>

            <button
              onClick={() => setCompareLayout('blink')}
              className={`px-2 py-1 rounded font-semibold transition-all flex items-center space-x-1 ${
                compareLayout === 'blink' ? 'bg-[#f43f5e] text-white shadow-sm animate-pulse' : 'text-[#8e9299] hover:text-[#e1e1e1]'
              }`}
              title="Blink comparator toggling at 1.5 Hz"
            >
              <Timer className="h-3 w-3" />
              <span>Blink</span>
            </button>
          </div>
        )}
      </div>

      {/* Split Curtain Slider Sub-Toolbar (When Curtain mode active) */}
      {isCompareActive && compareLayout === 'curtain' && (
        <div className="bg-[#0c0d0e] px-3 py-2 rounded border border-[#2a2c31] flex flex-wrap items-center justify-between gap-2 text-xs mono">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-[#8e9299] font-bold uppercase">Split Position:</span>
            <span className="text-xs font-bold text-[#4ade80] min-w-[36px]">{Math.round(splitPos)}%</span>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSplitPos(0)}
                className="px-1.5 py-0.5 text-[9px] bg-[#151619] hover:bg-[#202227] text-[#8e9299] hover:text-[#e1e1e1] rounded border border-[#2a2c31]"
              >
                0% (T1)
              </button>
              <button
                onClick={() => setSplitPos(25)}
                className="px-1.5 py-0.5 text-[9px] bg-[#151619] hover:bg-[#202227] text-[#8e9299] hover:text-[#e1e1e1] rounded border border-[#2a2c31]"
              >
                25%
              </button>
              <button
                onClick={() => setSplitPos(50)}
                className="px-1.5 py-0.5 text-[9px] bg-[#151619] hover:bg-[#202227] text-[#4ade80] font-bold rounded border border-[#2a2c31]"
              >
                50% Split
              </button>
              <button
                onClick={() => setSplitPos(75)}
                className="px-1.5 py-0.5 text-[9px] bg-[#151619] hover:bg-[#202227] text-[#8e9299] hover:text-[#e1e1e1] rounded border border-[#2a2c31]"
              >
                75%
              </button>
              <button
                onClick={() => setSplitPos(100)}
                className="px-1.5 py-0.5 text-[9px] bg-[#151619] hover:bg-[#202227] text-[#8e9299] hover:text-[#e1e1e1] rounded border border-[#2a2c31]"
              >
                100% (T2)
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsAutoSweeping(!isAutoSweeping)}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center space-x-1.5 ${
              isAutoSweeping
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-[#151619] text-[#8e9299] hover:text-amber-400 border border-[#2a2c31]'
            }`}
            title="Auto-sweep slider back and forth"
          >
            {isAutoSweeping ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{isAutoSweeping ? 'Pause Sweep' : 'Auto Sweep'}</span>
          </button>
        </div>
      )}

      {/* Pixel-Level Changes Overlay Controls Bar */}
      {isCompareActive && (
        <div className="bg-[#0c0d0e] p-2.5 rounded border border-[#2a2c31] space-y-2 text-xs mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Toggle Overlay Button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPixelChangeOverlay(prev => !prev)}
                className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all flex items-center space-x-1.5 ${
                  showPixelChangeOverlay
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Pixel Delta Overlay</span>
                {showPixelChangeOverlay && <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />}
              </button>

              {isComputingDiff && (
                <span className="text-[10px] text-amber-400 flex items-center space-x-1 animate-pulse">
                  <Zap className="h-3 w-3" />
                  <span>Computing $\Delta$ Pixels...</span>
                </span>
              )}
            </div>

            {/* Overlay Style Selector (Semantic / Heatmap / Neon / Monochrome) */}
            {showPixelChangeOverlay && (
              <div className="flex items-center space-x-1 bg-[#151619] p-0.5 rounded border border-[#2a2c31] text-[10px]">
                <button
                  onClick={() => setChangeOverlayStyle('semantic')}
                  className={`px-2 py-0.5 rounded ${
                    changeOverlayStyle === 'semantic' ? 'bg-[#f43f5e] text-white font-bold' : 'text-[#8e9299] hover:text-[#e1e1e1]'
                  }`}
                  title="Semantic classification: Red (Loss/Damage), Cyan (Flood), Green (Growth), Amber (Urban)"
                >
                  Semantic
                </button>
                <button
                  onClick={() => setChangeOverlayStyle('heatmap')}
                  className={`px-2 py-0.5 rounded ${
                    changeOverlayStyle === 'heatmap' ? 'bg-amber-500 text-black font-bold' : 'text-[#8e9299] hover:text-[#e1e1e1]'
                  }`}
                  title="Thermal Delta Heatmap gradient"
                >
                  Heatmap
                </button>
                <button
                  onClick={() => setChangeOverlayStyle('neon')}
                  className={`px-2 py-0.5 rounded ${
                    changeOverlayStyle === 'neon' ? 'bg-[#4ade80] text-black font-bold' : 'text-[#8e9299] hover:text-[#e1e1e1]'
                  }`}
                  title="Neon High-Contrast Contours"
                >
                  Neon
                </button>
                <button
                  onClick={() => setChangeOverlayStyle('monochrome')}
                  className={`px-2 py-0.5 rounded ${
                    changeOverlayStyle === 'monochrome' ? 'bg-slate-200 text-black font-bold' : 'text-[#8e9299] hover:text-[#e1e1e1]'
                  }`}
                  title="Grayscale Differential Magnitude"
                >
                  Differential
                </button>
              </div>
            )}
          </div>

          {/* Sliders: Threshold Sensitivity & Overlay Opacity */}
          {showPixelChangeOverlay && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#2a2c31] text-[10px]">
              <div>
                <div className="flex justify-between text-[#8e9299] mb-1">
                  <span>Sensitivity Threshold</span>
                  <span className="text-[#4ade80] font-bold">{changeThreshold} (Delta $\sigma$)</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="60"
                  value={changeThreshold}
                  onChange={(e) => setChangeThreshold(Number(e.target.value))}
                  className="w-full h-1 bg-[#2a2c31] rounded accent-[#4ade80] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#8e9299] mb-1">
                  <span>Overlay Opacity</span>
                  <span className="text-[#3b82f6] font-bold">{Math.round(changeOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={Math.round(changeOpacity * 100)}
                  onChange={(e) => setChangeOpacity(Number(e.target.value) / 100)}
                  className="w-full h-1 bg-[#2a2c31] rounded accent-[#3b82f6] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quantitative Change Detection Stats Card */}
      {isCompareActive && showPixelChangeOverlay && diffResult && (
        <div className="bg-[#0c0d0e] p-3 rounded border border-rose-500/40 space-y-2 text-xs mono animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#2a2c31] pb-1.5">
            <div className="flex items-center space-x-2">
              <Flame className="h-4 w-4 text-rose-500 animate-pulse" />
              <span className="text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                Pixel-Level Bi-Temporal Change Telemetry
              </span>
            </div>
            <div className="text-[10px] text-[#8e9299]">
              Total Scene Area: <span className="text-[#e1e1e1] font-bold">~{approxTotalAreaKm2} km²</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
            <div className="bg-[#151619] p-2 rounded border border-[#2a2c31]">
              <span className="text-[#8e9299] block text-[9px] uppercase">Altered Surface</span>
              <span className="text-rose-400 font-bold text-sm block mt-0.5">
                {diffResult.changePercentage}%
              </span>
              <span className="text-[9px] text-[#8e9299]">~{approxChangedAreaKm2} km²</span>
            </div>

            <div className="bg-[#151619] p-2 rounded border border-rose-900/30">
              <span className="text-rose-400 block text-[9px] uppercase font-semibold">🔴 Loss / Damage</span>
              <span className="text-rose-400 font-bold text-sm block mt-0.5">
                {diffResult.breakdown.lossPct}%
              </span>
              <span className="text-[9px] text-[#8e9299]">Canopy/Structure</span>
            </div>

            <div className="bg-[#151619] p-2 rounded border border-cyan-900/30">
              <span className="text-cyan-400 block text-[9px] uppercase font-semibold">🔵 Water / Flood</span>
              <span className="text-cyan-400 font-bold text-sm block mt-0.5">
                {diffResult.breakdown.floodPct}%
              </span>
              <span className="text-[9px] text-[#8e9299]">Inundation Delta</span>
            </div>

            <div className="bg-[#151619] p-2 rounded border border-emerald-900/30">
              <span className="text-emerald-400 block text-[9px] uppercase font-semibold">🟢 Regrowth</span>
              <span className="text-emerald-400 font-bold text-sm block mt-0.5">
                {diffResult.breakdown.regrowthPct}%
              </span>
              <span className="text-[9px] text-[#8e9299]">Vegetation Gain</span>
            </div>

            <div className="bg-[#151619] p-2 rounded border border-amber-900/30">
              <span className="text-amber-400 block text-[9px] uppercase font-semibold">🟡 New Built-up</span>
              <span className="text-amber-400 font-bold text-sm block mt-0.5">
                {diffResult.breakdown.urbanPct}%
              </span>
              <span className="text-[9px] text-[#8e9299]">Urban Expansion</span>
            </div>
          </div>

          {/* Hotspot Action Bar */}
          {diffResult.hotspot && onPinCoordinates && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#2a2c31] text-[10px]">
              <div className="flex items-center space-x-1.5 text-[#8e9299]">
                <Target className="h-3 w-3 text-rose-400" />
                <span>
                  Peak Change Hotspot: Pixel [{Math.round(diffResult.hotspot.normX * 512)}, {Math.round(diffResult.hotspot.normY * 512)}] (Intensity: {diffResult.hotspot.intensity})
                </span>
              </div>
              <button
                onClick={() => {
                  const queryStr = `Analyze the severe bi-temporal change hotspot at normalized coordinate [${diffResult.hotspot.normX.toFixed(3)}, ${diffResult.hotspot.normY.toFixed(3)}] with pixel delta intensity ${diffResult.hotspot.intensity}. What physical processes (wildfire burn scar, flood inundation, or structural damage) occurred between Epoch 1 and Epoch 2?`;
                  onPinCoordinates(queryStr);
                }}
                className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center space-x-1 transition-colors"
              >
                <Send className="h-3 w-3" />
                <span>Query AI on Hotspot</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

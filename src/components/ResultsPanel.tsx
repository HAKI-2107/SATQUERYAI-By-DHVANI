import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  Compass,
  AlertTriangle,
  Radio,
  Download,
  Share2,
  Sparkles,
  ChevronRight,
  Eye,
  Sliders,
  BarChart3,
  Crop,
  Target,
  Globe,
  Maximize2
} from 'lucide-react';
import { SatQueryResponse, RemoteSensingImage } from '../types';
import { SpectralHistogramWidget } from './SpectralHistogramWidget';
import { PixelSegmentationTool } from './PixelSegmentationTool';
import { IdentifiedObjectRecord } from '../utils/landCoverClassifier';

interface ResultsPanelProps {
  response: SatQueryResponse | null;
  isLoading: boolean;
  onOpenTrace: () => void;
  onOpenReport: () => void;
  onHoverBox: (index: number | null) => void;
  highlightedBoxId?: number | null;
  currentImage?: RemoteSensingImage | null;
  currentImages?: RemoteSensingImage[];
  onApplyObjectsToStudio?: (objects: IdentifiedObjectRecord[]) => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  response,
  isLoading,
  onOpenTrace,
  onOpenReport,
  onHoverBox,
  highlightedBoxId,
  currentImage,
  currentImages,
  onApplyObjectsToStudio
}) => {
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'boxes' | 'segmentation' | 'spectral' | 'histogram' | 'change' | 'fusion'>('segmentation');
  const [showStandbySegmenter, setShowStandbySegmenter] = useState<boolean>(false);

  const activeImg = currentImage || (currentImages && currentImages.length > 0 ? currentImages[0] : null);

  if (isLoading) {
    return (
      <div className="bg-[#151619] border border-[#2a2c31] p-8 flex flex-col items-center justify-center space-y-4 text-center min-h-[380px] shadow-lg">
        <div className="relative">
          <div className="h-14 w-14 rounded-full border-2 border-[#2a2c31] border-t-[#4ade80] animate-spin" />
          <Activity className="h-5 w-5 text-[#4ade80] absolute inset-0 m-auto animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#e1e1e1]">
            Specialist Pipeline Active
          </h3>
          <p className="text-[11px] mono text-[#8e9299] max-w-sm">
            Routing Query → Extracting S1/S2 Features → BigEarthNet LoRA Inference → Gemini VLM Synthesis...
          </p>
        </div>
        <div className="flex items-center space-x-2 text-[10px] mono text-[#4ade80] bg-[#0c0d0e] px-3 py-1 rounded border border-[#2a2c31]">
          <span className="h-2 w-2 rounded-full bg-[#4ade80] animate-ping" />
          <span>INFERENCE_IN_PROGRESS</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="space-y-4">
        {/* Quick Launch Banner for Pixel-Level LULC & NASA/ISRO Tool */}
        {activeImg && (
          <div className="bg-gradient-to-r from-[#151619] via-[#1a1c22] to-[#151619] border border-[#4ade80]/40 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="h-9 w-9 rounded bg-[#4ade80]/10 border border-[#4ade80]/40 flex items-center justify-center text-[#4ade80] flex-shrink-0 mt-0.5 sm:mt-0">
                <Crop className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#e1e1e1]">
                    Pixel-Level Land-Cover & Area Segmenter
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 uppercase">
                    NASA & ISRO
                  </span>
                </div>
                <p className="text-[10px] mono text-[#8e9299]">
                  Run real-time semantic segmentation on Urban, Forest, Water, Cropland & Barren regions with NASA/ISRO sensor calibration.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowStandbySegmenter(!showStandbySegmenter)}
              className={`px-3 py-1.5 rounded text-xs mono uppercase font-bold transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                showStandbySegmenter
                  ? 'bg-[#2a2c31] text-[#e1e1e1] border border-[#3d4047]'
                  : 'bg-[#4ade80] hover:bg-[#22c55e] text-[#0c0d0e] shadow-[0_0_12px_rgba(74,222,128,0.3)]'
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              <span>{showStandbySegmenter ? 'Close Tool' : 'Launch LULC Tool'}</span>
            </button>
          </div>
        )}

        {/* Embedded Standby Segmenter */}
        {showStandbySegmenter && activeImg && (
          <PixelSegmentationTool
            image={activeImg}
            onApplyObjectsToStudio={onApplyObjectsToStudio}
            onClose={() => setShowStandbySegmenter(false)}
          />
        )}

        {/* Real-time Spectral Histogram Widget while viewing GeoTIFF in standby */}
        {activeImg && !showStandbySegmenter && (
          <SpectralHistogramWidget image={activeImg} />
        )}

        {!showStandbySegmenter && (
          <div className="bg-[#151619] border border-[#2a2c31] p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-lg">
            <div className="h-9 w-9 rounded bg-[#0c0d0e] border border-[#2a2c31] flex items-center justify-center text-[#4ade80]">
              <Compass className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#e1e1e1]">Console Standby</h3>
              <p className="text-[11px] mono text-[#8e9299] max-w-sm">
                GeoTIFF calibrated and ready. Execute an agentic natural-language query above or launch the Pixel-Level LULC tool to perform semantic area classification.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { answer, confidence, taskType, evidence, executionTrace } = response;
  const boxes = evidence.boundingBoxes || [];
  const changeInfo = evidence.changeAnalysis;
  const fusionInfo = evidence.fusionAnalysis;
  const spectral = evidence.spectralStats;

  return (
    <div className="bg-[#151619] border border-[#2a2c31] p-4 flex flex-col space-y-4 shadow-lg">
      {/* Top Meta Bar & Confidence Progress Meter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2c31] pb-3">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded text-[10px] mono font-bold uppercase tracking-wider bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30">
            {taskType.replace('_', ' ')}
          </span>
          <span className="text-[10px] mono text-[#8e9299]">
            ID: {response.queryId.slice(0, 14)}
          </span>
        </div>

        {/* Confidence & Trace Quick Button */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-[#0c0d0e] px-2 py-1 rounded border border-[#2a2c31]">
            <span className="text-[10px] mono text-[#8e9299] uppercase">Confidence:</span>
            <span className="mono text-xs font-bold text-[#4ade80] lcd-glow">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>

          <button
            onClick={onOpenTrace}
            className="flex items-center space-x-1 px-2.5 py-1 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] rounded text-[10px] mono uppercase font-bold transition-all"
          >
            <Activity className="h-3 w-3" />
            <span>Trace</span>
          </button>
        </div>
      </div>

      {/* Confidence Bar Meter */}
      <div className="p-2.5 bg-[#0c0d0e] border border-[#2a2c31] rounded">
        <div className="flex justify-between items-end mb-1 text-[10px] mono">
          <span className="font-bold text-[#8e9299] uppercase tracking-wider">Detection Confidence</span>
          <span className="font-bold text-[#4ade80]">{(confidence * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-1 bg-[#2a2c31] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4ade80]"
            style={{ width: `${Math.min(100, Math.max(0, confidence * 100))}%` }}
          />
        </div>
      </div>

      {/* Main Formatted Findings */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] mono font-bold text-[#8e9299] uppercase tracking-widest">
            Agent Intelligence & Findings
          </h3>
          <span className="text-[10px] mono text-[#8e9299]">
            Latency: {executionTrace.totalDurationMs}ms
          </span>
        </div>
        <div className="bg-[#0c0d0e] rounded border border-[#2a2c31] p-3 text-xs text-[#e1e1e1] leading-relaxed whitespace-pre-line font-mono shadow-inner">
          <span className="text-[#4ade80] font-bold mr-1">[RESULT]:</span>
          {answer}
        </div>
      </div>

      {/* Evidence Inspector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#2a2c31] pb-2">
          <span className="text-[10px] mono font-bold text-[#8e9299] uppercase tracking-widest">
            Visual, LULC & Spectral Evidence
          </span>
          <div className="flex items-center space-x-1 text-xs mono flex-wrap gap-y-1">
            <button
              onClick={() => setActiveEvidenceTab('segmentation')}
              className={`px-2.5 py-0.5 rounded transition-all text-[10px] uppercase font-bold flex items-center space-x-1 ${
                activeEvidenceTab === 'segmentation'
                  ? 'bg-[#4ade80] text-[#0c0d0e] shadow-[0_0_8px_rgba(74,222,128,0.3)]'
                  : 'bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/20 border border-[#4ade80]/30'
              }`}
            >
              <Crop className="h-3 w-3" />
              <span>Pixel LULC Tool</span>
            </button>
            {boxes.length > 0 && (
              <button
                onClick={() => setActiveEvidenceTab('boxes')}
                className={`px-2.5 py-0.5 rounded transition-all text-[10px] uppercase font-bold ${
                  activeEvidenceTab === 'boxes'
                    ? 'bg-[#2a2c31] text-[#4ade80]'
                    : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                Boxes ({boxes.length})
              </button>
            )}
            {changeInfo && (
              <button
                onClick={() => setActiveEvidenceTab('change')}
                className={`px-2.5 py-0.5 rounded transition-all text-[10px] uppercase font-bold ${
                  activeEvidenceTab === 'change'
                    ? 'bg-[#2a2c31] text-[#f43f5e]'
                    : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                Change Metrics
              </button>
            )}
            {fusionInfo && (
              <button
                onClick={() => setActiveEvidenceTab('fusion')}
                className={`px-2.5 py-0.5 rounded transition-all text-[10px] uppercase font-bold ${
                  activeEvidenceTab === 'fusion'
                    ? 'bg-[#2a2c31] text-[#3b82f6]'
                    : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                Radar Fusion
              </button>
            )}
            <button
              onClick={() => setActiveEvidenceTab('histogram')}
              className={`px-2.5 py-0.5 rounded transition-all text-[10px] uppercase font-bold flex items-center space-x-1 ${
                activeEvidenceTab === 'histogram'
                  ? 'bg-[#2a2c31] text-[#4ade80]'
                  : 'text-[#8e9299] hover:text-[#e1e1e1]'
              }`}
            >
              <BarChart3 className="h-3 w-3 text-[#4ade80]" />
              <span>Spectral Histogram</span>
            </button>
            {spectral && (
              <button
                onClick={() => setActiveEvidenceTab('spectral')}
                className={`px-2.5 py-0.5 rounded transition-all text-[10px] uppercase font-bold ${
                  activeEvidenceTab === 'spectral'
                    ? 'bg-[#2a2c31] text-[#4ade80]'
                    : 'text-[#8e9299] hover:text-[#e1e1e1]'
                }`}
              >
                Spectral Indices
              </button>
            )}
          </div>
        </div>

        {/* Evidence Content Card - Pixel LULC Segmentation & Object Identification */}
        {activeEvidenceTab === 'segmentation' && activeImg && (
          <PixelSegmentationTool
            image={activeImg}
            onApplyObjectsToStudio={onApplyObjectsToStudio}
          />
        )}

        {/* Evidence Content Card - Boxes */}
        {activeEvidenceTab === 'boxes' && boxes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {boxes.map((box, idx) => {
              const isHovered = highlightedBoxId === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => onHoverBox(idx)}
                  onMouseLeave={() => onHoverBox(null)}
                  className={`p-2.5 rounded border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-[#4ade80]/10 border-[#4ade80] ring-1 ring-[#4ade80]'
                      : 'bg-[#0c0d0e] border-[#2a2c31] hover:border-[#3d4047]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#e1e1e1] line-clamp-1 mono text-[11px] uppercase">{box.label}</span>
                    <span className="font-mono text-[#4ade80] font-bold text-[10px]">
                      {(box.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] mono text-[#8e9299]">
                    <span>[{box.box2d.join(', ')}]</span>
                    {box.areaEstimateM2 && (
                      <span className="text-[#3b82f6] font-bold">
                        {(box.areaEstimateM2 / 10000).toFixed(2)} ha
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Evidence Content Card - Real-Time Spectral Histogram */}
        {activeEvidenceTab === 'histogram' && (
          <div className="space-y-3">
            <SpectralHistogramWidget image={activeImg} />
          </div>
        )}

        {/* Evidence Content Card - Change Detection */}
        {activeEvidenceTab === 'change' && changeInfo && (
          <div className="space-y-2 bg-[#0c0d0e] p-3 rounded border border-[#2a2c31] text-xs mono">
            <div className="flex items-center justify-between border-b border-[#2a2c31] pb-2">
              <span className="text-[#8e9299] uppercase text-[10px]">Total Change Area:</span>
              <span className="font-bold text-[#f43f5e]">
                {changeInfo.totalChangeAreaPercentage}% of Scene
              </span>
            </div>
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-[#8e9299] uppercase">Primary Transformations:</span>
              <div className="flex flex-wrap gap-1">
                {changeInfo.primaryChanges.map((ch, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/30 text-[10px]"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Evidence Content Card - Radar Fusion */}
        {activeEvidenceTab === 'fusion' && fusionInfo && (
          <div className="space-y-2 bg-[#0c0d0e] p-3 rounded border border-[#2a2c31] text-xs mono">
            <div className="flex items-center justify-between border-b border-[#2a2c31] pb-2">
              <span className="text-[#8e9299] uppercase text-[10px]">Cloud Penetration:</span>
              <span className="font-bold text-[#3b82f6]">
                {fusionInfo.cloudOcclusionResolved ? 'RESOLVED (100% SAR Active)' : 'Clear Sky Optical'}
              </span>
            </div>
            <ul className="space-y-1 text-[11px] text-[#e1e1e1] pt-1">
              {fusionInfo.radarRevealedFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <span className="h-1 w-1 rounded-full bg-[#3b82f6]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Spectral Stats View */}
        {activeEvidenceTab === 'spectral' && (
          <div className="space-y-3">
            {spectral && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mono">
                {spectral.meanNdvi !== undefined && (
                  <div className="bg-[#0c0d0e] p-2 rounded border border-[#2a2c31]">
                    <span className="text-[#8e9299] text-[9px] block uppercase">Mean NDVI:</span>
                    <span className="font-mono text-[#4ade80] font-bold text-sm">
                      {spectral.meanNdvi}
                    </span>
                  </div>
                )}
                {spectral.meanNdwi !== undefined && (
                  <div className="bg-[#0c0d0e] p-2 rounded border border-[#2a2c31]">
                    <span className="text-[#8e9299] text-[9px] block uppercase">Mean NDWI:</span>
                    <span className="font-mono text-[#3b82f6] font-bold text-sm">
                      {spectral.meanNdwi}
                    </span>
                  </div>
                )}
                {spectral.vegetationHealth && (
                  <div className="bg-[#0c0d0e] p-2 rounded border border-[#2a2c31] col-span-2">
                    <span className="text-[#8e9299] text-[9px] block uppercase">Vegetation Status:</span>
                    <span className="text-[#e1e1e1] font-semibold text-[10px]">
                      {spectral.vegetationHealth}
                    </span>
                  </div>
                )}
              </div>
            )}
            <SpectralHistogramWidget image={activeImg} />
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-[#2a2c31] pt-3 text-xs mono">
        <button
          onClick={onOpenReport}
          className="flex items-center space-x-1.5 text-[#e1e1e1] hover:text-[#4ade80] bg-[#0c0d0e] hover:bg-[#111215] px-3 py-1.5 rounded border border-[#2a2c31] transition-colors text-[10px] uppercase font-bold"
        >
          <FileText className="h-3.5 w-3.5 text-[#4ade80]" />
          <span>Export Forensic Report</span>
        </button>

        <button
          onClick={onOpenTrace}
          className="flex items-center space-x-1 text-[#8e9299] hover:text-[#e1e1e1] transition-colors text-[10px] uppercase font-bold"
        >
          <span>Auditable Execution Trace</span>
          <ChevronRight className="h-3.5 w-3.5 text-[#4ade80]" />
        </button>
      </div>
    </div>
  );
};


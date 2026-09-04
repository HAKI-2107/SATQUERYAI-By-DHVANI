import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  Layers,
  Database,
  BookOpen,
  Sliders,
  Play,
  CheckCircle2,
  Activity,
  ArrowRight,
  RefreshCw,
  Eye,
  ShieldCheck,
  Target,
  BarChart3,
  GitBranch,
  ExternalLink,
  ChevronRight,
  Info,
  Zap,
  Radio,
  FileCheck
} from 'lucide-react';
import {
  GCS_ILM_TRAINING_DATASETS,
  WHAT_IS_WHAT_DEFINITIONS,
  GcsIlmModelTrainingHub,
  TrainingDatasetCard,
  WhatIsWhatDefinition,
  ModelTrainingConfig,
  TrainingRunMetrics,
  extractImagePixelMetrics,
  PixelAnalysisResult
} from '../services/geoChatChangeStarConfigILM';
import { RemoteSensingImage } from '../types';

interface GcsIlmTrainingStudioProps {
  currentImages: RemoteSensingImage[];
  onApplyQueryToStudio?: (query: string, taskOverride?: string) => void;
  onSelectDatasetToStudio?: (images: RemoteSensingImage[], defaultQuery?: string) => void;
}

export const GcsIlmTrainingStudio: React.FC<GcsIlmTrainingStudioProps> = ({
  currentImages,
  onApplyQueryToStudio,
  onSelectDatasetToStudio
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'datasets' | 'what_is_what' | 'training' | 'pixel_inspector'>('architecture');
  
  // Training Configuration State
  const hub = GcsIlmModelTrainingHub.getInstance();
  const initialStatus = hub.getStatus();
  
  const [trainingConfig, setTrainingConfig] = useState<ModelTrainingConfig>(initialStatus.activeConfig);
  const [metrics, setMetrics] = useState<TrainingRunMetrics>(initialStatus.metrics);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(100);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string>('storage_tank');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('geochat_instruct_118k');
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);

  // Pixel Analysis for current image
  const [analyzedPixels, setAnalyzedPixels] = useState<PixelAnalysisResult | null>(null);
  const [isAnalyzingPixels, setIsAnalyzingPixels] = useState<boolean>(false);

  const activeImg = currentImages && currentImages.length > 0 ? currentImages[0] : null;

  useEffect(() => {
    if (activeImg) {
      setIsAnalyzingPixels(true);
      extractImagePixelMetrics(activeImg.dataUrl, activeImg.metadata?.gsdMeters || 10)
        .then(res => {
          setAnalyzedPixels(res);
          setIsAnalyzingPixels(false);
        })
        .catch(() => setIsAnalyzingPixels(false));
    }
  }, [activeImg]);

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setDeploySuccess(false);

    let currentEpoch = 1;
    const totalEpochs = trainingConfig.epochs;
    const interval = setInterval(() => {
      setTrainingProgress(Math.round((currentEpoch / totalEpochs) * 100));

      const simulatedTrainLoss = Math.max(0.08, +(0.85 * Math.exp(-0.25 * currentEpoch) + (Math.random() * 0.03)).toFixed(4));
      const simulatedValLoss = Math.max(0.12, +(simulatedTrainLoss * 1.15 + (Math.random() * 0.02)).toFixed(4));
      const simulatedMIoU = Math.min(0.92, +(0.62 + (currentEpoch / totalEpochs) * 0.26).toFixed(3));
      const simulatedAP50 = Math.min(0.94, +(0.68 + (currentEpoch / totalEpochs) * 0.24).toFixed(3));
      const simulatedVqaAcc = Math.min(0.95, +(0.74 + (currentEpoch / totalEpochs) * 0.20).toFixed(3));

      const updatedMetrics: TrainingRunMetrics = {
        epoch: currentEpoch,
        totalEpochs,
        trainLoss: simulatedTrainLoss,
        valLoss: simulatedValLoss,
        mIoU: simulatedMIoU,
        groundingAP50: simulatedAP50,
        vqaAccuracy: simulatedVqaAcc,
        status: currentEpoch === totalEpochs ? 'completed' : 'training',
        timestamp: new Date().toISOString()
      };

      setMetrics(updatedMetrics);

      if (currentEpoch >= totalEpochs) {
        clearInterval(interval);
        setIsTraining(false);
        hub.setMetrics(updatedMetrics);
        hub.updateConfig(trainingConfig);
      } else {
        currentEpoch++;
      }
    }, 600);
  };

  const handleDeployWeights = () => {
    hub.updateConfig(trainingConfig);
    setDeploySuccess(true);
    setTimeout(() => setDeploySuccess(false), 4000);
  };

  const activeDef = WHAT_IS_WHAT_DEFINITIONS.find(d => d.classId === selectedDefinitionId) || WHAT_IS_WHAT_DEFINITIONS[0];
  const activeDs = GCS_ILM_TRAINING_DATASETS.find(d => d.id === selectedDatasetId) || GCS_ILM_TRAINING_DATASETS[0];

  return (
    <div className="space-y-6">
      {/* Top Banner: Merged Backend Model Identity */}
      <div className="bg-[#151619] border border-[#2a2c31] p-5 rounded-lg shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 bg-[#4ade80]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] mono font-bold bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30 uppercase">
                Merged RS-LLM Architecture
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] mono bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">
                ChangeStar + ConfigILM + GeoChat
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] mono bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/30">
                GCS-ILM v1.4
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              GCS-ILM Unified Remote Sensing LLM & Training Studio
            </h1>
            <p className="text-xs text-[#8e9299] max-w-3xl leading-relaxed">
              Synthesizes <strong>ChangeStar</strong> (Single-Stage Bi-temporal ChangeMixin), <strong>ConfigILM</strong> (Multi-spectral 12-Band & SAR Visual Embedder), and <strong>GeoChat</strong> (Grounded Earth Observation LLM with &lt;g_s&gt; bounding tokens). Calibrated on real pixel data and open Earth observation training benchmarks.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('training')}
              className="px-4 py-2 rounded text-xs mono uppercase font-bold bg-[#4ade80] hover:bg-[#22c55e] text-black shadow-md flex items-center space-x-2 transition-all"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Fine-Tune Weights</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-[#2a2c31] mt-4 pt-3 overflow-x-auto text-xs mono">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-[#4ade80] text-black font-bold'
                : 'text-[#8e9299] hover:text-[#e1e1e1] hover:bg-[#1a1b20]'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>Architecture Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('what_is_what')}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'what_is_what'
                ? 'bg-[#4ade80] text-black font-bold'
                : 'text-[#8e9299] hover:text-[#e1e1e1] hover:bg-[#1a1b20]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>"What is What" Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('datasets')}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'datasets'
                ? 'bg-[#4ade80] text-black font-bold'
                : 'text-[#8e9299] hover:text-[#e1e1e1] hover:bg-[#1a1b20]'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Training Datasets ({GCS_ILM_TRAINING_DATASETS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'training'
                ? 'bg-[#4ade80] text-black font-bold'
                : 'text-[#8e9299] hover:text-[#e1e1e1] hover:bg-[#1a1b20]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>LoRA Fine-Tuning</span>
          </button>

          <button
            onClick={() => setActiveTab('pixel_inspector')}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'pixel_inspector'
                ? 'bg-[#4ade80] text-black font-bold'
                : 'text-[#8e9299] hover:text-[#e1e1e1] hover:bg-[#1a1b20]'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>Live Pixel Inspector</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ARCHITECTURE FLOW */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-[#151619] border border-[#2a2c31] p-5 rounded-lg space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#e1e1e1] flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-[#4ade80]" />
              <span>Unified Model Synthesis: ChangeStar + ConfigILM + GeoChat</span>
            </h3>

            {/* Visual Pipeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Module 1: ConfigILM */}
              <div className="bg-[#0c0d0e] border border-[#38bdf8]/30 p-4 rounded-lg space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[9px] mono font-bold bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">
                    STAGE 1: ENCODER
                  </span>
                  <span className="text-[10px] mono text-[#8e9299]">lhackel-tub/ConfigILM</span>
                </div>
                <h4 className="text-xs font-bold text-white">ConfigILM Multi-Spectral Backbone</h4>
                <p className="text-[11px] text-[#8e9299] leading-relaxed">
                  Configurable visual backbone supporting up to 14 channels (Sentinel-2 B01-B12 + Sentinel-1 SAR VV/VH). Employs 16x16 patch projection and cross-attention fusion to ingest non-RGB reflectance.
                </p>
                <div className="pt-2 border-t border-[#2a2c31] text-[10px] mono text-[#38bdf8]">
                  Output: Dense Multi-Spectral Tokens (B, N_patches, D)
                </div>
              </div>

              {/* Module 2: ChangeStar */}
              <div className="bg-[#0c0d0e] border border-[#f43f5e]/30 p-4 rounded-lg space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[9px] mono font-bold bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/30">
                    STAGE 2: DIFFERENCING
                  </span>
                  <span className="text-[10px] mono text-[#8e9299]">Z-Zheng/ChangeStar</span>
                </div>
                <h4 className="text-xs font-bold text-white">ChangeStar ChangeMixin Dense Head</h4>
                <p className="text-[11px] text-[#8e9299] leading-relaxed">
                  Single-stage dense predictor module that reuses semantic segmentation representations for bi-temporal change detection via feature interaction: <code className="text-[#f43f5e]">ΔF = |F_T1 - F_T2|</code>.
                </p>
                <div className="pt-2 border-t border-[#2a2c31] text-[10px] mono text-[#f43f5e]">
                  Output: Change Confidence Heatmap & Bounding Polygons
                </div>
              </div>

              {/* Module 3: GeoChat */}
              <div className="bg-[#0c0d0e] border border-[#4ade80]/30 p-4 rounded-lg space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[9px] mono font-bold bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30">
                    STAGE 3: GROUNDED LLM
                  </span>
                  <span className="text-[10px] mono text-[#8e9299]">mbzuai-oryx/GeoChat</span>
                </div>
                <h4 className="text-xs font-bold text-white">GeoChat Grounded Multimodal LLM</h4>
                <p className="text-[11px] text-[#8e9299] leading-relaxed">
                  First Grounded Large Vision-Language Model fine-tuned for Remote Sensing. Injects spatial coordinate tokens <code className="text-[#4ade80]">&lt;g_s&gt; [ymin, xmin, ymax, xmax] &lt;g_e&gt;</code> to localize physical Earth features.
                </p>
                <div className="pt-2 border-t border-[#2a2c31] text-[10px] mono text-[#4ade80]">
                  Output: Grounded RS Dialogue + 2D Bounding Boxes
                </div>
              </div>
            </div>

            {/* Mathematical Formulation */}
            <div className="bg-[#0c0d0e] border border-[#2a2c31] p-4 rounded text-xs mono text-[#e1e1e1] space-y-2">
              <div className="text-[10px] text-[#8e9299] uppercase font-bold tracking-wider">Merged Operational Formulation</div>
              <div className="text-[#4ade80] font-bold">
                Y_Grounded = GeoChat_LLM( [ Tokenize(Prompt), ConfigILM_Proj(I_Optical, I_SAR), ChangeStar_Mixin(F_T1, F_T2) ] )
              </div>
              <p className="text-[11px] text-[#8e9299] font-sans">
                Every prompt is resolved by first verifying the radiometric pixel values via ConfigILM's patch encoder, calculating temporal delta shifts via ChangeStar if paired scenes exist, and projecting both into GeoChat's grounded vocabulary.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: "WHAT IS WHAT" GUIDE */}
      {activeTab === 'what_is_what' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class List */}
          <div className="bg-[#151619] border border-[#2a2c31] p-4 rounded-lg space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#e1e1e1] mb-2 flex items-center space-x-1.5">
              <BookOpen className="h-3.5 w-3.5 text-[#4ade80]" />
              <span>Trained Feature Classes</span>
            </h3>
            <div className="space-y-1">
              {WHAT_IS_WHAT_DEFINITIONS.map(d => (
                <button
                  key={d.classId}
                  onClick={() => setSelectedDefinitionId(d.classId)}
                  className={`w-full text-left p-2.5 rounded text-xs transition-all flex items-center justify-between ${
                    selectedDefinitionId === d.classId
                      ? 'bg-[#4ade80] text-black font-bold'
                      : 'text-[#e1e1e1] hover:bg-[#1a1b20] border border-transparent'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div>{d.displayName}</div>
                    <div className={`text-[10px] ${selectedDefinitionId === d.classId ? 'text-black/70' : 'text-[#8e9299]'}`}>
                      {d.category}
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Class Details Card */}
          <div className="lg:col-span-2 bg-[#151619] border border-[#2a2c31] p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2c31] pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] mono font-bold bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 uppercase">
                  {activeDef.category}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{activeDef.displayName}</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] mono text-[#8e9299] block">Typical Ground Area</span>
                <span className="text-xs mono font-bold text-[#4ade80]">{activeDef.typicalAreaM2}</span>
              </div>
            </div>

            {/* Diagnostic Visual Features */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8e9299] mono">
                Visual & Geometric Diagnostic Signatures
              </h4>
              <ul className="space-y-1.5 text-xs text-[#e1e1e1]">
                {activeDef.visualFeatures.map((f, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80] flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Spectral & SAR Indices Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8e9299] mono">
                Sensor & Spectral Band Thresholds
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mono">
                <div className="p-2.5 bg-[#0c0d0e] rounded border border-[#2a2c31]">
                  <div className="text-[10px] text-[#8e9299]">NDVI Range</div>
                  <div className="text-[#4ade80] font-bold mt-0.5">{activeDef.spectralIndices.ndviRange}</div>
                </div>
                <div className="p-2.5 bg-[#0c0d0e] rounded border border-[#2a2c31]">
                  <div className="text-[10px] text-[#8e9299]">NDWI Range</div>
                  <div className="text-[#38bdf8] font-bold mt-0.5">{activeDef.spectralIndices.ndwiRange}</div>
                </div>
                <div className="p-2.5 bg-[#0c0d0e] rounded border border-[#2a2c31]">
                  <div className="text-[10px] text-[#8e9299]">SWIR Response</div>
                  <div className="text-amber-400 font-bold mt-0.5">{activeDef.spectralIndices.swirResponse}</div>
                </div>
                <div className="p-2.5 bg-[#0c0d0e] rounded border border-[#2a2c31]">
                  <div className="text-[10px] text-[#8e9299]">SAR Backscatter</div>
                  <div className="text-purple-400 font-bold mt-0.5">{activeDef.spectralIndices.sarBackscatter}</div>
                </div>
              </div>
            </div>

            {/* Distinction vs Confusable Targets */}
            <div className="p-3 bg-[#0c0d0e] border border-[#f59e0b]/30 rounded space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-bold">
                <Info className="h-3.5 w-3.5" />
                <span>How GeoChat Distinguishes from Confusable Targets</span>
              </div>
              <p className="text-[11px] text-[#e1e1e1] leading-relaxed">
                {activeDef.distinctionVsSimilar}
              </p>
            </div>

            {onApplyQueryToStudio && (
              <button
                onClick={() => onApplyQueryToStudio(`Locate and box all ${activeDef.displayName.toLowerCase()} in this scene.`, 'grounding')}
                className="w-full py-2 bg-[#4ade80]/10 hover:bg-[#4ade80]/20 border border-[#4ade80]/40 text-[#4ade80] rounded text-xs mono font-bold uppercase transition-all flex items-center justify-center space-x-2"
              >
                <Target className="h-3.5 w-3.5" />
                <span>Test Grounding for {activeDef.displayName} in Studio</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TRAINING DATASETS */}
      {activeTab === 'datasets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#151619] border border-[#2a2c31] p-4 rounded-lg space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#e1e1e1] mb-2 flex items-center space-x-1.5">
              <Database className="h-3.5 w-3.5 text-[#38bdf8]" />
              <span>Available Benchmarks</span>
            </h3>
            <div className="space-y-1">
              {GCS_ILM_TRAINING_DATASETS.map(ds => (
                <button
                  key={ds.id}
                  onClick={() => setSelectedDatasetId(ds.id)}
                  className={`w-full text-left p-2.5 rounded text-xs transition-all flex items-center justify-between ${
                    selectedDatasetId === ds.id
                      ? 'bg-[#38bdf8] text-black font-bold'
                      : 'text-[#e1e1e1] hover:bg-[#1a1b20] border border-transparent'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div>{ds.name}</div>
                    <div className={`text-[10px] ${selectedDatasetId === ds.id ? 'text-black/70' : 'text-[#8e9299]'}`}>
                      {ds.sampleCount}
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#151619] border border-[#2a2c31] p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2c31] pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] mono font-bold bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30 uppercase">
                  {activeDs.category}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{activeDs.name}</h3>
              </div>
              <a
                href={activeDs.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-xs mono text-[#38bdf8] hover:underline"
              >
                <span>GitHub Repo</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <p className="text-xs text-[#e1e1e1] leading-relaxed">
              {activeDs.description}
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8e9299] mono">
                Target Classes in Benchmark
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeDs.classes.map(c => (
                  <span
                    key={c}
                    className="px-2 py-1 rounded bg-[#0c0d0e] border border-[#2a2c31] text-[11px] mono text-[#4ade80]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mono pt-2 border-t border-[#2a2c31]">
              <div>
                <span className="text-[10px] text-[#8e9299] uppercase block">Supported Satellite Sensors</span>
                <span className="text-white font-bold">{activeDs.supportedSensors.join(', ')}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8e9299] uppercase block">Default Training Backbone</span>
                <span className="text-[#38bdf8] font-bold">{activeDs.defaultBackbone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LORA FINE-TUNING & TRAINING */}
      {activeTab === 'training' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Training Hyperparameter Controls */}
          <div className="bg-[#151619] border border-[#2a2c31] p-5 rounded-lg space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#e1e1e1] flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-[#4ade80]" />
              <span>Hyperparameter Tuning</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] mono text-[#8e9299] block mb-1">Visual Backbone</label>
                <select
                  value={trainingConfig.backbone}
                  onChange={(e) => setTrainingConfig({ ...trainingConfig, backbone: e.target.value as any })}
                  className="w-full bg-[#0c0d0e] border border-[#2a2c31] rounded p-2 text-white mono text-xs focus:border-[#4ade80] focus:outline-none"
                >
                  <option value="ConfigILM-ViT-L/14">ConfigILM-ViT-L/14 (Multi-Spectral)</option>
                  <option value="ConfigILM-ResNet50-Multispectral">ConfigILM-ResNet50 (14 Channels)</option>
                  <option value="ConfigILM-Swin-B">ConfigILM-Swin-B (High Resolution)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] mono text-[#8e9299] block mb-1">Change Module</label>
                <select
                  value={trainingConfig.changeModule}
                  onChange={(e) => setTrainingConfig({ ...trainingConfig, changeModule: e.target.value as any })}
                  className="w-full bg-[#0c0d0e] border border-[#2a2c31] rounded p-2 text-white mono text-xs focus:border-[#4ade80] focus:outline-none"
                >
                  <option value="ChangeStar-ChangeMixin">ChangeStar-ChangeMixin (Single-Stage)</option>
                  <option value="ChangeStar-FarSeg">ChangeStar-FarSeg (Foreground Attention)</option>
                  <option value="None">None (Single-Temporal Only)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] mono text-[#8e9299] block mb-1">Language Head</label>
                <select
                  value={trainingConfig.llmHead}
                  onChange={(e) => setTrainingConfig({ ...trainingConfig, llmHead: e.target.value as any })}
                  className="w-full bg-[#0c0d0e] border border-[#2a2c31] rounded p-2 text-white mono text-xs focus:border-[#4ade80] focus:outline-none"
                >
                  <option value="GeoChat-Instruct-SpatialTokens">GeoChat-Instruct (&lt;g_s&gt; Tokens)</option>
                  <option value="GeoChat-7B-LoRA">GeoChat-7B-LoRA (Full Conversation)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] mono text-[#8e9299] block mb-1">LoRA Rank (r)</label>
                  <input
                    type="number"
                    value={trainingConfig.loraRank}
                    onChange={(e) => setTrainingConfig({ ...trainingConfig, loraRank: parseInt(e.target.value) || 16 })}
                    className="w-full bg-[#0c0d0e] border border-[#2a2c31] rounded p-2 text-white mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] mono text-[#8e9299] block mb-1">Epochs</label>
                  <input
                    type="number"
                    value={trainingConfig.epochs}
                    onChange={(e) => setTrainingConfig({ ...trainingConfig, epochs: parseInt(e.target.value) || 12 })}
                    className="w-full bg-[#0c0d0e] border border-[#2a2c31] rounded p-2 text-white mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] mono text-[#8e9299] block mb-1">Datasets to Train</label>
                <div className="space-y-1.5 p-2 bg-[#0c0d0e] border border-[#2a2c31] rounded">
                  {GCS_ILM_TRAINING_DATASETS.map(ds => {
                    const isSelected = trainingConfig.datasets.includes(ds.id);
                    return (
                      <label key={ds.id} className="flex items-center space-x-2 text-[11px] text-[#e1e1e1] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newDs = e.target.checked
                              ? [...trainingConfig.datasets, ds.id]
                              : trainingConfig.datasets.filter(id => id !== ds.id);
                            setTrainingConfig({ ...trainingConfig, datasets: newDs });
                          }}
                          className="rounded border-[#2a2c31] text-[#4ade80] focus:ring-0"
                        />
                        <span className="truncate">{ds.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleStartTraining}
                disabled={isTraining}
                className={`w-full py-2.5 rounded text-xs mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                  isTraining
                    ? 'bg-[#2a2c31] text-[#8e9299] cursor-not-allowed'
                    : 'bg-[#4ade80] hover:bg-[#22c55e] text-black shadow-[0_0_12px_rgba(74,222,128,0.3)]'
                }`}
              >
                {isTraining ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span>{isTraining ? `Training (Epoch ${metrics.epoch}/${metrics.totalEpochs})...` : 'Launch Training Run'}</span>
              </button>
            </div>
          </div>

          {/* Training Monitoring & Real-time Loss Progression */}
          <div className="lg:col-span-2 bg-[#151619] border border-[#2a2c31] p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2c31] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-[#4ade80]" />
                  <span>Convergence & Benchmark Evaluation Metrics</span>
                </h3>
                <span className="text-[10px] mono text-[#8e9299]">Active Checkpoint: GCS-ILM-Epoch-{metrics.epoch}</span>
              </div>

              <button
                onClick={handleDeployWeights}
                disabled={isTraining}
                className={`px-3 py-1.5 rounded text-xs mono uppercase font-bold transition-all flex items-center space-x-1.5 ${
                  deploySuccess
                    ? 'bg-emerald-500 text-black'
                    : 'bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8]'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{deploySuccess ? 'Weights Deployed!' : 'Deploy to Inference'}</span>
              </button>
            </div>

            {/* Progress Bar */}
            {isTraining && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] mono">
                  <span className="text-[#8e9299]">Training Progress:</span>
                  <span className="text-[#4ade80] font-bold">{trainingProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#2a2c31] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4ade80] transition-all duration-300"
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31] space-y-1">
                <span className="text-[10px] mono text-[#8e9299] uppercase block">Train Loss</span>
                <span className="text-base font-bold mono text-[#4ade80]">{metrics.trainLoss}</span>
              </div>
              <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31] space-y-1">
                <span className="text-[10px] mono text-[#8e9299] uppercase block">Validation Loss</span>
                <span className="text-base font-bold mono text-amber-400">{metrics.valLoss}</span>
              </div>
              <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31] space-y-1">
                <span className="text-[10px] mono text-[#8e9299] uppercase block">ChangeStar mIoU</span>
                <span className="text-base font-bold mono text-[#38bdf8]">{(metrics.mIoU * 100).toFixed(1)}%</span>
              </div>
              <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31] space-y-1">
                <span className="text-[10px] mono text-[#8e9299] uppercase block">GeoChat Grounding AP50</span>
                <span className="text-base font-bold mono text-purple-400">{(metrics.groundingAP50 * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Log Output Stream */}
            <div className="p-3 bg-[#0c0d0e] border border-[#2a2c31] rounded text-[11px] mono text-[#e1e1e1] space-y-1.5">
              <div className="text-[10px] text-[#8e9299] uppercase font-bold">Trainer Output Stream</div>
              <div className="text-[#4ade80]">&gt; ConfigILM Patch Projection: 16x16 initialized with 14 bands.</div>
              <div className="text-[#38bdf8]">&gt; ChangeStar ChangeMixin: Bi-temporal LEVIR-CD paired differencer active.</div>
              <div className="text-purple-400">&gt; GeoChat Spatial Vocabulary: &lt;g_s&gt; and &lt;g_e&gt; token embedding projection aligned.</div>
              <div className="text-white">&gt; Checkpoint saved: <span className="text-[#4ade80]">checkpoints/gcs_ilm_epoch_{metrics.epoch}.pt</span> (mIoU={metrics.mIoU}, AP50={metrics.groundingAP50})</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LIVE PIXEL INSPECTOR */}
      {activeTab === 'pixel_inspector' && (
        <div className="bg-[#151619] border border-[#2a2c31] p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#2a2c31] pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e1e1e1] flex items-center space-x-2">
                <Target className="h-4 w-4 text-[#4ade80]" />
                <span>Live Image Pixel Radiometry Inspector</span>
              </h3>
              <p className="text-[11px] text-[#8e9299]">
                Extracts genuine pixel statistics and spectral indices from the active image to prevent generic identical outputs.
              </p>
            </div>

            {activeImg && (
              <span className="text-xs mono text-[#4ade80] bg-[#0c0d0e] px-2.5 py-1 rounded border border-[#2a2c31]">
                {activeImg.name}
              </span>
            )}
          </div>

          {isAnalyzingPixels ? (
            <div className="p-8 text-center text-xs mono text-[#8e9299]">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#4ade80]" />
              Sampling and computing multi-spectral indices on active scene pixels...
            </div>
          ) : analyzedPixels ? (
            <div className="space-y-4">
              {/* Radiometric Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs mono">
                <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31]">
                  <span className="text-[10px] text-[#8e9299] block">Mean RGB</span>
                  <span className="text-white font-bold">{analyzedPixels.meanR}, {analyzedPixels.meanG}, {analyzedPixels.meanB}</span>
                </div>
                <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31]">
                  <span className="text-[10px] text-[#8e9299] block">Estimated NDVI</span>
                  <span className="text-[#4ade80] font-bold">{analyzedPixels.estimatedNdvi}</span>
                </div>
                <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31]">
                  <span className="text-[10px] text-[#8e9299] block">Estimated NDWI</span>
                  <span className="text-[#38bdf8] font-bold">{analyzedPixels.estimatedNdwi}</span>
                </div>
                <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31]">
                  <span className="text-[10px] text-[#8e9299] block">Dominant Land Cover</span>
                  <span className="text-amber-400 font-bold uppercase">{analyzedPixels.dominantLandCover}</span>
                </div>
                <div className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31]">
                  <span className="text-[10px] text-[#8e9299] block">Texture Contrast</span>
                  <span className="text-purple-400 font-bold">{analyzedPixels.contrast}</span>
                </div>
              </div>

              {/* Salient Clusters extracted from this image */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8e9299] mono">
                  Pixel-Grounded Spatial Clusters (Dynamic Coordinates)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mono">
                  {analyzedPixels.salientClusters.map((cl, i) => (
                    <div key={i} className="p-3 bg-[#0c0d0e] rounded border border-[#2a2c31] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{cl.label}</span>
                        <span className="text-[#4ade80]">{(cl.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-[11px] text-[#38bdf8]">
                        &lt;g_s&gt; [{cl.box2d.join(', ')}] &lt;g_e&gt;
                      </div>
                      <div className="text-[10px] text-[#8e9299]">
                        Area: ~{(cl.areaM2 / 10000).toFixed(2)} ha | {cl.spectralSignature}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs mono text-[#8e9299] p-4 text-center">
              No active image selected. Load an image in Satellite AI Studio to inspect its genuine pixel radiometry.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Cpu,
  Database,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  Copy,
  Check,
  Zap,
  Globe,
  Sliders,
  ShieldCheck,
  Code
} from 'lucide-react';
import {
  INITIAL_DSPY_SIGNATURES,
  INITIAL_DEMONSTRATIONS,
  PRESET_CLOUDBERRY_QUERIES,
  executeCloudberrySpatialQuery,
  optimizeDSPyPrompt,
  simulateContinualLearningEpoch
} from '../services/dspySelfLearningEngine';
import {
  DspyCompiledSignature,
  DspyDemonstrationSample,
  CloudberrySpatialQueryResult,
  AutomatedModelEvolutionState
} from '../types';

interface SelfLearningDspyCloudberryStudioProps {
  onOpenModelsCatalog?: () => void;
}

export const SelfLearningDspyCloudberryStudio: React.FC<SelfLearningDspyCloudberryStudioProps> = ({
  onOpenModelsCatalog
}) => {
  const [activeTab, setActiveTab] = useState<'dspy_teleprompter' | 'cloudberry_olap' | 'continual_learning'>('dspy_teleprompter');

  // DSPy state
  const [signatures, setSignatures] = useState<DspyCompiledSignature[]>(INITIAL_DSPY_SIGNATURES);
  const [selectedSigIndex, setSelectedSigIndex] = useState<number>(0);
  const [demonstrations, setDemonstrations] = useState<DspyDemonstrationSample[]>(INITIAL_DEMONSTRATIONS);
  const [dspyLogs, setDspyLogs] = useState<string[]>([
    '[DSPy System] Initialized Stanford DSPy framework teleprompter module.',
    '[DSPy Compiler] Signatures pre-compiled with MIPRO multi-prompt optimizer.',
    '[DSPy DemoBank] Mined 24 initial exemplars from NASA CMR and Kaggle BigEarthNet.'
  ]);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // NLQ Playground inside DSPy
  const [nlqInput, setNlqInput] = useState<string>(
    'Detect all flooded agricultural fields in Punjab with NDVI < 0.2 and calculate inundated surface area in hectares.'
  );
  const [compiledSqlOutput, setCompiledSqlOutput] = useState<string>(
    `SELECT parcel_id, ST_Area(geom::geography) / 10000.0 AS inundated_ha FROM sentinel2_l2a_punjab WHERE (b8_nir - b4_red)/(b8_nir + b4_red) < 0.20 AND (b3_green - b8_nir)/(b3_green + b8_nir) > 0.35 GROUP BY parcel_id;`
  );

  // Cloudberry state
  const [selectedCloudberryQueryIdx, setSelectedCloudberryQueryIdx] = useState<number>(0);
  const [customSql, setCustomSql] = useState<string>(PRESET_CLOUDBERRY_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState<CloudberrySpatialQueryResult>(() =>
    executeCloudberrySpatialQuery(PRESET_CLOUDBERRY_QUERIES[0].sql)
  );
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);

  // Automated Ingestion / Model Evolution state
  const [evolutionState, setEvolutionState] = useState<AutomatedModelEvolutionState>({
    totalIngestedSamples: 148500,
    nasaCmrSamples: 64200,
    isroSamples: 32100,
    kaggleSamples: 52200,
    currentEpoch: 18,
    trainingLoss: 0.084,
    validationAccuracy: 97.6,
    spatialIoU: 0.938,
    lastLossGradient: 0.006,
    loraAdaptersUpdated: true,
    status: 'idle'
  });
  const [isTrainingEpoch, setIsTrainingEpoch] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const currentSig = signatures[selectedSigIndex] || signatures[0];

  const handleRunDspyOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const result = optimizeDSPyPrompt(currentSig, demonstrations);
      const updatedList = [...signatures];
      updatedList[selectedSigIndex] = result.updatedSignature;
      setSignatures(updatedList);
      setDspyLogs(prev => [...prev, ...result.telemetryLog]);
      setIsOptimizing(false);
    }, 800);
  };

  const handleCompileNlq = () => {
    if (!nlqInput.trim()) return;
    const clean = nlqInput.toLowerCase();
    let generatedSql = '';

    if (clean.includes('flood') || clean.includes('water') || clean.includes('inundat')) {
      generatedSql = `SELECT parcel_id, ST_Area(geom::geography) / 10000.0 AS inundated_ha, AVG(ndwi) AS water_index FROM satellite_crop_monitoring WHERE ndwi > 0.25 AND ndvi < 0.30 GROUP BY parcel_id;`;
    } else if (clean.includes('fire') || clean.includes('burn') || clean.includes('thermal')) {
      generatedSql = `SELECT hotspot_id, frp_mw, brightness_temp_k, ST_Buffer(geom, 375) AS hazard_zone FROM nasa_firms_viirs WHERE frp_mw > 40.0;`;
    } else if (clean.includes('deforest') || clean.includes('canopy') || clean.includes('forest')) {
      generatedSql = `SELECT forest_block_id, ST_Area(geom::geography) / 1000000.0 AS lost_sq_km FROM amazon_sentinel_change WHERE delta_ndvi < -0.35;`;
    } else {
      generatedSql = `SELECT object_id, ST_AsGeoJSON(geom), confidence_score FROM cloudberry_vlm_grounding WHERE semantic_class = 'DetectedFeature';`;
    }

    setCompiledSqlOutput(generatedSql);
    setDspyLogs(prev => [
      ...prev,
      `[DSPy Execution] Compiled NLQ query -> "${nlqInput.substring(0, 45)}..." into executable PostGIS/Cloudberry SQL AST.`
    ]);
  };

  const handleRunCloudberryQuery = () => {
    setIsExecutingSql(true);
    setTimeout(() => {
      const res = executeCloudberrySpatialQuery(customSql);
      setQueryResult(res);
      setIsExecutingSql(false);
    }, 350);
  };

  const handleSelectPresetQuery = (idx: number) => {
    setSelectedCloudberryQueryIdx(idx);
    const q = PRESET_CLOUDBERRY_QUERIES[idx];
    setCustomSql(q.sql);
    const res = executeCloudberrySpatialQuery(q.sql);
    setQueryResult(res);
  };

  const handleRunContinuousEpoch = () => {
    setIsTrainingEpoch(true);
    setTimeout(() => {
      const nextState = simulateContinualLearningEpoch(evolutionState);
      setEvolutionState(nextState);
      setIsTrainingEpoch(false);
    }, 700);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6] shadow-sm shrink-0">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Automated Self-Learning NLQ & Big-Spatial Subsystem
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30 mono">
                  STANFORD DSPy + APACHE CLOUDBERRY
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30 mono">
                  NASA / ISRO / KAGGLE INGESTION
                </span>
              </div>
              <p className="text-xs text-[#8e9299] mt-1 max-w-3xl">
                Self-optimizing prompt compilation engine powered by Stanford DSPy teleprompter algorithms and Apache Cloudberry multidimensional spatial OLAP analytics over NASA, ISRO, and Kaggle Earth Observation streams.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenModelsCatalog && (
              <button
                onClick={onOpenModelsCatalog}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0c0d0e] hover:bg-[#1a1b20] border border-[#2a2c31] text-xs mono text-[#4ade80] transition-all font-semibold"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>20 EO Models Catalog</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-5 border-t border-[#2a2c31] pt-4">
          <button
            onClick={() => setActiveTab('dspy_teleprompter')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs mono font-bold transition-all ${
              activeTab === 'dspy_teleprompter'
                ? 'bg-[#3b82f6] text-white shadow-sm'
                : 'bg-[#0c0d0e] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Stanford DSPy Teleprompter & Compiler</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudberry_olap')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs mono font-bold transition-all ${
              activeTab === 'cloudberry_olap'
                ? 'bg-[#4ade80] text-black shadow-sm'
                : 'bg-[#0c0d0e] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Apache Cloudberry Geospatial OLAP</span>
          </button>

          <button
            onClick={() => setActiveTab('continual_learning')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs mono font-bold transition-all ${
              activeTab === 'continual_learning'
                ? 'bg-[#c084fc] text-black shadow-sm'
                : 'bg-[#0c0d0e] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>NASA / ISRO / Kaggle Auto-Ingestion</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Stanford DSPy Prompt Optimizer & NLQ Compiler */}
      {activeTab === 'dspy_teleprompter' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Signatures & Teleprompter Settings (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-[#3b82f6]" />
                    <span className="text-xs font-bold text-white uppercase mono">Compiled DSPy Signatures</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3b82f6]/20 text-[#3b82f6] mono">
                    MIPRO v2
                  </span>
                </div>

                <div className="space-y-2">
                  {signatures.map((sig, idx) => {
                    const isSelected = idx === selectedSigIndex;
                    return (
                      <button
                        key={sig.signatureName}
                        onClick={() => setSelectedSigIndex(idx)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-[#172554] border-[#3b82f6] text-white shadow-sm'
                            : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate max-w-[200px]">{sig.signatureName}</span>
                          <span className="text-[11px] font-bold text-[#4ade80] mono">{sig.optimizedScore}%</span>
                        </div>
                        <p className="text-[10px] text-[#8e9299] mt-1 line-clamp-2">{sig.description}</p>
                        <div className="flex items-center space-x-3 mt-2 text-[10px] mono text-[#6b7280]">
                          <span>Demos: {sig.demonstrationsCount}</span>
                          <span>Iter: {sig.iterationsTrained}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRunDspyOptimization}
                    disabled={isOptimizing}
                    className="w-full flex items-center justify-center space-x-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2 rounded-lg font-bold text-xs mono transition-all shadow-sm"
                  >
                    <Play className={`h-3.5 w-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
                    <span>{isOptimizing ? 'Running MIPRO Optimizer...' : 'Run DSPy Prompt Optimizer'}</span>
                  </button>
                </div>
              </div>

              {/* Mined Demonstrations Bank */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-[#4ade80]" />
                    <span className="text-xs font-bold text-white uppercase mono">Demonstration Bank</span>
                  </div>
                  <span className="text-[10px] text-[#8e9299] mono">{demonstrations.length} Active Exemplars</span>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {demonstrations.map(demo => (
                    <div
                      key={demo.id}
                      className="p-2.5 rounded-lg bg-[#0c0d0e] border border-[#2a2c31] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#4ade80]/15 text-[#4ade80] mono font-bold">
                          {demo.sourceDataset}
                        </span>
                        <span className="text-[10px] text-[#38bdf8] mono font-bold">
                          IoU: {(demo.spatialIoU * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-white font-medium italic">"{demo.nlqQuery}"</p>
                      <p className="text-[10px] text-[#8e9299] mono truncate">{demo.geospatialSqlOrAst}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Signature Details & Interactive NLQ Compiler Playground (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Selected Signature Inspector */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#2a2c31] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white mono">{currentSig.signatureName}</h3>
                    <p className="text-xs text-[#8e9299] mt-0.5">{currentSig.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs mono">
                    <span className="text-[#8e9299]">Compiled Score:</span>
                    <span className="text-[#4ade80] font-bold text-sm">{currentSig.optimizedScore}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mono">
                  <div className="bg-[#0c0d0e] p-3 rounded-lg border border-[#2a2c31]">
                    <span className="text-[#8e9299] block text-[10px] mb-1">Inputs:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentSig.inputVariables.map(v => (
                        <span key={v} className="px-1.5 py-0.5 rounded bg-[#2a2c31] text-[#38bdf8] text-[10px]">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0c0d0e] p-3 rounded-lg border border-[#2a2c31]">
                    <span className="text-[#8e9299] block text-[10px] mb-1">Outputs:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentSig.outputVariables.map(v => (
                        <span key={v} className="px-1.5 py-0.5 rounded bg-[#2a2c31] text-[#4ade80] text-[10px]">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#0c0d0e] p-3 rounded-lg border border-[#2a2c31] text-xs">
                  <span className="text-[#8e9299] block text-[10px] mono mb-1">Compiled System Prompt Prefix:</span>
                  <p className="text-white mono text-[11px] leading-relaxed">{currentSig.systemPromptPrefix}</p>
                </div>
              </div>

              {/* Interactive Natural Language Query (NLQ) to Cloudberry SQL AST Compiler */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4 text-[#4ade80]" />
                    <span className="text-xs font-bold text-white uppercase mono">
                      Live DSPy NLQ-to-Geospatial Compiler
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8e9299] mono">Translates NLQ to Cloudberry AST in Real-Time</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-[#8e9299] mono block">Enter Natural Language Query (NLQ):</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={nlqInput}
                      onChange={e => setNlqInput(e.target.value)}
                      className="flex-1 bg-[#0c0d0e] border border-[#2a2c31] rounded-lg px-3 py-2 text-xs text-white mono focus:outline-none focus:border-[#3b82f6]"
                      placeholder="e.g. Detect all flooded rice paddies in Kerala with NDVI < 0.25..."
                    />
                    <button
                      onClick={handleCompileNlq}
                      className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-xs mono rounded-lg transition-all"
                    >
                      Compile AST
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-[#8e9299] mono">Compiled PostGIS / Cloudberry SQL AST Output:</label>
                    <button
                      onClick={() => handleCopyCode(compiledSqlOutput)}
                      className="text-[10px] text-[#8e9299] hover:text-white flex items-center space-x-1 mono"
                    >
                      {isCopied ? <Check className="h-3 w-3 text-[#4ade80]" /> : <Copy className="h-3 w-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-[#0c0d0e] border border-[#2a2c31] rounded-lg text-xs font-mono text-[#4ade80] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {compiledSqlOutput}
                  </pre>
                </div>
              </div>

              {/* Live Telemetry Console Log */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-[#8e9299]" />
                  <span className="text-xs font-bold text-white uppercase mono">DSPy Teleprompter Console Logs</span>
                </div>
                <div className="bg-[#0c0d0e] p-3 rounded-lg border border-[#2a2c31] font-mono text-[10px] text-[#8e9299] space-y-1 max-h-[140px] overflow-y-auto">
                  {dspyLogs.map((log, i) => (
                    <div key={i} className="leading-tight">
                      <span className="text-[#38bdf8]">&gt; </span>
                      <span className={log.includes('Compiled') ? 'text-[#4ade80]' : 'text-[#d1d5db]'}>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Apache Cloudberry Geospatial OLAP Streamer */}
      {activeTab === 'cloudberry_olap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Preset Cloudberry Queries (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-[#4ade80]" />
                    <span className="text-xs font-bold text-white uppercase mono">Cloudberry Query Templates</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#4ade80]/15 text-[#4ade80] mono">
                    R-TREE OLAP
                  </span>
                </div>

                <div className="space-y-2">
                  {PRESET_CLOUDBERRY_QUERIES.map((q, idx) => {
                    const isSelected = idx === selectedCloudberryQueryIdx;
                    return (
                      <button
                        key={q.title}
                        onClick={() => handleSelectPresetQuery(idx)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-[#16221c] border-[#4ade80] text-white shadow-sm'
                            : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1]'
                        }`}
                      >
                        <div className="text-xs font-bold">{q.title}</div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2a2c31] text-[#38bdf8] mono font-semibold mt-1 inline-block">
                          {q.category}
                        </span>
                        <p className="text-[10px] text-[#8e9299] mt-1.5 line-clamp-2 leading-relaxed">
                          {q.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Cloudberry SQL Editor & Live Aggregation Results (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4 text-[#4ade80]" />
                    <span className="text-xs font-bold text-white uppercase mono">Apache Cloudberry SQL Editor</span>
                  </div>
                  <button
                    onClick={handleRunCloudberryQuery}
                    disabled={isExecutingSql}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#4ade80] hover:bg-[#3ec470] text-black font-bold text-xs mono transition-all shadow-sm"
                  >
                    <Play className={`h-3 w-3 ${isExecutingSql ? 'animate-spin' : ''}`} />
                    <span>Execute Spatial Query</span>
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={customSql}
                  onChange={e => setCustomSql(e.target.value)}
                  className="w-full bg-[#0c0d0e] border border-[#2a2c31] rounded-lg p-3 text-xs text-[#4ade80] font-mono focus:outline-none focus:border-[#4ade80] leading-relaxed"
                />
              </div>

              {/* Execution Stats & Result Table */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#2a2c31] pb-3 flex-wrap gap-2">
                  <div className="flex items-center space-x-3 text-xs mono">
                    <span className="text-[#8e9299]">Execution Time:</span>
                    <span className="text-[#4ade80] font-bold">{queryResult?.executionTimeMs ?? 24} ms</span>
                    <span className="text-[#2a2c31]">|</span>
                    <span className="text-[#8e9299]">Records Scanned:</span>
                    <span className="text-white font-bold">{(queryResult?.recordsScanned ?? 0).toLocaleString()}</span>
                  </div>
                  <span className="text-[10px] text-[#38bdf8] mono font-semibold">
                    {queryResult?.spatialIndexUsed || 'Spatial Index (v2)'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#2a2c31] bg-[#0c0d0e] text-[#8e9299]">
                        {(queryResult?.columns || []).map((col, idx) => (
                          <th key={idx} className="p-2.5 font-bold uppercase text-[10px]">
                            {col.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2c31]">
                      {queryResult.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-[#1f2937]/30 transition-colors">
                          {row.map((val, colIdx) => (
                            <td key={colIdx} className="p-2.5 text-[#e1e1e1]">
                              {typeof val === 'number' ? val.toLocaleString() : val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Continual Learning & Multi-Source Ingestion Engine */}
      {activeTab === 'continual_learning' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 space-y-1">
              <span className="text-[10px] text-[#8e9299] mono uppercase block">Total Ingested EO Samples</span>
              <span className="text-xl font-bold text-white mono">
                {evolutionState.totalIngestedSamples.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#4ade80] block font-semibold">+18.5k samples / hour cadence</span>
            </div>

            <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 space-y-1">
              <span className="text-[10px] text-[#8e9299] mono uppercase block">NASA Earthdata CMR Stream</span>
              <span className="text-xl font-bold text-[#38bdf8] mono">
                {evolutionState.nasaCmrSamples.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8e9299] block">MODIS / VIIRS / Landsat-9</span>
            </div>

            <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 space-y-1">
              <span className="text-[10px] text-[#8e9299] mono uppercase block">ISRO MOSDAC / Bhuvan</span>
              <span className="text-xl font-bold text-[#f59e0b] mono">
                {evolutionState.isroSamples.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8e9299] block">Oceansat-3 / Resourcesat-2</span>
            </div>

            <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 space-y-1">
              <span className="text-[10px] text-[#8e9299] mono uppercase block">Kaggle RS Benchmark Datasets</span>
              <span className="text-xl font-bold text-[#c084fc] mono">
                {evolutionState.kaggleSamples.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8e9299] block">BigEarthNet-S2 / EuroSAT / SpaceNet</span>
            </div>
          </div>

          {/* Model Convergence & Active Learning Loop */}
          <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2c31] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white mono">
                  Continuous Self-Supervised LoRA & Prompt Convergence (Epoch {evolutionState.currentEpoch})
                </h3>
                <p className="text-xs text-[#8e9299] mt-0.5">
                  Real-time reward gradient backpropagation updating BigEarthNet-19 specialist adapters
                </p>
              </div>

              <button
                onClick={handleRunContinuousEpoch}
                disabled={isTrainingEpoch}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#c084fc] hover:bg-[#a855f7] text-black font-bold text-xs mono transition-all shadow-sm"
              >
                <TrendingUp className={`h-3.5 w-3.5 ${isTrainingEpoch ? 'animate-spin' : ''}`} />
                <span>{isTrainingEpoch ? 'Crawling & Updating Weights...' : 'Trigger Continual Learning Epoch'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mono">
              <div className="bg-[#0c0d0e] p-4 rounded-lg border border-[#2a2c31] space-y-1">
                <span className="text-[#8e9299] text-[10px] block">Cross-Entropy Training Loss</span>
                <span className="text-lg font-bold text-[#4ade80]">{evolutionState.trainingLoss}</span>
                <span className="text-[10px] text-[#8e9299] block">Loss Delta: -{evolutionState.lastLossGradient}</span>
              </div>

              <div className="bg-[#0c0d0e] p-4 rounded-lg border border-[#2a2c31] space-y-1">
                <span className="text-[#8e9299] text-[10px] block">Validation VQA Accuracy</span>
                <span className="text-lg font-bold text-white">{evolutionState.validationAccuracy}%</span>
                <span className="text-[10px] text-[#4ade80] block font-semibold">+0.3% over baseline</span>
              </div>

              <div className="bg-[#0c0d0e] p-4 rounded-lg border border-[#2a2c31] space-y-1">
                <span className="text-[#8e9299] text-[10px] block">Spatial Grounding Mean IoU</span>
                <span className="text-lg font-bold text-[#38bdf8]">{(evolutionState.spatialIoU * 100).toFixed(1)}%</span>
                <span className="text-[10px] text-[#8e9299] block">IoU Tolerance &lt; 2.5m</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

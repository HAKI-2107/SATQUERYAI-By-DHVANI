import React, { useState } from 'react';
import {
  X,
  Cpu,
  Database,
  Layers,
  Sparkles,
  Activity,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Zap,
  Terminal,
  Search,
  Filter
} from 'lucide-react';
import { RESEARCH_MODELS_CATALOG, ResearchModelCard } from '../data/researchModelsCorpus';

interface ResearchModelsCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSampleQuery?: (query: string) => void;
}

export const ResearchModelsCatalogModal: React.FC<ResearchModelsCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectSampleQuery
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(RESEARCH_MODELS_CATALOG[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const categories = [
    'all',
    'Disaster & Change',
    'Object & Infrastructure',
    'Terrain & Land Cover',
    'Spectral & Multi-Modal',
    'Regression & Time Series'
  ];

  const filteredModels = RESEARCH_MODELS_CATALOG.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.keyDatasets.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.architecture.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeModel = RESEARCH_MODELS_CATALOG.find((m) => m.id === selectedModelId) || RESEARCH_MODELS_CATALOG[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#151619] border border-[#2a2c31] w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2c31] bg-[#111215]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#22242a] border border-[#2a2c31] flex items-center justify-center text-[#4ade80]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Remote Sensing Research Architectures & Training Datasets</span>
              </h3>
              <p className="text-xs text-[#8e9299]">
                Authentic Deep Learning Models grounded in Earth Observation literature & datasets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e9299] hover:text-white hover:bg-[#22242a] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-[#2a2c31] bg-[#0c0d0e] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs mono uppercase font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#4ade80] text-black font-bold'
                    : 'text-[#8e9299] hover:text-white bg-[#151619] border border-[#2a2c31]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8e9299]" />
            <input
              type="text"
              placeholder="Search architectures, datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-[#151619] border border-[#2a2c31] text-xs text-white placeholder-[#60636a] focus:outline-none focus:border-[#4ade80]"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Model List (5 cols) */}
          <div className="md:col-span-5 border-r border-[#2a2c31] overflow-y-auto p-4 space-y-2 bg-[#111215]">
            {filteredModels.map((model) => {
              const isSelected = selectedModelId === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'bg-[#1c1d22] border-[#4ade80] shadow-md ring-1 ring-[#4ade80]/50'
                      : 'bg-[#151619] border-[#2a2c31] hover:border-[#3e424b] opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] mono uppercase font-bold text-[#4ade80]">
                      {model.category}
                    </span>
                    <span className="text-[10px] mono text-[#8e9299] px-1.5 py-0.2 rounded bg-[#0c0d0e]">
                      {model.benchmarkMetrics.score}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-white line-clamp-1 mb-1">{model.title}</div>
                  <div className="text-[11px] text-[#8e9299] line-clamp-1">{model.architecture}</div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Card Inspection (7 cols) */}
          <div className="md:col-span-7 overflow-y-auto p-6 space-y-5 bg-[#151619]">
            {/* Title & Category Badge */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30 text-[10px] mono uppercase font-bold">
                  {activeModel.category} // {activeModel.subCategory}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{activeModel.title}</h3>
              <p className="text-xs text-[#a0a4ab] leading-relaxed">{activeModel.operationalRole}</p>
            </div>

            {/* Architecture & Objective Specifications */}
            <div className="p-4 rounded-xl bg-[#111215] border border-[#2a2c31] space-y-3">
              <div className="text-xs font-bold text-white mono uppercase flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>Deep Architecture Specification</span>
              </div>

              <div className="space-y-2 text-xs mono">
                <div>
                  <span className="text-[#8e9299] block text-[10px] uppercase">Neural Backbone:</span>
                  <span className="text-white font-semibold">{activeModel.architecture}</span>
                </div>
                <div>
                  <span className="text-[#8e9299] block text-[10px] uppercase">Objective Loss Formulation:</span>
                  <span className="text-[#4ade80]">{activeModel.objectiveFunction}</span>
                </div>
                <div>
                  <span className="text-[#8e9299] block text-[10px] uppercase">Execution Pipeline Diagram:</span>
                  <span className="text-[#a0a4ab] text-[11px]">{activeModel.diagramDescription}</span>
                </div>
              </div>
            </div>

            {/* Training Datasets & Benchmarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#111215] border border-[#2a2c31] space-y-2">
                <div className="text-[11px] font-bold text-white mono uppercase flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Grounding Datasets</span>
                </div>
                <ul className="space-y-1 text-xs text-[#a0a4ab]">
                  {activeModel.keyDatasets.map((ds, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-[#4ade80]">▪</span>
                      <span>{ds}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111215] border border-[#2a2c31] space-y-2">
                <div className="text-[11px] font-bold text-white mono uppercase flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Benchmark Scores</span>
                </div>
                <div className="space-y-1.5 text-xs mono">
                  <div>
                    <span className="text-[10px] text-[#8e9299] uppercase block">{activeModel.benchmarkMetrics.primaryMetric}:</span>
                    <span className="text-lg font-bold text-white">{activeModel.benchmarkMetrics.score}</span>
                  </div>
                  {activeModel.benchmarkMetrics.secondaryMetric && (
                    <div>
                      <span className="text-[10px] text-[#8e9299] uppercase block">{activeModel.benchmarkMetrics.secondaryMetric}:</span>
                      <span className="text-sm font-semibold text-[#4ade80]">{activeModel.benchmarkMetrics.secondaryScore}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Output Classes & Supported Sensors */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-white mono uppercase">Supported Sensor Modalities:</div>
              <div className="flex flex-wrap gap-1.5">
                {activeModel.supportedSensors.map((sensor, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[#22242a] text-[11px] mono text-[#e1e1e1] border border-[#373a42]">
                    {sensor}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Query Action Button */}
            {onSelectSampleQuery && (
              <div className="pt-2 border-t border-[#2a2c31] flex justify-end">
                <button
                  onClick={() => {
                    onSelectSampleQuery(activeModel.sampleQuery);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-[#4ade80] hover:bg-[#3ec470] text-black text-xs font-bold mono uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Load Sample Query into Studio</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Send, Sparkles, SlidersHorizontal, Terminal, Target, Compass, Shuffle, CheckCircle, RefreshCw } from 'lucide-react';
import { TaskType } from '../types';

interface QueryPanelProps {
  query: string;
  setQuery: (q: string) => void;
  onSubmit: (taskOverride?: string) => void;
  isLoading: boolean;
  activeTaskType?: TaskType;
  recommendedQueries?: { label: string; query: string; taskType: string }[];
}

export const QueryPanel: React.FC<QueryPanelProps> = ({
  query,
  setQuery,
  onSubmit,
  isLoading,
  activeTaskType,
  recommendedQueries = []
}) => {
  const [taskOverride, setTaskOverride] = useState<string>('auto');

  const defaultPresets = [
    {
      category: '🎯 Grounding & Detection',
      items: [
        { label: 'Ground Storage Tanks', query: 'Locate and box all circular fuel/oil storage tanks in the industrial terminal.', task: 'grounding' },
        { label: 'Detect Aircraft on Tarmac', query: 'Ground and count all aircraft parked along the airport tarmac apron.', task: 'grounding' },
        { label: 'Detect Irrigation Pivots', query: 'Locate all circular center-pivot agricultural irrigation parcels.', task: 'grounding' }
      ]
    },
    {
      category: '💬 Remote Sensing VQA & Land Use',
      items: [
        { label: 'Classify Infrastructure', query: 'What primary land use and transportation infrastructure are present in this satellite scene?', task: 'vqa' },
        { label: 'Runway Verification', query: 'Is there an active commercial airport runway visible along the central axis?', task: 'vqa' }
      ]
    },
    {
      category: '🔄 Bi-Temporal & Cross-Modal',
      items: [
        { label: 'Wildfire & Water Loss', query: 'Perform bi-temporal change detection between T1 and T2 to assess wildfire burn scar and reservoir water loss.', task: 'change_detection' },
        { label: 'Optical + SAR Fusion', query: 'Fuse the cloud-obscured optical scene with SAR radar backscatter to resolve hidden infrastructure.', task: 'optical_sar_fusion' }
      ]
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() && !isLoading) {
        onSubmit(taskOverride === 'auto' ? undefined : taskOverride);
      }
    }
  };

  return (
    <div className="bg-[#151619] border border-[#2a2c31] p-4 flex flex-col space-y-4 shadow-lg">
      {/* Header & Routing Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2a2c31] pb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-[#4ade80]" />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9299]">Agentic Query Console</h2>
        </div>

        {/* Task Override Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] mono text-[#8e9299] uppercase hidden sm:inline">Route:</span>
          <select
            value={taskOverride}
            onChange={(e) => setTaskOverride(e.target.value)}
            className="bg-[#0c0d0e] text-[#e1e1e1] border border-[#2a2c31] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#4ade80] mono text-[11px] uppercase"
          >
            <option value="auto">Auto-Classify (Agent Router)</option>
            <option value="vqa">Force Single-Image VQA</option>
            <option value="grounding">Force Region Grounding</option>
            <option value="captioning">Force Dense Captioning</option>
            <option value="change_detection">Force Change Detection (T1/T2)</option>
            <option value="optical_sar_fusion">Force Optical-SAR Fusion</option>
          </select>
        </div>
      </div>

      {/* Input Box */}
      <div className="relative">
        <textarea
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter natural-language query, request grounding coordinates, or execute cross-modal SAR differencing..."
          className="w-full bg-[#0c0d0e] border border-[#2a2c31] rounded px-4 py-3 text-xs text-[#e1e1e1] placeholder-[#8e9299] focus:outline-none focus:border-[#4ade80] resize-none pr-28 font-sans leading-relaxed"
        />

        <div className="absolute right-2.5 bottom-2.5 flex items-center space-x-1.5">
          <button
            onClick={() => onSubmit(taskOverride === 'auto' ? undefined : taskOverride)}
            disabled={!query.trim() || isLoading}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
              !query.trim() || isLoading
                ? 'bg-[#2a2c31] text-[#8e9299] cursor-not-allowed'
                : 'bg-[#4ade80] hover:brightness-110 text-black shadow-md active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="mono text-[11px]">Processing</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span className="mono text-[11px]">Execute</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Context-Aware Recommended Queries */}
      {recommendedQueries.length > 0 && (
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-[#8e9299] mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#f59e0b]" />
            <span className="text-[10px] mono uppercase tracking-wider text-[#e1e1e1] font-semibold">Calibrated Test Vectors:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendedQueries.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(item.query);
                  onSubmit(item.taskType);
                }}
                className="text-left bg-[#0c0d0e] hover:bg-[#111215] border border-[#2a2c31] hover:border-[#4ade80]/50 rounded px-2.5 py-1.5 text-xs text-[#e1e1e1] hover:text-[#4ade80] transition-all flex items-center space-x-1.5 group"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] group-hover:animate-ping" />
                <span className="font-mono text-[11px]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preset Query Chips Library */}
      <div className="space-y-2 border-t border-[#2a2c31] pt-3">
        <span className="text-[10px] mono font-bold text-[#8e9299] uppercase tracking-widest block">
          Domain Benchmark Queries
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {defaultPresets.map((group, gIdx) => (
            <div key={gIdx} className="bg-[#0c0d0e] p-2.5 rounded border border-[#2a2c31] space-y-1.5">
              <span className="text-[10px] mono font-bold text-[#4ade80] block uppercase">{group.category}</span>
              <div className="flex flex-col space-y-1">
                {group.items.map((item, iIdx) => (
                  <button
                    key={iIdx}
                    onClick={() => {
                      setQuery(item.query);
                      onSubmit(item.task);
                    }}
                    className="text-left text-[11px] text-[#8e9299] hover:text-[#e1e1e1] hover:bg-[#151619] px-1.5 py-1 rounded transition-colors truncate"
                  >
                    • {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

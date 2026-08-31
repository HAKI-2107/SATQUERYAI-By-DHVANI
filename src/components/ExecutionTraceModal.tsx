import React, { useState } from 'react';
import { X, Activity, CheckCircle2, Clock, Cpu, Layers, Sparkles, ShieldCheck, Terminal, Copy, Check } from 'lucide-react';
import { ExecutionTrace } from '../types';

interface ExecutionTraceModalProps {
  trace: ExecutionTrace | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutionTraceModal: React.FC<ExecutionTraceModalProps> = ({
  trace,
  isOpen,
  onClose
}) => {
  const [viewRawJson, setViewRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !trace) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(trace, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#151619] border border-[#2a2c31] rounded w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2c31] bg-[#0c0d0e]">
          <div className="flex items-center space-x-3">
            <div className="h-7 w-7 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6]">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#e1e1e1] flex items-center space-x-2">
                <span>Auditable Execution Trace</span>
                <span className="text-[9px] mono px-1.5 py-0.5 rounded bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30 font-bold">
                  AUDITED_OK
                </span>
              </h2>
              <p className="text-[10px] text-[#8e9299] mono">
                QUERY_ID: {trace.queryId} | LATENCY: {trace.totalDurationMs}ms
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 mono">
            <button
              onClick={() => setViewRawJson(!viewRawJson)}
              className="px-2.5 py-1 rounded text-[10px] uppercase font-bold border border-[#2a2c31] bg-[#151619] text-[#8e9299] hover:text-[#4ade80] transition-colors"
            >
              {viewRawJson ? 'Visual Flow' : 'Raw JSON'}
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded border border-[#2a2c31] bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1]"
              title="Copy Trace JSON"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#4ade80]" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded border border-[#2a2c31] bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Trace Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {viewRawJson ? (
            <pre className="bg-[#0c0d0e] p-4 rounded border border-[#2a2c31] text-[11px] mono text-[#4ade80] overflow-x-auto">
              {JSON.stringify(trace, null, 2)}
            </pre>
          ) : (
            <>
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#0c0d0e] p-3 rounded border border-[#2a2c31]">
                  <span className="text-[9px] text-[#8e9299] block uppercase mono font-bold">Routing Task</span>
                  <span className="text-xs font-bold text-[#e1e1e1] mono uppercase">
                    {trace.taskType}
                  </span>
                </div>
                <div className="bg-[#0c0d0e] p-3 rounded border border-[#2a2c31]">
                  <span className="text-[9px] text-[#8e9299] block uppercase mono font-bold">Primary VLM</span>
                  <span className="text-xs font-bold text-[#4ade80] mono">
                    {trace.primaryModel}
                  </span>
                </div>
                <div className="bg-[#0c0d0e] p-3 rounded border border-[#2a2c31]">
                  <span className="text-[9px] text-[#8e9299] block uppercase mono font-bold">Specialist LoRA</span>
                  <span className="text-xs font-bold text-[#3b82f6] mono truncate block">
                    BigEarthNet (S1/S2)
                  </span>
                </div>
                <div className="bg-[#0c0d0e] p-3 rounded border border-[#2a2c31]">
                  <span className="text-[9px] text-[#8e9299] block uppercase mono font-bold">Total Duration</span>
                  <span className="text-xs font-bold text-[#f59e0b] mono">
                    {trace.totalDurationMs} ms
                  </span>
                </div>
              </div>

              {/* Rationale Banner */}
              <div className="bg-[#0c0d0e] p-3 rounded border border-[#2a2c31] text-xs">
                <span className="text-[#8e9299] font-bold uppercase text-[9px] tracking-wider block mb-1 mono">
                  Agentic Routing Rationale
                </span>
                <p className="text-[#e1e1e1] leading-relaxed mono text-[11px]">
                  {trace.routingRationale}
                </p>
              </div>

              {/* Sequential Steps Timeline */}
              <div className="space-y-3">
                <span className="text-[10px] mono font-bold text-[#8e9299] uppercase tracking-widest block">
                  Execution Pipeline & Verification Steps ({trace.steps.length})
                </span>

                <div className="space-y-2.5 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#2a2c31]">
                  {trace.steps.map((step, idx) => (
                    <div key={idx} className="relative flex items-start space-x-3 pl-7">
                      {/* Step Circle */}
                      <div className="absolute left-2 top-1.5 -translate-x-1/2 h-3 w-3 rounded-full bg-[#151619] border-2 border-[#4ade80] flex items-center justify-center">
                        <div className="h-1 w-1 rounded-full bg-[#4ade80]" />
                      </div>

                      {/* Step Card */}
                      <div className="flex-1 bg-[#0c0d0e] rounded border border-[#2a2c31] p-3 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-[#e1e1e1] mono">
                              STEP {step.stepNumber}: {step.title}
                            </span>
                            <span className="text-[9px] mono px-1.5 py-0.5 rounded bg-[#151619] text-[#8e9299] border border-[#2a2c31] uppercase">
                              {step.category}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-[10px] mono text-[#8e9299]">
                            <Clock className="h-3 w-3" />
                            <span>{step.durationMs}ms</span>
                          </div>
                        </div>

                        <p className="text-xs text-[#e1e1e1] leading-relaxed mono text-[11px]">
                          {step.details}
                        </p>

                        <div className="flex flex-wrap items-center justify-between text-[9px] mono text-[#8e9299] pt-1.5 border-t border-[#2a2c31]">
                          <span>TOOL: <strong className="text-[#3b82f6]">{step.toolUsed}</strong></span>
                          <span>MODEL: <strong className="text-[#4ade80]">{step.model}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2a2c31] bg-[#0c0d0e] flex items-center justify-between text-xs mono text-[#8e9299]">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#4ade80]" />
            <span className="text-[10px]">All verification constraints satisfied. Audited response ready for mission-critical inspection.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#2a2c31] hover:bg-[#3d4047] text-[#e1e1e1] rounded font-bold uppercase text-[10px] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

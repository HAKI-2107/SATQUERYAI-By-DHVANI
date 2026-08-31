import React from 'react';
import {
  Satellite,
  Sparkles,
  Layers,
  Activity,
  Palette,
  ShieldAlert,
  Cpu,
  Waves,
  Globe,
  PanelLeft,
  Menu,
  ChevronDown
} from 'lucide-react';
import { WorkspaceTab } from './GeminiDashboardDrawer';

interface HeaderProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  provider: 'gemini' | 'claude_fallback' | 'openai_fallback';
  setProvider: (p: 'gemini' | 'claude_fallback' | 'openai_fallback') => void;
  useSpecialist: boolean;
  setUseSpecialist: (val: boolean) => void;
  isBackendConnected: boolean;
  onOpenModelsCatalog?: () => void;
  onToggleDashboard: () => void;
  isDashboardOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  provider,
  setProvider,
  useSpecialist,
  setUseSpecialist,
  isBackendConnected,
  onOpenModelsCatalog,
  onToggleDashboard,
  isDashboardOpen
}) => {
  const getTabInfo = (tab: WorkspaceTab) => {
    switch (tab) {
      case 'studio':
        return { label: 'Satellite AI Studio', icon: <Layers className="h-3.5 w-3.5 text-[#4ade80]" />, color: 'text-[#4ade80]' };
      case 'disaster':
        return { label: 'Disaster Examination', icon: <ShieldAlert className="h-3.5 w-3.5 text-red-400" />, color: 'text-red-400' };
      case 'seismic':
        return { label: 'Seismic & Tsunami AI', icon: <Waves className="h-3.5 w-3.5 text-amber-400" />, color: 'text-amber-400' };
      case 'timeline':
        return { label: 'Incident Timeline', icon: <Globe className="h-3.5 w-3.5 text-cyan-400" />, color: 'text-cyan-400' };
      case 'ir_color':
        return { label: 'IR-to-Color Synthesizer', icon: <Palette className="h-3.5 w-3.5 text-purple-400" />, color: 'text-purple-400' };
      case 'eval':
        return { label: 'Benchmarks & Evals', icon: <Activity className="h-3.5 w-3.5 text-emerald-400" />, color: 'text-emerald-400' };
    }
  };

  const currentInfo = getTabInfo(activeTab);

  return (
    <header className="border-b border-[#2a2c31] bg-[#151619] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Gemini Sliding Dashboard Toggle & App Branding */}
          <div className="flex items-center space-x-3">
            {/* Sliding Dashboard Drawer Toggle Button */}
            <button
              onClick={onToggleDashboard}
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border transition-all ${
                isDashboardOpen
                  ? 'bg-[#4ade80] text-black border-[#4ade80] shadow-sm font-bold'
                  : 'bg-[#0c0d0e] hover:bg-[#1a1b20] text-[#e1e1e1] border-[#2a2c31] hover:border-[#4ade80]/40'
              }`}
              title="Toggle Gemini Sliding Dashboard (Ctrl+B / ⌘+B)"
            >
              <PanelLeft className="h-4 w-4" />
              <span className="text-xs font-semibold mono hidden sm:inline">Dashboard</span>
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={onToggleDashboard}>
              <div className="h-8 w-8 rounded-lg bg-[#111215] border border-[#2a2c31] flex items-center justify-center text-[#4ade80]">
                <Satellite className="h-4 w-4" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-base sm:text-lg font-bold tracking-tighter text-white">
                  SATQUERY<span className="text-[#4ade80] lcd-glow">AI</span>
                </div>
              </div>
            </div>

            {/* Active Workspace Selector Dropdown Trigger */}
            <button
              onClick={onToggleDashboard}
              className="flex items-center space-x-2 bg-[#0c0d0e] hover:bg-[#18191d] px-2.5 py-1 rounded-lg border border-[#2a2c31] hover:border-[#3a3d46] text-xs mono transition-all shadow-xs group"
              title="Click to Switch Workspaces in Sliding Dashboard"
            >
              <div className="flex items-center space-x-1.5">
                {currentInfo.icon}
                <span className={`font-semibold ${currentInfo.color}`}>
                  {currentInfo.label}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-[#8e9299] group-hover:text-white transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>

          {/* Right: Controls & Engine Status */}
          <div className="flex items-center space-x-2">
            {/* Research Models Catalog Button */}
            {onOpenModelsCatalog && (
              <button
                onClick={onOpenModelsCatalog}
                title="Explore 20 Earth Observation Deep Learning Architectures & Datasets"
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#0c0d0e] hover:bg-[#1a1b20] border border-[#2a2c31] hover:border-[#4ade80]/40 text-xs mono text-[#4ade80] transition-all font-semibold"
              >
                <Cpu className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">20 EO Models</span>
              </button>
            )}

            {/* BigEarthNet LoRA Status Toggle */}
            <button
              onClick={() => setUseSpecialist(!useSpecialist)}
              title="Toggle BigEarthNet-19 Multispectral LoRA Domain Adapter"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs mono uppercase transition-all ${
                useSpecialist
                  ? 'bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#3b82f6]'
                  : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] line-through'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">LoRA</span>
              <span className="text-[10px] px-1 py-0.2 bg-[#3b82f6]/20 rounded font-bold">
                {useSpecialist ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Provider Selector */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-[#0c0d0e] px-2.5 py-1 rounded-lg border border-[#2a2c31] text-xs mono">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
              <span className="text-[#8e9299] hidden lg:inline">VLM:</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="bg-transparent text-[#e1e1e1] font-semibold focus:outline-none cursor-pointer text-xs uppercase"
              >
                <option value="gemini" className="bg-[#151619] text-[#e1e1e1]">Gemini-3.7-Flash</option>
                <option value="claude_fallback" className="bg-[#151619] text-[#e1e1e1]">Claude-Interface</option>
                <option value="openai_fallback" className="bg-[#151619] text-[#e1e1e1]">OpenAI-Interface</option>
              </select>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center space-x-1.5 text-xs mono bg-[#0c0d0e] px-2 py-1 rounded-lg border border-[#2a2c31]">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
              <span className="text-[10px] text-[#4ade80] font-bold tracking-wider uppercase">ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


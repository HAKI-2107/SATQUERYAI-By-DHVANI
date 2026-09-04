import React, { useEffect } from 'react';
import {
  Layers,
  ShieldAlert,
  Waves,
  Globe,
  Palette,
  Activity,
  Cpu,
  Sparkles,
  PlusCircle,
  X,
  ChevronRight,
  Database,
  Satellite,
  Compass,
  CheckCircle2,
  Anchor,
  Wheat,
  CloudRain,
  Flame,
  Radio,
  Sliders,
  Target
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/samples';
import { RemoteSensingImage } from '../types';

export type WorkspaceTab = 
  | 'studio' 
  | 'sih_problem_statement'
  | 'google_maps'
  | 'google_picker'
  | 'cloud_sql'
  | 'live_streams' 
  | 'gcs_ilm'
  | 'dspy_cloudberry' 
  | 'disaster' 
  | 'seismic' 
  | 'timeline' 
  | 'ir_color' 
  | 'eval';

interface GeminiDashboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onNewSession?: () => void;
  selectedSampleId?: string;
  onSelectSampleDataset?: (images: RemoteSensingImage[], defaultQuery?: string, defaultTask?: string) => void;
  provider: 'gemini' | 'claude_fallback' | 'openai_fallback';
  setProvider: (p: 'gemini' | 'claude_fallback' | 'openai_fallback') => void;
  useSpecialist: boolean;
  setUseSpecialist: (val: boolean) => void;
  onOpenModelsCatalog: () => void;
}

export const GeminiDashboardDrawer: React.FC<GeminiDashboardDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onNewSession,
  selectedSampleId,
  onSelectSampleDataset,
  provider,
  setProvider,
  useSpecialist,
  setUseSpecialist,
  onOpenModelsCatalog
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled externally
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const workspaces: {
    id: WorkspaceTab;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    accentColor: string;
  }[] = [
    {
      id: 'studio',
      title: 'Satellite AI Studio',
      subtitle: 'Multi-Modal VLM, Grounding & Pixel Differencing',
      icon: <Layers className="h-4 w-4" />,
      badge: 'CORE VLM',
      badgeColor: 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30',
      accentColor: 'hover:border-[#4ade80]/50'
    },
    {
      id: 'sih_problem_statement',
      title: 'SatQuery AI (ISRO PS 26167)',
      subtitle: 'VQA, Captioning, Grounding, Change Detection & SAR Fusion',
      icon: <Target className="h-4 w-4 text-[#38bdf8]" />,
      badge: 'ISRO PS 26167',
      badgeColor: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/40 font-bold',
      accentColor: 'hover:border-[#38bdf8]/60'
    },
    {
      id: 'google_maps',
      title: 'Google Maps Orbital Tracker',
      subtitle: 'Dynamic Satellite Orbits, AOI Bounding & Sensor Swaths',
      icon: <Globe className="h-4 w-4" />,
      badge: 'GOOGLE MAPS',
      badgeColor: 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30',
      accentColor: 'hover:border-[#38bdf8]/50'
    },
    {
      id: 'google_picker',
      title: 'Google Drive & Picker Datasets',
      subtitle: 'Import GeoJSON, GeoTIFFs & Imagery from Google Workspace',
      icon: <Database className="h-4 w-4" />,
      badge: 'GOOGLE PICKER',
      badgeColor: 'bg-[#4285f4]/10 text-[#4285f4] border-[#4285f4]/30',
      accentColor: 'hover:border-[#4285f4]/50'
    },
    {
      id: 'cloud_sql',
      title: 'Cloud SQL PostgreSQL Live DB',
      subtitle: 'Drizzle ORM Persistence, Query Logs & Table Explorer',
      icon: <Satellite className="h-4 w-4" />,
      badge: 'POSTGRESQL',
      badgeColor: 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30',
      accentColor: 'hover:border-[#4ade80]/50'
    },
    {
      id: 'live_streams',
      title: 'Live Orbital Feeds & GeoJSON',
      subtitle: 'NASA GIBS, FIRMS, Copernicus STAC & ISRO Streams',
      icon: <Radio className="h-4 w-4" />,
      badge: 'LIVE ORBITAL DATA',
      badgeColor: 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30',
      accentColor: 'hover:border-[#38bdf8]/50'
    },
    {
      id: 'gcs_ilm',
      title: 'GeoChat, ChangeStar & ConfigILM',
      subtitle: 'Merged Backend RS-LLM & "What is What" Training Studio',
      icon: <Cpu className="h-4 w-4 text-emerald-400" />,
      badge: 'GCS-ILM MERGED',
      badgeColor: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
      accentColor: 'hover:border-emerald-400/50'
    },
    {
      id: 'dspy_cloudberry',
      title: 'Self-Learning DSPy & Cloudberry',
      subtitle: 'Stanford DSPy Teleprompter & Big-Spatial OLAP Aggregation',
      icon: <Cpu className="h-4 w-4" />,
      badge: 'DSPy + CLOUDBERRY',
      badgeColor: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30',
      accentColor: 'hover:border-[#3b82f6]/50'
    },
    {
      id: 'disaster',
      title: 'Disaster Examination',
      subtitle: 'Rapid Damage Assessment, Flood & Hazard Analysis',
      icon: <ShieldAlert className="h-4 w-4" />,
      badge: 'URGENT RESPONSE',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30',
      accentColor: 'hover:border-red-500/50'
    },
    {
      id: 'seismic',
      title: 'Seismic & Tsunami AI',
      subtitle: 'Real-Time Seismicity & Wave Runup Early Warning',
      icon: <Waves className="h-4 w-4" />,
      badge: 'JMA-EEW / NOAA',
      badgeColor: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
      accentColor: 'hover:border-amber-400/50'
    },
    {
      id: 'timeline',
      title: 'Global Incidents Timeline',
      subtitle: 'Multi-Epoch Historical Event Catalog & Analytics',
      icon: <Globe className="h-4 w-4" />,
      badge: 'HISTORIC ARCHIVE',
      badgeColor: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
      accentColor: 'hover:border-cyan-400/50'
    },
    {
      id: 'ir_color',
      title: 'IR-to-Color Synthesizer',
      subtitle: 'Band B1-B12 False Color Radiometric Generation',
      icon: <Palette className="h-4 w-4" />,
      badge: 'SPECTRAL SYNTH',
      badgeColor: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
      accentColor: 'hover:border-purple-400/50'
    },
    {
      id: 'eval',
      title: 'Benchmarks & Evaluation',
      subtitle: 'VRSBench, RSVQA, CDVQA & Accuracy Leaderboards',
      icon: <Activity className="h-4 w-4" />,
      badge: 'F1 & mIoU EVALS',
      badgeColor: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
      accentColor: 'hover:border-emerald-400/50'
    }
  ];

  const getDatasetIcon = (id: string) => {
    switch (id) {
      case 'sample_rotterdam_port':
        return <Anchor className="h-3.5 w-3.5 text-sky-400" />;
      case 'sample_agricultural_parcels':
        return <Wheat className="h-3.5 w-3.5 text-emerald-400" />;
      case 'sample_optical_sar_cross':
        return <CloudRain className="h-3.5 w-3.5 text-cyan-400" />;
      case 'sample_bitemporal_wildfire':
        return <Flame className="h-3.5 w-3.5 text-orange-400" />;
      default:
        return <Satellite className="h-3.5 w-3.5 text-[#4ade80]" />;
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sliding Drawer Container (Gemini Dashboard style) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-80 sm:w-96 bg-[#111215] border-r border-[#2a2c31] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#2a2c31] flex items-center justify-between bg-[#151619]">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-[#0c0d0e] border border-[#2a2c31] flex items-center justify-center text-[#4ade80] shadow-sm">
              <Satellite className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-bold tracking-tight text-white">SATQUERY</span>
                <span className="text-sm font-bold text-[#4ade80] lcd-glow">AI</span>
                <span className="text-[9px] mono px-1.5 py-0.2 bg-[#4ade80]/10 text-[#4ade80] rounded border border-[#4ade80]/30 font-bold">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] mono text-[#8e9299]">Gemini Earth Intelligence Engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-[#0c0d0e] hover:bg-[#202227] border border-[#2a2c31] text-[#8e9299] hover:text-white flex items-center justify-center transition-colors"
            title="Close Dashboard (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Button: New Analysis Session */}
        <div className="p-3 border-b border-[#2a2c31] bg-[#0c0d0e]/60">
          <button
            onClick={() => {
              if (onNewSession) onNewSession();
              onSelectTab('studio');
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#151619] hover:bg-[#202227] text-white rounded-lg border border-[#2a2c31] hover:border-[#4ade80]/40 text-xs font-semibold mono transition-all shadow group"
          >
            <PlusCircle className="h-4 w-4 text-[#4ade80] group-hover:scale-110 transition-transform" />
            <span>New Analysis Session</span>
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
          {/* SECTION 1: WORKSPACE SUITE */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e9299] mono">
                Workspace Suites
              </span>
              <span className="text-[9px] mono text-[#4ade80]">6 Active</span>
            </div>

            <div className="space-y-1.5">
              {workspaces.map((ws) => {
                const isActive = activeTab === ws.id;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      onSelectTab(ws.id);
                      onClose();
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-[#151619] border-[#4ade80] shadow-sm'
                        : 'bg-[#0c0d0e]/60 border-[#2a2c31] hover:bg-[#151619] ' + ws.accentColor
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`h-8 w-8 rounded flex items-center justify-center shrink-0 border transition-colors ${
                          isActive
                            ? 'bg-[#4ade80] text-black border-[#4ade80]'
                            : 'bg-[#151619] text-[#8e9299] border-[#2a2c31] group-hover:text-white'
                        }`}
                      >
                        {ws.icon}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs font-semibold tracking-tight truncate ${
                              isActive ? 'text-white font-bold' : 'text-[#d1d5db] group-hover:text-white'
                            }`}
                          >
                            {ws.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8e9299] truncate">{ws.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                      {ws.badge && (
                        <span
                          className={`text-[8px] mono font-bold uppercase px-1.5 py-0.5 rounded border hidden sm:inline-block ${ws.badgeColor}`}
                        >
                          {ws.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          isActive ? 'text-[#4ade80] translate-x-0.5' : 'text-[#4b5563] group-hover:text-white'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: CURATED EARTH OBSERVATION SENSOR PACKAGES */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e9299] mono">
                Sensor Datasets
              </span>
              <span className="text-[9px] mono text-[#8e9299]">Authentic EO</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {SAMPLE_DATASETS.map((pkg) => {
                const isSelected = selectedSampleId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      if (onSelectSampleDataset) {
                        onSelectSampleDataset(
                          pkg.images,
                          pkg.recommendedQueries[0]?.query,
                          pkg.recommendedQueries[0]?.taskType
                        );
                      }
                      onSelectTab('studio');
                      onClose();
                    }}
                    className={`text-left p-2 rounded-lg border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#151619] border-[#4ade80]/60 ring-1 ring-[#4ade80]/30'
                        : 'bg-[#0c0d0e]/60 border-[#2a2c31] hover:bg-[#151619] hover:border-[#373a42]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {/* Image Thumbnail */}
                      <div className="relative h-8 w-12 rounded overflow-hidden border border-[#2a2c31] shrink-0 bg-[#0c0d0e]">
                        <img
                          src={pkg.images[0]?.thumbnailUrl || pkg.images[0]?.dataUrl}
                          alt={pkg.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          {getDatasetIcon(pkg.id)}
                          <span
                            className={`text-[11px] font-semibold truncate ${
                              isSelected ? 'text-[#4ade80]' : 'text-[#d1d5db] group-hover:text-white'
                            }`}
                          >
                            {pkg.title.split('(')[0].trim()}
                          </span>
                        </div>
                        <span className="text-[9px] mono text-[#8e9299]">{pkg.satellite} • 10m GSD</span>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: DEEP LEARNING MODELS & SATELLITE CATALOG */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e9299] mono">
                Architecture & Weights
              </span>
            </div>

            <div className="space-y-2">
              {/* Models Catalog Modal trigger */}
              <button
                onClick={() => {
                  onOpenModelsCatalog();
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-lg border border-[#2a2c31] bg-[#0c0d0e]/60 hover:bg-[#151619] hover:border-[#4ade80]/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="h-7 w-7 rounded bg-[#151619] border border-[#2a2c31] flex items-center justify-center text-[#4ade80]">
                    <Cpu className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#e1e1e1] group-hover:text-[#4ade80] transition-colors">
                      20 EO Model Architectures
                    </span>
                    <p className="text-[9px] mono text-[#8e9299]">NASA/ISRO, Cartosat, Prithvi, SatMAE</p>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[#8e9299] group-hover:text-white" />
              </button>

              {/* LoRA Adapter Toggle Card */}
              <div className="p-2.5 rounded-lg border border-[#2a2c31] bg-[#0c0d0e]/60 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-7 w-7 rounded bg-[#151619] border border-[#2a2c31] flex items-center justify-center text-[#3b82f6]">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#e1e1e1]">BigEarthNet LoRA</span>
                    <p className="text-[9px] mono text-[#8e9299]">Multispectral 19-Class LoRA</p>
                  </div>
                </div>

                <button
                  onClick={() => setUseSpecialist(!useSpecialist)}
                  className={`px-2 py-1 rounded text-[9px] mono font-bold border transition-all ${
                    useSpecialist
                      ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                      : 'bg-[#151619] text-[#8e9299] border-[#2a2c31]'
                  }`}
                >
                  {useSpecialist ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer: VLM Selector & Hardware Telemetry */}
        <div className="p-3 border-t border-[#2a2c31] bg-[#151619] space-y-2">
          <div className="flex items-center justify-between text-xs mono">
            <span className="text-[10px] text-[#8e9299] uppercase">Inference Engine:</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="bg-[#0c0d0e] text-[#4ade80] font-semibold px-2 py-1 rounded border border-[#2a2c31] text-[10px] focus:outline-none cursor-pointer"
            >
              <option value="gemini">Gemini-3.7-Flash (Primary)</option>
              <option value="claude_fallback">Claude-Interface</option>
              <option value="openai_fallback">OpenAI-Interface</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-[9px] mono text-[#8e9299] pt-1 border-t border-[#2a2c31]/60">
            <div className="flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] animate-pulse"></span>
              <span className="text-[#4ade80] font-bold">NODE RUNNING</span>
            </div>
            <span>Calibrated GSD • EPSG:32631</span>
          </div>
        </div>
      </aside>
    </>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Flame,
  Droplets,
  Building,
  TreePine,
  Activity,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Maximize2,
  Percent,
  Play,
  RotateCcw
} from 'lucide-react';
import { GlobalIncident, RemoteSensingImage, TimelineEpoch } from '../types';
import { GLOBAL_INCIDENTS_DATABASE } from '../data/globalIncidentsCorpus';
import { computeMultiTemporalChangePercentage } from '../utils/irColorizer';

interface WorldChangeTimelineProps {
  onLoadIncidentIntoStudio: (
    images: RemoteSensingImage[],
    recommendedQuery?: string,
    mode?: string
  ) => void;
}

export const WorldChangeTimeline: React.FC<WorldChangeTimelineProps> = ({
  onLoadIncidentIntoStudio
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(GLOBAL_INCIDENTS_DATABASE[0].id);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const activeIncident: GlobalIncident =
    GLOBAL_INCIDENTS_DATABASE.find(inc => inc.id === selectedIncidentId) ||
    GLOBAL_INCIDENTS_DATABASE[0];

  // Timeline Epoch States
  const [baselineEpochIndex, setBaselineEpochIndex] = useState<number>(0);
  const [targetEpochIndex, setTargetEpochIndex] = useState<number>(
    Math.max(1, activeIncident.timeline.length - 1)
  );

  // Live Computed Diff Mask
  const [diffHeatmapUrl, setDiffHeatmapUrl] = useState<string | null>(null);
  const [isComputingDiff, setIsComputingDiff] = useState<boolean>(false);
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState<boolean>(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(75);
  const [changeThreshold, setChangeThreshold] = useState<number>(25);
  const [liveMetrics, setLiveMetrics] = useState<{
    changePercentage: number;
    vegetationLossPercentage: number;
    urbanExpansionPercentage: number;
    waterDeltaPercentage: number;
  } | null>(null);

  // Reset epoch indices when incident changes
  useEffect(() => {
    setBaselineEpochIndex(0);
    setTargetEpochIndex(Math.max(1, activeIncident.timeline.length - 1));
  }, [selectedIncidentId]);

  // Compute live change detection when epochs or threshold change
  useEffect(() => {
    let isMounted = true;
    const runDiff = async () => {
      const epoch1 = activeIncident.timeline[baselineEpochIndex];
      const epoch2 = activeIncident.timeline[targetEpochIndex];
      if (!epoch1 || !epoch2 || baselineEpochIndex === targetEpochIndex) {
        setDiffHeatmapUrl(null);
        setLiveMetrics(null);
        return;
      }

      setIsComputingDiff(true);
      try {
        const res = await computeMultiTemporalChangePercentage(
          epoch1.image.dataUrl,
          epoch2.image.dataUrl,
          changeThreshold
        );
        if (isMounted) {
          setDiffHeatmapUrl(res.changeHeatmapUrl);
          setLiveMetrics({
            changePercentage: res.changePercentage,
            vegetationLossPercentage: res.breakdown.vegetationLossPercentage,
            urbanExpansionPercentage: res.breakdown.urbanExpansionPercentage,
            waterDeltaPercentage: res.breakdown.waterDeltaPercentage
          });
        }
      } catch (err) {
        console.error('Error computing change delta:', err);
      } finally {
        if (isMounted) setIsComputingDiff(false);
      }
    };

    runDiff();
    return () => { isMounted = false; };
  }, [selectedIncidentId, baselineEpochIndex, targetEpochIndex, changeThreshold]);

  const filteredIncidents = GLOBAL_INCIDENTS_DATABASE.filter(inc => {
    if (categoryFilter === 'all') return true;
    return inc.category === categoryFilter;
  });

  const baselineEpoch = activeIncident.timeline[baselineEpochIndex] || activeIncident.timeline[0];
  const targetEpoch = activeIncident.timeline[targetEpochIndex] || activeIncident.timeline[activeIncident.timeline.length - 1];

  const handleLaunchAIAnalysis = (recommendedQuery?: string, mode?: string) => {
    const pair: RemoteSensingImage[] = [
      {
        ...baselineEpoch.image,
        role: 't1_pre'
      },
      {
        ...targetEpoch.image,
        role: 't2_post'
      }
    ];

    const defaultQuery =
      recommendedQuery ||
      `Perform comprehensive bi-temporal remote-sensing forensic analysis between ${baselineEpoch.label} and ${targetEpoch.label}. Quantify percentage of land cover change, classify damage severity according to xView2 standards, and output structured bounding box coordinates for all significant anomalies.`;

    onLoadIncidentIntoStudio(pair, defaultQuery, mode || 'damage_grading');
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'wildfire': return <Flame className="h-4 w-4 text-[#f43f5e]" />;
      case 'flood': return <Droplets className="h-4 w-4 text-[#06b6d4]" />;
      case 'urban_expansion': return <Building className="h-4 w-4 text-[#f59e0b]" />;
      case 'deforestation': return <TreePine className="h-4 w-4 text-[#10b981]" />;
      case 'drought_lake_loss': return <Activity className="h-4 w-4 text-[#3b82f6]" />;
      default: return <Globe className="h-4 w-4 text-[#4ade80]" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="bg-[#151619] border border-[#2a2c31] p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Globe className="h-5 w-5 text-[#4ade80]" />
            <h1 className="text-sm font-bold uppercase tracking-wider text-[#e1e1e1]">
              Global Before & After Incidents Research Database & Multi-Epoch Timeline Brain
            </h1>
          </div>
          <p className="text-[11px] mono text-[#8e9299] max-w-3xl leading-relaxed">
            World-scale multi-temporal change detection engine grounded on <strong>xView2</strong>, <strong>Copernicus EMS</strong>, <strong>SpaceNet 7/8</strong>, and <strong>NASA Earth Observatory</strong> time series. Tracks ecological shifts, disaster destruction, and urban mega-sprawl with pixel-level mathematical delta calculations.
          </p>
        </div>

        <button
          onClick={() => handleLaunchAIAnalysis()}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#4ade80] hover:brightness-110 text-black rounded text-xs mono uppercase font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
        >
          <Zap className="h-4 w-4 fill-current" />
          <span>Test in SatQuery Brain</span>
        </button>
      </div>

      {/* Main Grid: Left Selector (4 cols) & Right Detailed Timeline Canvas (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Incident Explorer & Filters (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Category Filter Pills */}
          <div className="bg-[#151619] border border-[#2a2c31] p-3 rounded">
            <span className="text-[10px] mono uppercase text-[#8e9299] block mb-2 font-bold">
              Filter by Incident Type:
            </span>
            <div className="flex flex-wrap gap-1.5 text-[10.5px] mono">
              {[
                { id: 'all', label: 'All Global' },
                { id: 'wildfire', label: 'Wildfires' },
                { id: 'flood', label: 'Floods' },
                { id: 'urban_expansion', label: 'Urban Sprawl' },
                { id: 'deforestation', label: 'Forest Loss' },
                { id: 'drought_lake_loss', label: 'Lake Shrinkage' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  className={`px-2.5 py-1 rounded transition-all ${
                    categoryFilter === f.id
                      ? 'bg-[#4ade80] text-black font-bold'
                      : 'bg-[#0c0d0e] border border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Incident List */}
          <div className="bg-[#151619] border border-[#2a2c31] p-3 rounded space-y-2 max-h-[600px] overflow-y-auto">
            <span className="text-[10px] mono uppercase text-[#8e9299] block mb-1 font-bold">
              Research Incidents ({filteredIncidents.length}):
            </span>

            {filteredIncidents.map((incident) => {
              const isSelected = activeIncident.id === incident.id;
              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#4ade80]/10 border-[#4ade80] shadow-md'
                      : 'bg-[#0c0d0e] border-[#2a2c31] hover:border-[#3d4047]'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="mt-0.5 p-1.5 rounded bg-[#151619] border border-[#2a2c31]">
                      {getCategoryIcon(incident.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e1e1e1] truncate">
                          {incident.title}
                        </span>
                        <span className="text-[9.5px] mono text-[#4ade80] font-bold shrink-0 ml-1">
                          {incident.yearRange}
                        </span>
                      </div>
                      <div className="text-[10px] mono text-[#8e9299] mt-0.5 flex items-center space-x-2">
                        <span>{incident.locationName}</span>
                        <span>•</span>
                        <span>{incident.timeline.length} Epochs</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Interactive Timeline Scrubber & Quantified Change Engine (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Incident Header & Provenance */}
          <div className="bg-[#151619] border border-[#2a2c31] p-4 rounded space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#e1e1e1] flex items-center space-x-2">
                  <span>{activeIncident.title}</span>
                </h2>
                <div className="text-[10.5px] mono text-[#8e9299] mt-0.5">
                  📍 {activeIncident.locationName} ({activeIncident.coordinates[0].toFixed(3)}°N, {activeIncident.coordinates[1].toFixed(3)}°E)
                </div>
              </div>
              <div className="bg-[#0c0d0e] border border-[#2a2c31] px-2.5 py-1 rounded text-[10px] mono text-[#4ade80]">
                {activeIncident.researchProvenance}
              </div>
            </div>

            <p className="text-xs text-[#e1e1e1]/90 leading-relaxed pt-1">
              {activeIncident.summary}
            </p>
          </div>

          {/* Interactive Multi-Epoch Timeline Scrubber */}
          <div className="bg-[#151619] border border-[#2a2c31] p-4 rounded space-y-3">
            <div className="flex items-center justify-between text-xs mono">
              <span className="font-bold text-[#e1e1e1] uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#4ade80]" />
                <span>Multi-Temporal Epoch Navigation</span>
              </span>
              <span className="text-[#8e9299] text-[10px]">
                Comparing: <strong className="text-[#3b82f6]">Epoch {baselineEpochIndex}</strong> vs <strong className="text-[#f43f5e]">Epoch {targetEpochIndex}</strong>
              </span>
            </div>

            {/* Epoch Selector Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {activeIncident.timeline.map((epoch, idx) => {
                const isBaseline = baselineEpochIndex === idx;
                const isTarget = targetEpochIndex === idx;

                return (
                  <div
                    key={epoch.epochId}
                    className={`p-3 rounded border text-xs mono transition-all ${
                      isBaseline
                        ? 'bg-[#3b82f6]/15 border-[#3b82f6]'
                        : isTarget
                        ? 'bg-[#f43f5e]/15 border-[#f43f5e]'
                        : 'bg-[#0c0d0e] border-[#2a2c31]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="text-[11px] text-[#e1e1e1] truncate">{epoch.label}</span>
                      <span className="text-[9px] text-[#8e9299]">{epoch.date}</span>
                    </div>
                    <p className="text-[10px] text-[#8e9299] line-clamp-2 mb-2">
                      {epoch.description}
                    </p>

                    <div className="flex items-center space-x-1.5 pt-1 border-t border-[#2a2c31]/60">
                      <button
                        onClick={() => setBaselineEpochIndex(idx)}
                        className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase transition-all ${
                          isBaseline
                            ? 'bg-[#3b82f6] text-white'
                            : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1]'
                        }`}
                      >
                        Set T0 (Pre)
                      </button>
                      <button
                        onClick={() => setTargetEpochIndex(idx)}
                        className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase transition-all ${
                          isTarget
                            ? 'bg-[#f43f5e] text-white'
                            : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1]'
                        }`}
                      >
                        Set T1 (Post)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Canvas: Bi-Temporal Dual View + Live Change Mask */}
          <div className="bg-[#151619] border border-[#2a2c31] p-4 rounded space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mono">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-[#e1e1e1] uppercase tracking-wider flex items-center space-x-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#4ade80]" />
                  <span>Temporal Visual Delta & Change Mask</span>
                </span>
                {isComputingDiff && (
                  <span className="text-[10px] text-[#f59e0b] animate-pulse">
                    Computing pixel delta...
                  </span>
                )}
              </div>

              {/* Heatmap Overlay Controls */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-1.5 text-[11px] text-[#e1e1e1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHeatmapOverlay}
                    onChange={(e) => setShowHeatmapOverlay(e.target.checked)}
                    className="accent-[#4ade80] rounded"
                  />
                  <span>Show Change Mask</span>
                </label>

                {showHeatmapOverlay && (
                  <div className="flex items-center space-x-1.5 text-[10px] text-[#8e9299]">
                    <span>Opacity:</span>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={heatmapOpacity}
                      onChange={(e) => setHeatmapOpacity(parseInt(e.target.value))}
                      className="w-16 accent-[#4ade80] h-1 bg-[#0c0d0e] rounded cursor-pointer"
                    />
                    <span>{heatmapOpacity}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Canvas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Epoch T0 Image */}
              <div className="bg-[#0c0d0e] border border-[#3b82f6]/40 rounded overflow-hidden relative aspect-video shadow-inner">
                <img
                  src={baselineEpoch.image.dataUrl}
                  alt={baselineEpoch.label}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-[#3b82f6]/50 text-[10px] mono text-[#3b82f6] font-bold">
                  T0 (BASELINE): {baselineEpoch.label.split(':')[0]}
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 px-2 py-1 rounded text-[9.5px] mono text-[#8e9299] truncate">
                  {baselineEpoch.image.name}
                </div>
              </div>

              {/* Epoch T1 Target Image + Overlaid Change Heatmap */}
              <div className="bg-[#0c0d0e] border border-[#f43f5e]/40 rounded overflow-hidden relative aspect-video shadow-inner">
                <img
                  src={targetEpoch.image.dataUrl}
                  alt={targetEpoch.label}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Overlaid Change Heatmap Mask */}
                {showHeatmapOverlay && diffHeatmapUrl && (
                  <img
                    src={diffHeatmapUrl}
                    alt="Change Heatmap"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen"
                    style={{ opacity: heatmapOpacity / 100 }}
                  />
                )}

                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-[#f43f5e]/50 text-[10px] mono text-[#f43f5e] font-bold">
                  T1 (POST-EVENT): {targetEpoch.label.split(':')[0]}
                </div>
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-[#4ade80]/50 text-[10px] mono text-[#4ade80] font-bold">
                  Δ {liveMetrics ? liveMetrics.changePercentage : activeIncident.groundTruthDelta.totalChangePercentage}% CHANGED
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 px-2 py-1 rounded text-[9.5px] mono text-[#8e9299] truncate">
                  {targetEpoch.image.name}
                </div>
              </div>
            </div>

            {/* Mask Classification Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] mono border-t border-[#2a2c31]">
              <span className="text-[#8e9299]">Mask Color Legend:</span>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-[#f43f5e]" />
                <span className="text-[#e1e1e1]">Destruction / Canopy Loss</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-[#06b6d4]" />
                <span className="text-[#e1e1e1]">Water Surge / Siltation</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-[#f59e0b]" />
                <span className="text-[#e1e1e1]">Urban Growth / Sand Fill</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-[#a855f7]" />
                <span className="text-[#e1e1e1]">Structural Delta</span>
              </div>
            </div>
          </div>

          {/* Quantified Research Change Report & Ground Truth Metrics */}
          <div className="bg-[#151619] border border-[#2a2c31] p-4 rounded space-y-3">
            <div className="flex items-center justify-between text-xs mono">
              <span className="font-bold text-[#e1e1e1] uppercase tracking-wider flex items-center space-x-1.5">
                <Percent className="h-3.5 w-3.5 text-[#4ade80]" />
                <span>Quantified Mathematical Delta & Damage Grading</span>
              </span>
              <span className="text-[10.5px] text-[#4ade80] font-bold">
                Ground Truth Verified
              </span>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mono">
              <div className="bg-[#0c0d0e] p-2.5 rounded border border-[#2a2c31]">
                <span className="text-[#8e9299] text-[9px] uppercase block">Total Scene Shift</span>
                <span className="text-base font-bold text-[#f43f5e] block">
                  {liveMetrics ? liveMetrics.changePercentage : activeIncident.groundTruthDelta.totalChangePercentage}%
                </span>
                <span className="text-[9px] text-[#8e9299]">
                  {((activeIncident.groundTruthDelta.changedAreaM2) / 10000).toLocaleString()} ha changed
                </span>
              </div>

              <div className="bg-[#0c0d0e] p-2.5 rounded border border-[#2a2c31]">
                <span className="text-[#8e9299] text-[9px] uppercase block">Spectral ΔNDVI</span>
                <span className={`text-base font-bold block ${
                  activeIncident.groundTruthDelta.spectralIndicesShift.meanNdviDelta < 0 ? 'text-[#f43f5e]' : 'text-[#10b981]'
                }`}>
                  {activeIncident.groundTruthDelta.spectralIndicesShift.meanNdviDelta.toFixed(2)}
                </span>
                <span className="text-[9px] text-[#8e9299]">Canopy foliage delta</span>
              </div>

              <div className="bg-[#0c0d0e] p-2.5 rounded border border-[#2a2c31]">
                <span className="text-[#8e9299] text-[9px] uppercase block">Burn Severity (dNBR)</span>
                <span className="text-base font-bold text-[#f59e0b] block">
                  {activeIncident.groundTruthDelta.spectralIndicesShift.dNbrValue.toFixed(2)}
                </span>
                <span className="text-[9px] text-[#8e9299]">
                  {activeIncident.groundTruthDelta.spectralIndicesShift.dNbrSeverity}
                </span>
              </div>

              <div className="bg-[#0c0d0e] p-2.5 rounded border border-[#2a2c31]">
                <span className="text-[#8e9299] text-[9px] uppercase block">Structures Impacted</span>
                <span className="text-base font-bold text-[#e1e1e1] block">
                  {activeIncident.groundTruthDelta.damageAssessment
                    ? activeIncident.groundTruthDelta.damageAssessment.destroyedCount + activeIncident.groundTruthDelta.damageAssessment.majorDamageCount
                    : 'N/A'}
                </span>
                <span className="text-[9px] text-[#8e9299]">
                  {activeIncident.groundTruthDelta.damageAssessment?.destroyedCount || 0} Destroyed
                </span>
              </div>
            </div>

            {/* Class-wise Change Progress Bars */}
            <div className="space-y-2 pt-2 border-t border-[#2a2c31] text-xs mono">
              <span className="text-[10px] text-[#8e9299] uppercase font-bold block">
                Class-Specific Land Cover Transitions:
              </span>
              {activeIncident.groundTruthDelta.classDeltas.map((cls, idx) => (
                <div key={idx} className="bg-[#0c0d0e] p-2 rounded border border-[#2a2c31] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#e1e1e1] font-bold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded" style={{ backgroundColor: cls.color }} />
                      <span>{cls.className}</span>
                    </span>
                    <span className={`font-bold ${cls.deltaPercentage > 0 ? 'text-[#4ade80]' : 'text-[#f43f5e]'}`}>
                      {cls.deltaPercentage > 0 ? `+${cls.deltaPercentage}%` : `${cls.deltaPercentage}%`} ({cls.areaHectares.toLocaleString()} ha)
                    </span>
                  </div>
                  <div className="w-full bg-[#151619] h-1.5 rounded overflow-hidden flex">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(100, Math.abs(cls.deltaPercentage))}%`,
                        backgroundColor: cls.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Reasoning Summary */}
            <div className="bg-[#0c0d0e] p-3 rounded border border-[#2a2c31] text-xs leading-relaxed text-[#e1e1e1]/90">
              <strong className="text-[#4ade80] uppercase tracking-wider text-[10px] block mb-1">
                AI Scientific Synthesis:
              </strong>
              {activeIncident.groundTruthDelta.aiReasoningSummary}
            </div>
          </div>

          {/* Recommended Expert Queries / One-Click Launch */}
          <div className="bg-[#151619] border border-[#2a2c31] p-4 rounded space-y-3">
            <h2 className="text-xs font-bold text-[#e1e1e1] uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#4ade80]" />
              <span>Recommended Specialist Reasoning Queries</span>
            </h2>

            <div className="space-y-2">
              {activeIncident.recommendedQueries.map((req, idx) => (
                <div
                  key={idx}
                  className="bg-[#0c0d0e] border border-[#2a2c31] hover:border-[#4ade80] p-3 rounded flex items-center justify-between gap-3 transition-all cursor-pointer group"
                  onClick={() => handleLaunchAIAnalysis(req.query, req.mode)}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#e1e1e1] group-hover:text-[#4ade80] transition-colors">
                        {req.label}
                      </span>
                      <span className="text-[9px] mono px-1.5 py-0.2 rounded bg-[#151619] border border-[#2a2c31] text-[#8e9299]">
                        {req.mode}
                      </span>
                    </div>
                    <p className="text-[11px] mono text-[#8e9299]">
                      "{req.query}"
                    </p>
                  </div>

                  <button className="p-2 rounded bg-[#151619] group-hover:bg-[#4ade80] text-[#8e9299] group-hover:text-black transition-all shrink-0">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

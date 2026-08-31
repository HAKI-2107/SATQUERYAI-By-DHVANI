import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Waves,
  ShieldAlert,
  Radio,
  Globe,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Sliders,
  ChevronRight,
  Info,
  MapPin,
  Cpu,
  Layers,
  BarChart3,
  Flame,
  Search,
  ExternalLink,
  Satellite,
  Compass
} from 'lucide-react';
import {
  EarthquakeRecord,
  CitySeismicImpact,
  TsunamiThreatModel,
  SeismicZoneVulnerability,
  TechBenchmarkComparison
} from '../types/seismic';
import {
  fetchLiveGlobalEarthquakes,
  getFallbackSeismicDataset,
  TECH_BENCHMARK_DATA
} from '../services/seismicService';
import {
  calculateCityImpacts,
  calculateTsunamiThreat,
  BENCHMARK_SEISMIC_ZONES,
  SCENARIO_PRESETS,
  ScenarioPreset,
  calculateDistanceKm
} from '../utils/seismicPhysics';

export const SeismicTsunamiPredictor: React.FC = () => {
  // State for seismic records
  const [earthquakes, setEarthquakes] = useState<EarthquakeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<'map' | 'eew_simulator' | 'tsunami_engine' | 'aftershock_ai' | 'tech_benchmark'>('map');

  // Filters & selections
  const [selectedEarthquake, setSelectedEarthquake] = useState<EarthquakeRecord | null>(null);
  const [filterRegion, setFilterRegion] = useState<'all' | 'japan' | 'india_himalaya' | 'ring_of_fire' | 'major'>('all');
  const [minMagnitude, setMinMagnitude] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'hour' | 'day_all' | 'day_4.5' | 'week_4.5' | 'month_sig'>('day_all');

  // EEW Simulator state
  const [simElapsedTimeSec, setSimElapsedTimeSec] = useState<number>(0);
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [customMag, setCustomMag] = useState<number>(7.8);
  const [customDepth, setCustomDepth] = useState<number>(18);
  const animFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());

  // Load initial earthquakes
  useEffect(() => {
    loadEarthquakes();
  }, [timeframe]);

  const loadEarthquakes = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveGlobalEarthquakes(timeframe);
      setEarthquakes(data);
      if (data.length > 0 && !selectedEarthquake) {
        // Select highest magnitude or first event by default
        const highest = [...data].sort((a, b) => b.magnitude - a.magnitude)[0];
        setSelectedEarthquake(highest || data[0]);
      }
      setLastRefreshed(new Date());
    } catch (e) {
      console.error('Failed to load earthquakes:', e);
      const fallback = getFallbackSeismicDataset();
      setEarthquakes(fallback);
      if (!selectedEarthquake && fallback.length > 0) {
        setSelectedEarthquake(fallback[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered earthquakes
  const filteredQuakes = useMemo(() => {
    return earthquakes.filter(q => {
      if (q.magnitude < minMagnitude) return false;
      if (filterRegion === 'japan' && q.regionCategory !== 'Japan') return false;
      if (filterRegion === 'india_himalaya' && q.regionCategory !== 'India' && q.regionCategory !== 'Himalaya') return false;
      if (filterRegion === 'ring_of_fire' && q.regionCategory !== 'RingOfFire' && q.regionCategory !== 'Japan') return false;
      if (filterRegion === 'major' && q.magnitude < 6.0) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return q.place.toLowerCase().includes(query) || q.title.toLowerCase().includes(query) || q.regionCategory.toLowerCase().includes(query);
      }
      return true;
    });
  }, [earthquakes, filterRegion, minMagnitude, searchQuery]);

  // Derived current event for calculations
  const activeEvent = selectedEarthquake || earthquakes[0] || {
    id: 'default',
    title: 'Himalayan Central Gap Scenario M7.9',
    magnitude: customMag,
    place: 'Chamoli-Garhwal Seismic Zone, Uttarakhand, India',
    time: Date.now(),
    updated: Date.now(),
    coordinates: [79.32, 30.41, customDepth] as [number, number, number],
    regionCategory: 'Himalaya' as const,
    distanceToJapanKm: 4800,
    distanceToIndiaKm: 120,
    jmaIntensity: 'Shindo 6+',
    mskIntensity: 'IX - Devastating',
    pgaG: 0.42,
    pgvCms: 41.2,
    tsunamiPotential: 'None' as const,
    status: 'simulated',
    tsunami: 0,
    sig: 980,
    net: 'in',
    code: 'sim_himalaya',
    type: 'earthquake'
  };

  // Computed EEW City Impacts
  const cityImpacts: CitySeismicImpact[] = useMemo(() => {
    const [lon, lat, depth] = activeEvent.coordinates;
    return calculateCityImpacts(lat, lon, depth, activeEvent.magnitude);
  }, [activeEvent]);

  // Computed Tsunami Threat Assessment
  const tsunamiThreat: TsunamiThreatModel = useMemo(() => {
    const [lon, lat, depth] = activeEvent.coordinates;
    return calculateTsunamiThreat(lat, lon, depth, activeEvent.magnitude);
  }, [activeEvent]);

  // EEW Real-time simulation loop
  useEffect(() => {
    if (!isSimPlaying) return;

    lastTickTimeRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const deltaSec = (now - lastTickTimeRef.current) / 1000;
      lastTickTimeRef.current = now;

      setSimElapsedTimeSec(prev => {
        const next = prev + deltaSec * simSpeed;
        if (next > 120) {
          // Loop or pause after 2 minutes of wavefront propagation
          return 0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimPlaying, simSpeed]);

  // Wave radii calculation (P-wave ~6.1 km/s, S-wave ~3.55 km/s)
  const pWaveRadiusKm = simElapsedTimeSec * 6.1;
  const sWaveRadiusKm = Math.max(0, simElapsedTimeSec * 3.55);

  const handleSelectScenario = (scenario: ScenarioPreset) => {
    const customEvent: EarthquakeRecord = {
      id: scenario.id,
      title: scenario.title,
      magnitude: scenario.magnitude,
      place: scenario.description,
      time: Date.now(),
      updated: Date.now(),
      coordinates: [scenario.lon, scenario.lat, scenario.depthKm],
      regionCategory: scenario.region === 'India' ? 'Himalaya' : scenario.region === 'Japan' ? 'Japan' : 'Global',
      distanceToJapanKm: Math.round(calculateDistanceKm(scenario.lat, scenario.lon, 36.2, 138.2)),
      distanceToIndiaKm: Math.round(calculateDistanceKm(scenario.lat, scenario.lon, 20.5, 78.9)),
      jmaIntensity: 'Shindo 6+',
      mskIntensity: 'IX - Devastating',
      pgaG: 0.45,
      pgvCms: 44.1,
      tsunamiPotential: scenario.magnitude >= 7.8 ? 'High' : 'Moderate',
      status: 'scenario_benchmark',
      tsunami: scenario.magnitude >= 7.5 ? 1 : 0,
      sig: 1200,
      net: 'benchmark',
      code: scenario.id,
      type: 'earthquake',
      faultMechanism: scenario.region === 'India' ? 'Continental Collision' : 'Subduction Mega-thrust'
    };
    setSelectedEarthquake(customEvent);
    setSimElapsedTimeSec(0);
    setIsSimPlaying(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0d0e] text-[#e1e1e1] overflow-hidden">
      {/* Top Telemetry & Control Bar */}
      <div className="border-b border-[#2a2c31] bg-[#151619] p-3 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Header Title & Real-time Pulsing Badge */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base tracking-tight">
                  GLOBAL SEISMIC & TSUNAMI AI PREDICTOR
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5"></span>
                  JMA-EEW & INCOIS SENSOR MESH LIVE
                </span>
              </div>
              <p className="text-xs text-[#8e9299]">
                Applying Japan's UrEDAS / S-net early warning physics to Indian Himalayan & Oceanic fault belts (NCS / ITEWS)
              </p>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center space-x-1 bg-[#0c0d0e] p-1 rounded-lg border border-[#2a2c31] overflow-x-auto">
            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeView === 'map'
                  ? 'bg-emerald-500 text-black shadow-sm font-bold'
                  : 'text-[#8e9299] hover:text-white hover:bg-[#1f2024]'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Live World Map</span>
            </button>

            <button
              onClick={() => {
                setActiveView('eew_simulator');
                setIsSimPlaying(true);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeView === 'eew_simulator'
                  ? 'bg-amber-500 text-black shadow-sm font-bold'
                  : 'text-[#8e9299] hover:text-white hover:bg-[#1f2024]'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>JMA Wavefront EEW</span>
            </button>

            <button
              onClick={() => setActiveView('tsunami_engine')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeView === 'tsunami_engine'
                  ? 'bg-cyan-500 text-black shadow-sm font-bold'
                  : 'text-[#8e9299] hover:text-white hover:bg-[#1f2024]'
              }`}
            >
              <Waves className="h-3.5 w-3.5" />
              <span>Tsunami Runup Engine</span>
            </button>

            <button
              onClick={() => setActiveView('aftershock_ai')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeView === 'aftershock_ai'
                  ? 'bg-purple-500 text-white shadow-sm font-bold'
                  : 'text-[#8e9299] hover:text-white hover:bg-[#1f2024]'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Fault Gap & ETAS AI</span>
            </button>

            <button
              onClick={() => setActiveView('tech_benchmark')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeView === 'tech_benchmark'
                  ? 'bg-indigo-500 text-white shadow-sm font-bold'
                  : 'text-[#8e9299] hover:text-white hover:bg-[#1f2024]'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Japan vs India Benchmark</span>
            </button>
          </div>
        </div>

        {/* Global Summary Bar & Preset Scenarios */}
        <div className="mt-2.5 pt-2.5 border-t border-[#2a2c31] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#8e9299] font-medium flex items-center">
              <Compass className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              Presets:
            </span>
            {SCENARIO_PRESETS.map(sc => (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all ${
                  selectedEarthquake?.id === sc.id
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-[#1a1c20] border-[#2a2c31] text-[#b0b4ba] hover:text-white hover:border-[#3e424b]'
                }`}
              >
                {sc.title.split('(')[0].trim()}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-[#8e9299]">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1 text-emerald-400" />
              Refreshed: {lastRefreshed.toLocaleTimeString()}
            </span>
            <button
              onClick={loadEarthquakes}
              disabled={isLoading}
              className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Live Feeds</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Earthquake Stream Feed */}
        <div className="w-80 lg:w-96 border-r border-[#2a2c31] bg-[#111215] flex flex-col shrink-0">
          {/* Filter Controls */}
          <div className="p-3 border-b border-[#2a2c31] space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8e9299]" />
              <input
                type="text"
                placeholder="Search global region, fault, city..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1c20] border border-[#2a2c31] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#8e9299] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between gap-1 text-[11px]">
              <select
                value={filterRegion}
                onChange={e => setFilterRegion(e.target.value as any)}
                className="bg-[#1a1c20] border border-[#2a2c31] rounded px-2 py-1 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Global Quakes</option>
                <option value="india_himalaya">India & Himalaya (NCS)</option>
                <option value="japan">Japan & Trench (JMA)</option>
                <option value="ring_of_fire">Pacific Ring of Fire</option>
                <option value="major">Major Events (M ≥ 6.0)</option>
              </select>

              <select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value as any)}
                className="bg-[#1a1c20] border border-[#2a2c31] rounded px-2 py-1 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="day_all">Past 24 Hours</option>
                <option value="hour">Past Hour (Live)</option>
                <option value="day_4.5">M4.5+ Past Day</option>
                <option value="week_4.5">M4.5+ Past 7 Days</option>
                <option value="month_sig">Significant Month</option>
              </select>
            </div>
          </div>

          {/* Quake Cards Stream */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-[#8e9299]">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-emerald-400" />
                Parsing worldwide USGS, JMA & NCS seismic telemetry...
              </div>
            ) : filteredQuakes.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8e9299]">
                No earthquakes found matching the selected filters.
              </div>
            ) : (
              filteredQuakes.map(quake => {
                const isSelected = selectedEarthquake?.id === quake.id;
                const mag = quake.magnitude;
                const isTsunami = quake.tsunamiPotential !== 'None';

                let magColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
                if (mag >= 7.0) magColor = 'text-red-400 border-red-500/50 bg-red-950/60 font-black animate-pulse';
                else if (mag >= 6.0) magColor = 'text-orange-400 border-orange-500/40 bg-orange-950/50';
                else if (mag >= 4.5) magColor = 'text-amber-400 border-amber-500/30 bg-amber-950/40';

                return (
                  <div
                    key={quake.id}
                    onClick={() => {
                      setSelectedEarthquake(quake);
                      setSimElapsedTimeSec(0);
                      setIsSimPlaying(true);
                    }}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e232a] border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-[#151619] border-[#24262b] hover:border-[#383b42] hover:bg-[#1a1c20]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${magColor}`}>
                          M {mag.toFixed(1)}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-white line-clamp-1">
                            {quake.place}
                          </div>
                          <div className="text-[10px] text-[#8e9299] flex items-center space-x-2 mt-0.5">
                            <span>Depth: {quake.coordinates[2]} km</span>
                            <span>•</span>
                            <span>{new Date(quake.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      {isTsunami && (
                        <span className="p-1 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30" title="Tsunami potential detected">
                          <Waves className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Regional Intensity & Lead Time Badges */}
                    <div className="mt-2 pt-2 border-t border-[#222429] flex items-center justify-between text-[10px]">
                      <span className="text-[#8e9299]">
                        JMA: <span className="text-amber-300 font-semibold">{quake.jmaIntensity}</span>
                      </span>
                      <span className="text-[#8e9299]">
                        MSK: <span className="text-purple-300 font-semibold">{quake.mskIntensity.split('(')[0]}</span>
                      </span>
                      <span className="text-emerald-400 font-mono font-medium">
                        {quake.regionCategory}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Live System Stats */}
          <div className="p-3 border-t border-[#2a2c31] bg-[#0e0f11] text-[11px] text-[#8e9299] space-y-1">
            <div className="flex justify-between">
              <span>Active Seismic Stations:</span>
              <span className="text-white font-mono">1,842 (JMA S-net + NCS)</span>
            </div>
            <div className="flex justify-between">
              <span>Ocean Bottom Sensors (OBPG):</span>
              <span className="text-cyan-400 font-mono">150 DONET + 12 INCOIS DART</span>
            </div>
            <div className="flex justify-between">
              <span>AI UrEDAS Detection Latency:</span>
              <span className="text-emerald-400 font-mono">3.2 seconds</span>
            </div>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#0c0d0e]">
          {/* TAB 1: INTERACTIVE WORLD SEISMIC MAP */}
          {activeView === 'map' && (
            <div className="p-4 space-y-4 max-w-7xl mx-auto w-full">
              {/* Event Spotlight Header Card */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        Active Hypocenter Inspection
                      </span>
                      <span className="text-xs text-[#8e9299]">
                        {new Date(activeEvent.time).toUTCString()}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">
                      {activeEvent.title}
                    </h2>
                    <p className="text-xs text-[#8e9299] mt-0.5">
                      Coordinates: {activeEvent.coordinates[1].toFixed(3)}°N, {activeEvent.coordinates[0].toFixed(3)}°E | Focal Depth: {activeEvent.coordinates[2]} km | Type: {activeEvent.faultMechanism || 'Active Tectonic Rupture'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setActiveView('eew_simulator');
                        setIsSimPlaying(true);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all shadow-md"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Simulate JMA-EEW Wavefront</span>
                    </button>

                    {activeEvent.tsunamiPotential !== 'None' && (
                      <button
                        onClick={() => setActiveView('tsunami_engine')}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition-all shadow-md"
                      >
                        <Waves className="h-4 w-4" />
                        <span>Tsunami Forecast</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Instant Assessment Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#24262b]">
                  <div className="bg-[#111215] p-2.5 rounded-lg border border-[#2a2c31]">
                    <div className="text-[10px] text-[#8e9299] uppercase font-semibold">JMA Intensity Scale</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">{activeEvent.jmaIntensity}</div>
                    <div className="text-[10px] text-[#8e9299]">Japan Standard (0-7)</div>
                  </div>

                  <div className="bg-[#111215] p-2.5 rounded-lg border border-[#2a2c31]">
                    <div className="text-[10px] text-[#8e9299] uppercase font-semibold">Indian Intensity (MSK-64)</div>
                    <div className="text-sm font-bold text-purple-400 mt-0.5">{activeEvent.mskIntensity.split('(')[0]}</div>
                    <div className="text-[10px] text-[#8e9299]">IS 1893 Seismic Code</div>
                  </div>

                  <div className="bg-[#111215] p-2.5 rounded-lg border border-[#2a2c31]">
                    <div className="text-[10px] text-[#8e9299] uppercase font-semibold">Peak Ground Accel (PGA)</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">{(activeEvent.pgaG * 100).toFixed(1)}% g ({Math.round(activeEvent.pgaG * 980.665)} Gal)</div>
                    <div className="text-[10px] text-[#8e9299]">Near-Field Shaking</div>
                  </div>

                  <div className="bg-[#111215] p-2.5 rounded-lg border border-[#2a2c31]">
                    <div className="text-[10px] text-[#8e9299] uppercase font-semibold">Tsunami Threat Potential</div>
                    <div className={`text-sm font-bold mt-0.5 ${
                      activeEvent.tsunamiPotential === 'Catastrophic' || activeEvent.tsunamiPotential === 'High'
                        ? 'text-red-400'
                        : activeEvent.tsunamiPotential === 'Moderate'
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }`}>
                      {activeEvent.tsunamiPotential}
                    </div>
                    <div className="text-[10px] text-[#8e9299]">Ocean Bottom Inversion</div>
                  </div>
                </div>
              </div>

              {/* Graphical Global Map Canvas Representation */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 overflow-hidden relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Interactive Tectonic Plate & Subduction Zone Monitor
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-[#8e9299]">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>Depth &lt; 70km (Shallow)</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>70-300km (Intermediate)</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>&gt; 300km (Deep Subduction)</span>
                  </div>
                </div>

                {/* SVG Visual Globe & Fault Map */}
                <div className="relative w-full h-80 bg-[#0a0b0d] rounded-lg border border-[#24262b] overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
                    <defs>
                      <radialGradient id="epicenterGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#ef4444" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Graticule Grid Lines */}
                    {[100, 200, 300, 400, 500, 600, 700].map(x => (
                      <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="400" stroke="#1f2228" strokeWidth="0.75" strokeDasharray="3 3" />
                    ))}
                    {[80, 160, 240, 320].map(y => (
                      <line key={`y-${y}`} x1="0" y1={y} x2="800" y2={y} stroke="#1f2228" strokeWidth="0.75" strokeDasharray="3 3" />
                    ))}

                    {/* Continents Outlines (Simplified stylized paths) */}
                    {/* Eurasia & India */}
                    <path
                      d="M 400 120 Q 450 100 520 110 Q 560 140 540 180 Q 510 220 480 240 Q 460 210 440 200 Q 420 220 400 200 Z"
                      fill="#16181d"
                      stroke="#2a2e37"
                      strokeWidth="1"
                    />
                    {/* Indian Subcontinent */}
                    <path
                      d="M 460 180 L 485 245 L 505 190 Z"
                      fill="#1c2026"
                      stroke="#38404e"
                      strokeWidth="1.2"
                    />
                    {/* Himalayan Arc Fault Line */}
                    <path
                      d="M 445 175 Q 475 168 510 178"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <text x="450" y="163" fill="#f87171" fontSize="9" fontWeight="bold">Himalayan Thrust (MFT/MBT)</text>

                    {/* Andaman-Sumatra Subduction Arc */}
                    <path
                      d="M 515 210 Q 520 240 535 270 Q 560 290 590 300"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                    />
                    <text x="525" y="240" fill="#22d3ee" fontSize="8">Andaman Trench</text>

                    {/* Japan Archipelago & Japan Trench */}
                    <path
                      d="M 610 140 Q 625 155 635 180"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M 625 135 Q 640 155 650 185"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeDasharray="3 2"
                    />
                    <text x="635" y="140" fill="#4ade80" fontSize="9" fontWeight="bold">Japan (JMA/S-net)</text>

                    {/* Pacific Ring of Fire Arc */}
                    <path
                      d="M 640 100 Q 700 80 750 110 Q 780 180 760 260 Q 730 340 700 380"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="1.5"
                      strokeDasharray="5 3"
                    />

                    {/* Plot All Earthquakes on Map */}
                    {filteredQuakes.map(q => {
                      const [lon, lat, depth] = q.coordinates;
                      // Convert lon/lat to 800x400 SVG coords
                      const svgX = ((lon + 180) / 360) * 800;
                      const svgY = ((90 - lat) / 180) * 400;
                      const radius = Math.max(3, (q.magnitude - 3) * 3);

                      let dotColor = '#ef4444'; // shallow
                      if (depth > 300) dotColor = '#3b82f6';
                      else if (depth > 70) dotColor = '#f59e0b';

                      const isThisActive = activeEvent.id === q.id;

                      return (
                        <g key={q.id} className="cursor-pointer" onClick={() => setSelectedEarthquake(q)}>
                          {isThisActive && (
                            <circle
                              cx={svgX}
                              cy={svgY}
                              r={radius * 3}
                              fill="url(#epicenterGlow)"
                              className="animate-ping"
                            />
                          )}
                          <circle
                            cx={svgX}
                            cy={svgY}
                            r={radius}
                            fill={dotColor}
                            stroke={isThisActive ? '#ffffff' : '#000000'}
                            strokeWidth={isThisActive ? 2 : 1}
                            opacity={0.85}
                          />
                          {q.magnitude >= 6.5 && (
                            <text
                              x={svgX + radius + 3}
                              y={svgY + 3}
                              fill="#ffffff"
                              fontSize="9"
                              fontWeight="bold"
                              className="pointer-events-none"
                            >
                              M{q.magnitude.toFixed(1)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* On-Map Focus Overlay Box */}
                  <div className="absolute bottom-3 left-3 bg-[#111215]/90 border border-[#2a2c31] rounded-lg p-2.5 text-xs backdrop-blur">
                    <div className="text-[10px] uppercase font-bold text-emerald-400">Selected Epicenter</div>
                    <div className="font-semibold text-white mt-0.5">{activeEvent.place}</div>
                    <div className="text-[11px] text-[#8e9299]">
                      Magnitude: <span className="text-white font-bold">M{activeEvent.magnitude.toFixed(1)}</span> • Depth: <span className="text-white">{activeEvent.coordinates[2]} km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* City Impact Summary Table */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Radio className="h-4 w-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Metropolitan Shaking & Lead Time Table (P/S Wave Calculation)
                    </h3>
                  </div>
                  <span className="text-xs text-[#8e9299]">
                    Sorted by Epicentral Distance
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#2a2c31] text-[#8e9299] text-[11px] uppercase">
                        <th className="pb-2">Target City</th>
                        <th className="pb-2">Distance</th>
                        <th className="pb-2">P-Wave Arrival</th>
                        <th className="pb-2">S-Wave Arrival</th>
                        <th className="pb-2">EEW Lead Time</th>
                        <th className="pb-2">JMA Shindo</th>
                        <th className="pb-2">PGA (%g)</th>
                        <th className="pb-2">Safety Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222429]">
                      {cityImpacts.slice(0, 8).map((city, idx) => (
                        <tr key={city.cityName} className="hover:bg-[#1c1d22]">
                          <td className="py-2.5 font-semibold text-white flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-emerald-400" />
                            {city.cityName}
                            <span className="text-[10px] text-[#8e9299] ml-1.5">({city.stateCountry})</span>
                          </td>
                          <td className="py-2.5 font-mono text-[#b0b4ba]">{city.distanceKm} km</td>
                          <td className="py-2.5 font-mono text-cyan-300">+{city.pWaveArrivalSec}s</td>
                          <td className="py-2.5 font-mono text-amber-300">+{city.sWaveArrivalSec}s</td>
                          <td className="py-2.5 font-mono font-bold text-emerald-400">
                            {city.leadTimeSec > 0 ? `${city.leadTimeSec}s warning` : 'Inside Blind Zone'}
                          </td>
                          <td className="py-2.5 font-bold text-amber-400">{city.jmaShindo}</td>
                          <td className="py-2.5 font-mono text-white">{(city.estimatedPgaG * 100).toFixed(1)}%</td>
                          <td className="py-2.5 text-[11px] text-[#b0b4ba] max-w-xs truncate" title={city.safetyAction}>
                            {city.safetyAction}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JMA-EEW & NCS P/S WAVEFRONT REAL-TIME SIMULATOR */}
          {activeView === 'eew_simulator' && (
            <div className="p-4 space-y-4 max-w-7xl mx-auto w-full">
              {/* Simulator Radar & Controller */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-500/30 uppercase">
                        UrEDAS / Tau_c &amp; Pd Rupture Model
                      </span>
                      <span className="text-xs text-[#8e9299]">
                        Origin: {activeEvent.place} (M{activeEvent.magnitude.toFixed(1)})
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">
                      Real-Time Shockwave Propagation & Lead Time Countdown
                    </h2>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsSimPlaying(!isSimPlaying)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                        isSimPlaying
                          ? 'bg-amber-500 text-black hover:bg-amber-400'
                          : 'bg-emerald-500 text-black hover:bg-emerald-400'
                      }`}
                    >
                      {isSimPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      <span>{isSimPlaying ? 'Pause Simulation' : 'Start Wavefront'}</span>
                    </button>

                    <button
                      onClick={() => setSimElapsedTimeSec(0)}
                      className="p-1.5 rounded bg-[#1f2024] border border-[#2a2c31] text-[#8e9299] hover:text-white"
                      title="Reset timeline"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>

                    <select
                      value={simSpeed}
                      onChange={e => setSimSpeed(Number(e.target.value))}
                      className="bg-[#1f2024] border border-[#2a2c31] rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="1">1x Realtime</option>
                      <option value="2">2x Speed</option>
                      <option value="5">5x Speed</option>
                      <option value="10">10x Speed</option>
                    </select>
                  </div>
                </div>

                {/* Animated Concentric Wavefront Radar Grid */}
                <div className="relative w-full h-88 bg-[#090a0c] rounded-xl border border-[#2a2c31] overflow-hidden flex items-center justify-center p-4">
                  <svg className="w-full h-full max-w-2xl max-h-80" viewBox="-300 -300 600 600">
                    {/* Distance concentric range rings */}
                    {[100, 200, 300, 400, 500].map(r => {
                      const scaledR = r * 0.55;
                      return (
                        <g key={`ring-${r}`}>
                          <circle
                            cx="0"
                            cy="0"
                            r={scaledR}
                            fill="none"
                            stroke="#1f232b"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="5"
                            y={-scaledR + 12}
                            fill="#606673"
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {r} km
                          </text>
                        </g>
                      );
                    })}

                    {/* Radar Crosshairs */}
                    <line x1="-300" y1="0" x2="300" y2="0" stroke="#1c2027" strokeWidth="1" />
                    <line x1="0" y1="-300" x2="0" y2="300" stroke="#1c2027" strokeWidth="1" />

                    {/* P-Wave Expanding Ring (Compressional / Warning Wave, ~6.1 km/s) */}
                    <circle
                      cx="0"
                      cy="0"
                      r={Math.min(300, pWaveRadiusKm * 0.55)}
                      fill="rgba(6, 182, 212, 0.05)"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      strokeDasharray="6 3"
                    />

                    {/* S-Wave Expanding Ring (Destructive Shear Wave, ~3.55 km/s) */}
                    <circle
                      cx="0"
                      cy="0"
                      r={Math.min(300, sWaveRadiusKm * 0.55)}
                      fill="rgba(239, 68, 68, 0.12)"
                      stroke="#ef4444"
                      strokeWidth="3"
                    />

                    {/* Hypocenter Core */}
                    <circle cx="0" cy="0" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" className="animate-pulse" />
                    <text x="8" y="4" fill="#f87171" fontSize="10" fontWeight="bold">EPICENTER (M{activeEvent.magnitude.toFixed(1)})</text>

                    {/* Monitored Cities plotted relative to epicenter */}
                    {cityImpacts.slice(0, 10).map((city, idx) => {
                      const angle = (idx * (360 / 10) * Math.PI) / 180;
                      const distScaled = city.distanceKm * 0.55;
                      const cityX = Math.cos(angle) * distScaled;
                      const cityY = Math.sin(angle) * distScaled;

                      const isSHit = sWaveRadiusKm >= city.distanceKm;
                      const isPHit = pWaveRadiusKm >= city.distanceKm;

                      let statusColor = '#9ca3af'; // Waiting
                      if (isSHit) statusColor = '#ef4444'; // Shaking actively!
                      else if (isPHit) statusColor = '#06b6d4'; // P-wave early warning received!

                      return (
                        <g key={city.cityName} transform={`translate(${cityX}, ${cityY})`}>
                          <circle cx="0" cy="0" r="4.5" fill={statusColor} stroke="#000" strokeWidth="1" />
                          <text
                            x="6"
                            y="3"
                            fill={isSHit ? '#fca5a5' : isPHit ? '#67e8f9' : '#e5e7eb'}
                            fontSize="9"
                            fontWeight="bold"
                          >
                            {city.cityName}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Overlay Timer & Speed Status */}
                  <div className="absolute top-4 left-4 bg-[#111215]/90 border border-[#2a2c31] rounded-lg p-3 text-xs backdrop-blur">
                    <div className="text-[10px] text-[#8e9299] uppercase font-bold">Elapsed Propagation Time</div>
                    <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                      T + {simElapsedTimeSec.toFixed(1)}s
                    </div>
                    <div className="text-[11px] text-[#8e9299] mt-1 space-y-0.5">
                      <div>P-Wave Radius: <span className="text-cyan-400 font-mono font-semibold">{Math.round(pWaveRadiusKm)} km</span> (6.1 km/s)</div>
                      <div>S-Wave Radius: <span className="text-red-400 font-mono font-semibold">{Math.round(sWaveRadiusKm)} km</span> (3.55 km/s)</div>
                    </div>
                  </div>
                </div>

                {/* City Shaking Status Cards with Countdown Clocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  {cityImpacts.slice(0, 6).map(city => {
                    const remainingSeconds = Math.max(0, city.sWaveArrivalSec - simElapsedTimeSec);
                    const isSHit = simElapsedTimeSec >= city.sWaveArrivalSec;
                    const isPHit = simElapsedTimeSec >= city.pWaveArrivalSec;

                    return (
                      <div
                        key={city.cityName}
                        className={`p-3 rounded-lg border transition-all ${
                          isSHit
                            ? 'bg-red-950/40 border-red-500/50 shadow-md'
                            : isPHit
                            ? 'bg-amber-950/40 border-amber-500/50 animate-pulse'
                            : 'bg-[#111215] border-[#2a2c31]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{city.cityName}</span>
                          <span className="text-[10px] font-mono text-[#8e9299]">{city.distanceKm} km away</span>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-[#8e9299]">Status</div>
                            <div className={`text-xs font-bold uppercase mt-0.5 ${
                              isSHit ? 'text-red-400' : isPHit ? 'text-amber-300' : 'text-emerald-400'
                            }`}>
                              {isSHit ? 'DESTRUCTIVE S-WAVE HIT' : isPHit ? 'P-WAVE DETECTED (WARN)' : 'QUIET / PRE-ARRIVAL'}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-[10px] text-[#8e9299]">S-Wave Countdown</div>
                            <div className={`text-base font-black font-mono mt-0.5 ${
                              isSHit ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {isSHit ? '0.0s' : `-${remainingSeconds.toFixed(1)}s`}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#222429] text-[10px] flex justify-between text-[#8e9299]">
                          <span>PGA: <strong className="text-white">{(city.estimatedPgaG * 100).toFixed(1)}%g</strong></span>
                          <span>JMA: <strong className="text-amber-400">{city.jmaShindo}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INCOIS & JMA TSUNAMI TRAVEL TIME & RUNUP ENGINE */}
          {activeView === 'tsunami_engine' && (
            <div className="p-4 space-y-4 max-w-7xl mx-auto w-full">
              {/* Tsunami Assessment Banner */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        tsunamiThreat.threatLevel === 'MAJOR_WARNING'
                          ? 'bg-red-950 text-red-400 border-red-500 animate-pulse'
                          : tsunamiThreat.threatLevel === 'WARNING'
                          ? 'bg-orange-950 text-orange-400 border-orange-500'
                          : tsunamiThreat.threatLevel === 'ADVISORY'
                          ? 'bg-amber-950 text-amber-400 border-amber-500'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {tsunamiThreat.threatLevel.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[#8e9299]">
                        Ocean Basin: {tsunamiThreat.oceanBasin}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">
                      Hydrodynamic Tsunami Wave Propagation & Coastal Runup Forecast
                    </h2>
                    <p className="text-xs text-[#8e9299] mt-0.5">
                      Phase Speed C = √(g · h) estimated at {tsunamiThreat.estimatedDeepWaterVelocityKmh} km/h (Deep ocean depth ~3,500m)
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-[#8e9299] uppercase">Initial Seafloor Uplift</div>
                    <div className="text-xl font-black text-cyan-400 font-mono">
                      Δz ≈ {tsunamiThreat.initialDisplacementMeters} meters
                    </div>
                  </div>
                </div>

                {/* INCOIS & JMA Official Directives */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#24262b]">
                  <div className="bg-[#111215] p-3 rounded-lg border border-[#2a2c31]">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-400 mb-1">
                      <ShieldAlert className="h-4 w-4" />
                      <span>INCOIS ITEWS (Indian Tsunami Early Warning System)</span>
                    </div>
                    <p className="text-xs text-[#b0b4ba] leading-relaxed">
                      {tsunamiThreat.incoisSummary}
                    </p>
                  </div>

                  <div className="bg-[#111215] p-3 rounded-lg border border-[#2a2c31]">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 mb-1">
                      <Radio className="h-4 w-4" />
                      <span>JMA & S-net Seafloor Cable Network Evaluation</span>
                    </div>
                    <p className="text-xs text-[#b0b4ba] leading-relaxed">
                      {tsunamiThreat.jmaSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coastal Tide Gauges ETA & Wave Height Table */}
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Waves className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Coastal Impact Forecast & Arrival ETA Table (Green's Law Amplified)
                    </h3>
                  </div>
                  <span className="text-xs text-[#8e9299]">
                    Sorted by Wave Arrival Time (ETA)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#2a2c31] text-[#8e9299] text-[11px] uppercase">
                        <th className="pb-2">Coastal Gauge / Harbor</th>
                        <th className="pb-2">Region</th>
                        <th className="pb-2">Distance</th>
                        <th className="pb-2">Estimated Arrival (ETA)</th>
                        <th className="pb-2">Predicted Wave Height</th>
                        <th className="pb-2">Max Runup Elevation</th>
                        <th className="pb-2">Threat Level</th>
                        <th className="pb-2">Evacuation Directive</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222429]">
                      {tsunamiThreat.coastalStations.map(station => (
                        <tr key={station.coastalPoint} className="hover:bg-[#1c1d22]">
                          <td className="py-2.5 font-semibold text-white">
                            {station.coastalPoint}
                          </td>
                          <td className="py-2.5 font-mono text-[#8e9299]">{station.region}</td>
                          <td className="py-2.5 font-mono text-[#b0b4ba]">{station.distanceKm} km</td>
                          <td className="py-2.5 font-mono font-bold text-cyan-300">
                            {Math.floor(station.waveEtaMinutes / 60)}h {station.waveEtaMinutes % 60}m
                          </td>
                          <td className="py-2.5 font-mono font-bold text-amber-300">
                            {station.predictedWaveHeightM.toFixed(2)} m
                          </td>
                          <td className="py-2.5 font-mono text-purple-300">
                            {station.maxRunupElevationM.toFixed(2)} m
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              station.threatLevel.includes('Major')
                                ? 'bg-red-950 text-red-400 border border-red-500'
                                : station.threatLevel.includes('Warning')
                                ? 'bg-orange-950 text-orange-400 border border-orange-500'
                                : station.threatLevel.includes('Advisory')
                                ? 'bg-amber-950 text-amber-400 border border-amber-500'
                                : 'bg-emerald-950 text-emerald-400'
                            }`}>
                              {station.threatLevel}
                            </span>
                          </td>
                          <td className="py-2.5 text-[11px] text-[#b0b4ba] max-w-xs truncate" title={station.evacuationDirective}>
                            {station.evacuationDirective}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI FAULT GAP & AFTERSHOCK PROBABILITY (ETAS MODEL) */}
          {activeView === 'aftershock_ai' && (
            <div className="p-4 space-y-4 max-w-7xl mx-auto w-full">
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-500/30 uppercase">
                    Gutenberg-Richter & ETAS AI Engine
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  High-Risk Seismic Fault Gaps & Aftershock Probability Modeling
                </h2>
                <p className="text-xs text-[#8e9299] mt-0.5">
                  Assessing accumulated tectonic strain deficit across the Himalayan Collision Zone, Nankai Trough, and Andaman Subduction Belt.
                </p>
              </div>

              {/* Seismic Zones Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BENCHMARK_SEISMIC_ZONES.map(zone => (
                  <div key={zone.id} className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          zone.country === 'India' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {zone.country} Zone
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] text-[#8e9299]">AI Risk Index:</span>
                          <span className="text-xs font-bold text-red-400 font-mono">{zone.aiRiskScore}/100</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white mt-2">{zone.name}</h3>
                      <p className="text-xs text-[#8e9299] mt-1">{zone.tectonicSetting}</p>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#24262b] text-xs">
                        <div className="bg-[#111215] p-2 rounded border border-[#222429]">
                          <div className="text-[10px] text-[#8e9299]">Slip Rate (Locked)</div>
                          <div className="font-bold text-white font-mono">{zone.lockedFaultSlipRateMmYr} mm/year</div>
                        </div>

                        <div className="bg-[#111215] p-2 rounded border border-[#222429]">
                          <div className="text-[10px] text-[#8e9299]">Max Credible Quake</div>
                          <div className="font-bold text-red-400 font-mono">M {zone.maxCredibleMagnitude.toFixed(1)}</div>
                        </div>

                        <div className="bg-[#111215] p-2 rounded border border-[#222429]">
                          <div className="text-[10px] text-[#8e9299]">Seismic Gap Elapsed</div>
                          <div className="font-bold text-amber-300 font-mono">{zone.seismicGapElapsedYears} years</div>
                        </div>

                        <div className="bg-[#111215] p-2 rounded border border-[#222429]">
                          <div className="text-[10px] text-[#8e9299]">Population Exposed</div>
                          <div className="font-bold text-purple-300 font-mono">{zone.populationExposedMillions} Million</div>
                        </div>
                      </div>

                      <div className="mt-3 text-[11px] text-[#8e9299]">
                        <strong className="text-white">Vulnerable Metros: </strong>
                        {zone.keyVulnerableCities.join(', ')}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#24262b] flex items-center justify-between text-xs">
                      <span className="text-[10px] text-[#8e9299]">{zone.readinessRating}</span>
                      <button
                        onClick={() => {
                          const matching = SCENARIO_PRESETS.find(p => p.id.includes(zone.id.substring(0, 8)));
                          if (matching) handleSelectScenario(matching);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center"
                      >
                        <span>Simulate Rupture</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: JAPAN VS INDIA TECH BENCHMARK */}
          {activeView === 'tech_benchmark' && (
            <div className="p-4 space-y-4 max-w-7xl mx-auto w-full">
              <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-500/30 uppercase">
                    Architectural Deep-Dive
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  Technology Benchmark: Japan (JMA / S-net) vs India (NCS / INCOIS ITEWS)
                </h2>
                <p className="text-xs text-[#8e9299] mt-0.5">
                  Evaluating how Japan's subsea optical cable arrays, UrEDAS P-wave algorithms, and J-Alert automation map directly into India's seismic and tsunami early warning mesh.
                </p>
              </div>

              {/* Benchmark Cards */}
              <div className="space-y-4">
                {TECH_BENCHMARK_DATA.map((item, idx) => (
                  <div key={idx} className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                      <Zap className="h-4 w-4 mr-1.5 text-amber-400" />
                      {item.dimension}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Japan Box */}
                      <div className="bg-[#111215] p-3 rounded-lg border border-emerald-500/30">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-emerald-400">JAPAN (JMA / NIED)</span>
                          <span className="text-[10px] text-[#8e9299]">Pioneer Benchmark</span>
                        </div>
                        <div className="text-xs font-semibold text-white">{item.japanSystem.name}</div>
                        <p className="text-xs text-[#b0b4ba] mt-1 leading-relaxed">{item.japanSystem.details}</p>
                        <div className="mt-2 pt-2 border-t border-[#222429] text-[11px] text-emerald-300 font-mono">
                          Key Metric: {item.japanSystem.metrics}
                        </div>
                      </div>

                      {/* India Box */}
                      <div className="bg-[#111215] p-3 rounded-lg border border-amber-500/30">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-amber-400">INDIA (NCS / INCOIS / NDMA)</span>
                          <span className="text-[10px] text-[#8e9299]">Active Implementation</span>
                        </div>
                        <div className="text-xs font-semibold text-white">{item.indiaSystem.name}</div>
                        <p className="text-xs text-[#b0b4ba] mt-1 leading-relaxed">{item.indiaSystem.details}</p>
                        <div className="mt-2 pt-2 border-t border-[#222429] text-[11px] text-amber-300 font-mono">
                          Key Metric: {item.indiaSystem.metrics}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-[10px] text-[#8e9299] flex items-center justify-between">
                      <span>Global Standard Reference: <strong>{item.globalStandard}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

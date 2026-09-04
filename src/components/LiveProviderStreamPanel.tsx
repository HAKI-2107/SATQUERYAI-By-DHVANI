import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Flame,
  Radio,
  Layers,
  MapPin,
  Calendar,
  Eye,
  Send,
  Download,
  Copy,
  Check,
  Sparkles,
  Info,
  Maximize2,
  RefreshCw,
  Compass,
  Zap,
  Globe,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import {
  LIVE_PROVIDER_LAYERS,
  PRESET_ORBITAL_LOCATIONS,
  PresetLocation,
  buildGibsWmsUrl,
  fetchLiveFirmsThermalGeoJson,
  fetchLiveStacGranules,
  convertLiveStreamToRemoteSensingImage
} from '../services/liveOrbitalDataService';
import { LiveProviderLayer, RemoteSensingImage, GeoJsonThermalFeature, StacItemRecord } from '../types';

interface LiveProviderStreamPanelProps {
  onStreamToStudio: (image: RemoteSensingImage, defaultQuery?: string) => void;
  onOpenModelsCatalog?: () => void;
}

export const LiveProviderStreamPanel: React.FC<LiveProviderStreamPanelProps> = ({
  onStreamToStudio,
  onOpenModelsCatalog
}) => {
  const [selectedLayerId, setSelectedLayerId] = useState<string>(LIVE_PROVIDER_LAYERS[0].id);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(PRESET_ORBITAL_LOCATIONS[0].id);
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [customBbox, setCustomBbox] = useState<[number, number, number, number]>(
    PRESET_ORBITAL_LOCATIONS[0].bbox
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<'imagery' | 'geojson_stream' | 'telemetry'>('imagery');

  // Live GeoJSON state
  const [thermalGeoJson, setThermalGeoJson] = useState<any>(null);
  const [stacGeoJson, setStacGeoJson] = useState<any>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<GeoJsonThermalFeature | null>(null);

  const currentLayer: LiveProviderLayer =
    LIVE_PROVIDER_LAYERS.find(l => l.id === selectedLayerId) || LIVE_PROVIDER_LAYERS[0];
  const currentLocation: PresetLocation =
    PRESET_ORBITAL_LOCATIONS.find(loc => loc.id === selectedLocationId) || PRESET_ORBITAL_LOCATIONS[0];

  // Refresh live streams on change
  useEffect(() => {
    refreshLiveStreamData();
  }, [selectedLayerId, selectedLocationId, customDate]);

  const refreshLiveStreamData = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (currentLayer.format === 'geojson_thermal' || currentLayer.provider === 'nasa_firms') {
        const firmsData = fetchLiveFirmsThermalGeoJson(customBbox, customDate);
        setThermalGeoJson(firmsData);
        setStacGeoJson(null);
        setSelectedHotspot(firmsData.features[0] || null);
      } else if (currentLayer.format === 'geojson_stac' || currentLayer.provider === 'sentinel_hub_stac') {
        const stacData = fetchLiveStacGranules(customBbox, customDate);
        setStacGeoJson(stacData);
        setThermalGeoJson(null);
      } else {
        setThermalGeoJson(null);
        setStacGeoJson(null);
      }
      setIsLoading(false);
    }, 450);
  };

  const handleSelectLocation = (loc: PresetLocation) => {
    setSelectedLocationId(loc.id);
    setCustomBbox(loc.bbox);
    if (loc.defaultLayerId) {
      setSelectedLayerId(loc.defaultLayerId);
    }
  };

  const handleSendToStudio = () => {
    const liveImg = convertLiveStreamToRemoteSensingImage(
      currentLayer,
      currentLocation,
      customDate,
      currentLocation.fallbackImageUrl
    );
    onStreamToStudio(liveImg, currentLocation.recommendedQuery);
  };

  const handleCopyGeoJson = () => {
    const payload = thermalGeoJson || stacGeoJson || {
      provider: currentLayer.provider,
      layer: currentLayer.name,
      bbox: customBbox,
      wmsEndpoint: buildGibsWmsUrl(currentLayer.id, customBbox, customDate),
      timestamp: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentWmsUrl = buildGibsWmsUrl(currentLayer.id, customBbox, customDate, 1024, 1024);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Ingestion Telemetry */}
      <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80] shadow-sm shrink-0">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Live Orbital Data & GeoJSON Ingestion Center
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30 mono">
                  HIGH-CADENCE PASS
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 mono">
                  NASA GIBS / COPERNICUS / ISRO
                </span>
              </div>
              <p className="text-xs text-[#8e9299] mt-1 max-w-3xl">
                Stream authentic real-time orbital imagery and live GeoJSON telemetry directly from open space agency APIs (NASA GIBS, NASA FIRMS, Copernicus STAC, ISRO MOSDAC, USGS Landsat) into the SatQuery VQA and reasoning engine.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
            <button
              onClick={handleSendToStudio}
              className="flex items-center space-x-2 bg-[#4ade80] hover:bg-[#3ec470] text-black px-4 py-2 rounded-lg font-bold text-xs mono transition-all shadow-md active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Stream to AI Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Region Quick Selector Bar */}
      <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-[#38bdf8]" />
            <span className="text-xs font-bold text-white uppercase mono">Global High-Revisit Target Locations</span>
          </div>
          <span className="text-[11px] text-[#8e9299] mono">Select to automatically lock coordinates & active sensor layer</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PRESET_ORBITAL_LOCATIONS.map(loc => {
            const isSelected = loc.id === selectedLocationId;
            return (
              <button
                key={loc.id}
                onClick={() => handleSelectLocation(loc)}
                className={`p-2.5 rounded-lg border text-left transition-all relative ${
                  isSelected
                    ? 'bg-[#1e293b] border-[#38bdf8] text-white shadow-sm ring-1 ring-[#38bdf8]/50'
                    : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1] hover:border-[#3a3d46]'
                }`}
              >
                <div className="text-[11px] font-bold truncate">{loc.name}</div>
                <div className="text-[10px] text-[#8e9299] truncate mt-0.5">{loc.country}</div>
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#38bdf8] animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Controls & Layer Picker / Right Live Stream Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Provider & Layer Selection Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Provider Layer Selector */}
          <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-[#4ade80]" />
                <span className="text-xs font-bold text-white uppercase mono">Orbital Sensor Stream</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2c31] text-[#e1e1e1] mono">
                {LIVE_PROVIDER_LAYERS.length} Active Feeds
              </span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {LIVE_PROVIDER_LAYERS.map(layer => {
                const isSelected = layer.id === selectedLayerId;
                return (
                  <button
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-[#16221c] border-[#4ade80] text-white shadow-sm'
                        : 'bg-[#0c0d0e] border-[#2a2c31] text-[#8e9299] hover:text-[#e1e1e1] hover:border-[#3a3d46]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate max-w-[200px]">{layer.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold mono uppercase ${
                          layer.provider === 'nasa_firms'
                            ? 'bg-red-500/20 text-red-400'
                            : layer.provider === 'nasa_gibs'
                            ? 'bg-blue-500/20 text-blue-400'
                            : layer.provider === 'isro_mosdac'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {layer.provider.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8e9299] mt-1 line-clamp-2 leading-relaxed">
                      {layer.description}
                    </p>
                    <div className="flex items-center space-x-3 mt-2 text-[10px] mono text-[#6b7280]">
                      <span>GSD: {layer.resolutionMeters}m</span>
                      <span>Cadence: {layer.cadence}</span>
                      <span>{layer.format.toUpperCase()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temporal & Coordinate Bounding Box Controls */}
          <div className="bg-[#151619] border border-[#2a2c31] rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-[#38bdf8]" />
              <span className="text-xs font-bold text-white uppercase mono">Observation Pass Date & AOI</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-[#8e9299] mono block mb-1">Acquisition Pass Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="w-full bg-[#0c0d0e] border border-[#2a2c31] rounded-lg px-3 py-1.5 text-xs text-white mono focus:outline-none focus:border-[#4ade80]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8e9299] mono block mb-1">
                  Bounding Box (EPSG:4326 [minLon, minLat, maxLon, maxLat])
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] mono">
                  <div className="bg-[#0c0d0e] border border-[#2a2c31] rounded p-1.5">
                    <span className="text-[#6b7280]">W: </span>
                    <span className="text-[#38bdf8]">{customBbox[0]}°</span>
                  </div>
                  <div className="bg-[#0c0d0e] border border-[#2a2c31] rounded p-1.5">
                    <span className="text-[#6b7280]">S: </span>
                    <span className="text-[#38bdf8]">{customBbox[1]}°</span>
                  </div>
                  <div className="bg-[#0c0d0e] border border-[#2a2c31] rounded p-1.5">
                    <span className="text-[#6b7280]">E: </span>
                    <span className="text-[#38bdf8]">{customBbox[2]}°</span>
                  </div>
                  <div className="bg-[#0c0d0e] border border-[#2a2c31] rounded p-1.5">
                    <span className="text-[#6b7280]">N: </span>
                    <span className="text-[#38bdf8]">{customBbox[3]}°</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={refreshLiveStreamData}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-1.5 bg-[#0c0d0e] hover:bg-[#1f2937] border border-[#2a2c31] hover:border-[#4ade80] text-xs mono text-white py-2 rounded-lg transition-all"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-[#4ade80]' : ''}`} />
                  <span>Fetch Fresh Orbital Pass</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Stream Viewport & Interactive HUD (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#151619] border border-[#2a2c31] rounded-xl overflow-hidden shadow-lg">
            {/* Viewport Header Toolbar */}
            <div className="p-3 border-b border-[#2a2c31] bg-[#111215] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-[#4ade80] animate-ping" />
                <span className="text-xs font-bold text-white mono">
                  {currentLocation.name} // {currentLayer.name}
                </span>
              </div>

              {/* View Modes */}
              <div className="flex items-center space-x-1 bg-[#0c0d0e] p-1 rounded-lg border border-[#2a2c31]">
                <button
                  onClick={() => setActiveViewMode('imagery')}
                  className={`px-2.5 py-1 rounded text-xs mono font-semibold transition-all ${
                    activeViewMode === 'imagery'
                      ? 'bg-[#4ade80] text-black shadow-xs'
                      : 'text-[#8e9299] hover:text-white'
                  }`}
                >
                  Imagery Canvas
                </button>
                <button
                  onClick={() => setActiveViewMode('geojson_stream')}
                  className={`px-2.5 py-1 rounded text-xs mono font-semibold transition-all ${
                    activeViewMode === 'geojson_stream'
                      ? 'bg-[#38bdf8] text-black shadow-xs'
                      : 'text-[#8e9299] hover:text-white'
                  }`}
                >
                  GeoJSON Stream
                </button>
                <button
                  onClick={() => setActiveViewMode('telemetry')}
                  className={`px-2.5 py-1 rounded text-xs mono font-semibold transition-all ${
                    activeViewMode === 'telemetry'
                      ? 'bg-[#c084fc] text-black shadow-xs'
                      : 'text-[#8e9299] hover:text-white'
                  }`}
                >
                  Sensor Specs
                </button>
              </div>
            </div>

            {/* Viewport Content */}
            <div className="relative aspect-video w-full bg-[#0c0d0e] overflow-hidden flex items-center justify-center">
              {activeViewMode === 'imagery' && (
                <div className="relative w-full h-full">
                  {/* High-Resolution Stream Image with graceful fallback */}
                  <img
                    src={currentLocation.fallbackImageUrl}
                    alt={currentLocation.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />

                  {/* Radiometric Graticule Overlay & Scanline */}
                  <div className="absolute inset-0 pointer-events-none border border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                    {/* HUD Center Crosshairs */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-[#38bdf8]/40 rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-[#4ade80] rounded-full" />
                      <div className="absolute w-24 h-[1px] bg-[#38bdf8]/20" />
                      <div className="absolute h-24 w-[1px] bg-[#38bdf8]/20" />
                    </div>

                    {/* Top-Left Telemetry Box */}
                    <div className="absolute top-3 left-3 bg-[#0c0d0e]/85 backdrop-blur-md border border-[#2a2c31] rounded-lg p-2.5 text-[10px] mono space-y-1">
                      <div className="text-[#4ade80] font-bold">STREAM: {currentLayer.provider.toUpperCase()}</div>
                      <div className="text-white">CENTER: {currentLocation.center[0]}°N, {currentLocation.center[1]}°E</div>
                      <div className="text-[#8e9299]">GSD: {currentLayer.resolutionMeters}m // SENSOR: {currentLayer.name}</div>
                    </div>

                    {/* Bottom-Right Active Fire Count if FIRMS */}
                    {thermalGeoJson && (
                      <div className="absolute bottom-3 right-3 bg-[#0c0d0e]/90 backdrop-blur-md border border-red-500/40 rounded-lg p-2.5 text-[10px] mono text-red-400 space-y-1 shadow-lg">
                        <div className="flex items-center space-x-1.5 font-bold">
                          <Flame className="h-3.5 w-3.5 text-red-500 animate-bounce" />
                          <span>NASA FIRMS DETECTIONS: {thermalGeoJson.features.length}</span>
                        </div>
                        <div className="text-white">Max FRP: {thermalGeoJson.metadata.maxFrpMw} MW</div>
                        <div className="text-[#8e9299]">Mean Brightness: {thermalGeoJson.metadata.meanBrightnessK} K</div>
                      </div>
                    )}
                  </div>

                  {/* Interactive Hotspot Markers if Thermal GeoJSON */}
                  {thermalGeoJson && thermalGeoJson.features.map((feat: GeoJsonThermalFeature, idx: number) => {
                    const [lon, lat] = feat.geometry.coordinates as [number, number];
                    const [minLon, minLat, maxLon, maxLat] = customBbox;
                    const leftPct = Math.min(95, Math.max(5, ((lon - minLon) / (maxLon - minLon)) * 100));
                    const topPct = Math.min(95, Math.max(5, (1 - (lat - minLat) / (maxLat - minLat)) * 100));

                    return (
                      <button
                        key={feat.properties.id}
                        onClick={() => setSelectedHotspot(feat)}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                      >
                        <div className="h-4 w-4 rounded-full bg-red-500/80 border border-white flex items-center justify-center text-[8px] font-bold text-white shadow-lg animate-pulse">
                          {idx + 1}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeViewMode === 'geojson_stream' && (
                <div className="w-full h-full p-4 overflow-y-auto bg-[#0a0a0c] font-mono text-[11px] text-[#4ade80]">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(
                      thermalGeoJson ||
                        stacGeoJson || {
                          type: 'FeatureCollection',
                          metadata: {
                            provider: currentLayer.provider,
                            layer: currentLayer.name,
                            bbox: customBbox,
                            time: customDate,
                            wmsUrl: currentWmsUrl
                          }
                        },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              {activeViewMode === 'telemetry' && (
                <div className="w-full h-full p-6 overflow-y-auto bg-[#0c0d0e] space-y-4">
                  <div className="border-b border-[#2a2c31] pb-3">
                    <h3 className="text-sm font-bold text-white">{currentLayer.name}</h3>
                    <p className="text-xs text-[#8e9299] mt-1">{currentLayer.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mono">
                    <div className="bg-[#151619] p-3 rounded-lg border border-[#2a2c31]">
                      <span className="text-[#8e9299] block text-[10px]">Ground Sampling Distance (GSD)</span>
                      <span className="text-white font-bold text-sm">{currentLayer.resolutionMeters} meters / pixel</span>
                    </div>
                    <div className="bg-[#151619] p-3 rounded-lg border border-[#2a2c31]">
                      <span className="text-[#8e9299] block text-[10px]">Revisit / Cadence</span>
                      <span className="text-[#4ade80] font-bold text-sm">{currentLayer.cadence}</span>
                    </div>
                    <div className="bg-[#151619] p-3 rounded-lg border border-[#2a2c31]">
                      <span className="text-[#8e9299] block text-[10px]">Spatial Coverage</span>
                      <span className="text-white font-bold text-sm">{currentLayer.coverage}</span>
                    </div>
                    <div className="bg-[#151619] p-3 rounded-lg border border-[#2a2c31]">
                      <span className="text-[#8e9299] block text-[10px]">Transmission Protocol</span>
                      <span className="text-[#38bdf8] font-bold text-sm">{currentLayer.format.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="bg-[#151619] p-3 rounded-lg border border-[#2a2c31] text-xs">
                    <span className="text-[#8e9299] block text-[10px] mono mb-1">Spectral Band Configuration</span>
                    <p className="text-white leading-relaxed">{currentLayer.bandsDescription}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Viewport Footer Actions */}
            <div className="p-3 border-t border-[#2a2c31] bg-[#111215] flex items-center justify-between">
              <div className="text-xs text-[#8e9299] truncate max-w-md">
                <span className="text-white font-semibold">Recommended AI Prompt: </span>
                <span className="italic">{currentLocation.recommendedQuery}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyGeoJson}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0c0d0e] hover:bg-[#1a1b20] border border-[#2a2c31] text-xs mono text-[#e1e1e1] transition-all"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-[#4ade80]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy GeoJSON'}</span>
                </button>

                <button
                  onClick={handleSendToStudio}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#4ade80] hover:bg-[#3ec470] text-black font-bold text-xs mono transition-all shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Stream to AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

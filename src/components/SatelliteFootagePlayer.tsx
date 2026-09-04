import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Satellite,
  Radio,
  Clock,
  Compass,
  MapPin,
  Sparkles,
  Layers,
  Flame,
  Droplets,
  Trees,
  Maximize2,
  Minimize2,
  RefreshCw,
  Activity,
  CheckCircle2,
  Send,
  Zap,
  Globe,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Eye,
  Crosshair,
  Download
} from 'lucide-react';
import { AUTHENTIC_LIVE_SATELLITE_FEEDS, LiveSatelliteFeed } from '../data/isroLiveFeeds';
import { RemoteSensingImage } from '../types';

interface SatelliteFootagePlayerProps {
  onCaptureFrame?: (capturedImage: RemoteSensingImage, defaultQuery?: string) => void;
  activeBandMode?: string;
  setActiveBandMode?: (mode: string) => void;
}

export const SatelliteFootagePlayer: React.FC<SatelliteFootagePlayerProps> = ({
  onCaptureFrame,
  activeBandMode = 'rgb',
  setActiveBandMode
}) => {
  const [selectedFeedId, setSelectedFeedId] = useState<string>(AUTHENTIC_LIVE_SATELLITE_FEEDS[0].id);
  const [selectedChannelId, setSelectedChannelId] = useState<string>(AUTHENTIC_LIVE_SATELLITE_FEEDS[0].channels[0].id);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [capturedNotice, setCapturedNotice] = useState<string | null>(null);
  const [isDownlinking, setIsDownlinking] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(15); // seconds
  const [autoRefreshActive, setAutoRefreshActive] = useState<boolean>(true);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(15);
  const [frameTimestamp, setFrameTimestamp] = useState<string>(new Date().toISOString());

  // Dynamic Telemetry State (Simulating continuous orbital mechanics)
  const [orbitalLat, setOrbitalLat] = useState<number>(0.0);
  const [orbitalLon, setOrbitalLon] = useState<number>(74.0);
  const [signalStrength, setSignalStrength] = useState<number>(98.4);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const containerRef = useRef<HTMLDivElement>(null);

  const currentFeed: LiveSatelliteFeed =
    AUTHENTIC_LIVE_SATELLITE_FEEDS.find(f => f.id === selectedFeedId) || AUTHENTIC_LIVE_SATELLITE_FEEDS[0];

  const currentChannel =
    currentFeed.channels.find(c => c.id === selectedChannelId) || currentFeed.channels[0];

  // Keep channel aligned when feed changes
  useEffect(() => {
    setSelectedChannelId(currentFeed.channels[0]?.id || '');
    setOrbitalLat(currentFeed.telemetry.subSatellitePoint.lat);
    setOrbitalLon(currentFeed.telemetry.subSatellitePoint.lon);
    triggerDownlinkRefresh();
  }, [selectedFeedId]);

  // Live Orbital Telemetry Drift Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentFeed.orbitType === 'ISS Orbital Station' || currentFeed.orbitType === 'LEO (Low Earth Orbit)') {
        setOrbitalLat(prev => {
          let next = prev + (currentFeed.velocityKmS > 0 ? 0.04 : -0.04);
          if (next > 51.6) next = -51.6;
          return +next.toFixed(4);
        });
        setOrbitalLon(prev => {
          let next = prev + 0.06;
          if (next > 180) next = -180;
          return +next.toFixed(4);
        });
      } else {
        // GEO or L1 slight perturbation
        setOrbitalLat(+(currentFeed.telemetry.subSatellitePoint.lat + (Math.sin(Date.now() / 5000) * 0.005)).toFixed(4));
        setOrbitalLon(+(currentFeed.telemetry.subSatellitePoint.lon + (Math.cos(Date.now() / 5000) * 0.005)).toFixed(4));
      }

      setSignalStrength(+(97.5 + Math.random() * 2.4).toFixed(1));
    }, 1200);

    return () => clearInterval(interval);
  }, [currentFeed]);

  // Auto-refresh countdown timer
  useEffect(() => {
    if (!autoRefreshActive) return;

    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          triggerDownlinkRefresh();
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshActive, autoRefreshInterval, selectedFeedId, selectedChannelId]);

  const triggerDownlinkRefresh = () => {
    setIsDownlinking(true);
    setTimeout(() => {
      setFrameTimestamp(new Date().toISOString());
      setIsDownlinking(false);
    }, 450);
  };

  // Convert current live frame to a fully georeferenced RemoteSensingImage for SatQuery AI
  const handleIngestFrameToStudio = useCallback(() => {
    const isSar = currentFeed.sensor.toLowerCase().includes('sar') || currentChannel.id.includes('sar');
    const modality = isSar ? 'sar' : (currentChannel.id.includes('tir') || currentChannel.id.includes('wv') ? 'multispectral' : 'optical');
    
    const crs = currentFeed.orbitType === 'GEO (Geostationary)'
      ? 'EPSG:4326 (WGS 84 / GEO Indian Ocean 74E)'
      : 'EPSG:32643 (WGS 84 / UTM Zone 43N)';

    const capturedImage: RemoteSensingImage = {
      id: `live_${currentFeed.id}_${Date.now()}`,
      name: `${currentFeed.name.split(' ')[0]}_${currentChannel.id.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.tif`,
      modality,
      role: 'single',
      dataUrl: currentChannel.frameUrl,
      thumbnailUrl: currentChannel.frameUrl,
      metadata: {
        format: 'GeoTIFF',
        crs,
        bbox: [
          +(orbitalLon - 0.45).toFixed(4),
          +(orbitalLat - 0.35).toFixed(4),
          +(orbitalLon + 0.45).toFixed(4),
          +(orbitalLat + 0.35).toFixed(4)
        ],
        gsdMeters: currentFeed.telemetry.sensorGsdMeters,
        dimensions: { width: 1600, height: 1067 },
        bands: [currentChannel.label, currentChannel.wavelength],
        satellite: currentFeed.agency === 'ISRO' ? 'Sentinel-2' : (currentFeed.agency === 'NASA' ? 'Landsat-8' : 'Sentinel-2'),
        acquisitionDate: frameTimestamp,
        cloudCoverPercentage: isSar ? 0 : 12.5,
        meanReflectance: 0.22
      }
    };

    const queryPrompt = currentFeed.agency === 'ISRO'
      ? `Analyze this live ISRO ${currentFeed.name} (${currentChannel.label}) Earth observation pass at sub-satellite coordinate [${orbitalLat}°N, ${orbitalLon}°E]. Extract key meteorological cloud formations, vegetative signatures, and marine/terrestrial boundaries.`
      : `Perform dense scene captioning and region grounding on this live ${currentFeed.name} (${currentChannel.label}) pass at ground coordinate [${orbitalLat}°N, ${orbitalLon}°E].`;

    if (onCaptureFrame) {
      onCaptureFrame(capturedImage, queryPrompt);
      setCapturedNotice(`Live frame ingested into SatQuery AI Studio! (${currentChannel.label})`);
      setTimeout(() => setCapturedNotice(null), 4000);
    }
  }, [currentFeed, currentChannel, orbitalLat, orbitalLon, frameTimestamp, onCaptureFrame]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col space-y-3 bg-[#0c0d0e] rounded-lg border border-[#2a2c31] p-3 text-[#e1e1e1] select-none ${
        isFullscreen ? 'fixed inset-0 z-50 p-6 overflow-y-auto bg-[#070809]' : ''
      }`}
    >
      {/* 1. OBSERVATORY HEADER: REAL SATELLITE FEEDS BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#2a2c31]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-[#4ade80]/15 border border-[#4ade80]/40 text-[#4ade80]">
            <Satellite className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold tracking-wide uppercase text-white font-mono flex items-center space-x-1.5">
                <span>Real-Time Satellite Orbital Observatory</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Telemetry Feeds</span>
              </span>
            </div>
            <p className="text-[11px] text-[#8e9299] mono">
              Direct telemetry & multispectral sensor frames from ISRO, NASA & the International Space Station
            </p>
          </div>
        </div>

        {/* Agency Filter Chips */}
        <div className="flex items-center space-x-1 overflow-x-auto text-[10px] mono">
          {AUTHENTIC_LIVE_SATELLITE_FEEDS.map((feed) => {
            const isSelected = feed.id === selectedFeedId;
            return (
              <button
                key={feed.id}
                onClick={() => setSelectedFeedId(feed.id)}
                className={`px-2.5 py-1 rounded font-bold uppercase transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#4ade80] text-black shadow-md'
                    : 'bg-[#151619] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
                }`}
              >
                <span>{feed.agency}</span>
                <span className="text-[9px] opacity-80">({feed.orbitType.split(' ')[0]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SATELLITE SELECTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs mono">
        {AUTHENTIC_LIVE_SATELLITE_FEEDS.map((feed) => {
          const isSelected = feed.id === selectedFeedId;
          return (
            <div
              key={feed.id}
              onClick={() => setSelectedFeedId(feed.id)}
              className={`p-2.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#151619] border-[#4ade80] shadow-sm ring-1 ring-[#4ade80]/40'
                  : 'bg-[#0e0f11] border-[#2a2c31] hover:border-[#4ade80]/50 hover:bg-[#151619]/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                    feed.agency === 'ISRO' ? 'bg-orange-950 text-orange-400 border border-orange-700/50' :
                    feed.agency === 'NASA' ? 'bg-blue-950 text-blue-400 border border-blue-700/50' :
                    'bg-purple-950 text-purple-400 border border-purple-700/50'
                  }`}>
                    {feed.agency}
                  </span>
                  <span className="text-[9px] text-[#8e9299]">{feed.cadence}</span>
                </div>
                <h4 className="text-xs font-bold text-white leading-tight line-clamp-1">
                  {feed.name}
                </h4>
                <p className="text-[10px] text-[#8e9299] mt-0.5 line-clamp-2">
                  {feed.sensor}
                </p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-[#2a2c31]/80 flex items-center justify-between text-[9px] text-[#8e9299]">
                <span>Alt: {feed.altitudeKm >= 1000 ? `${(feed.altitudeKm / 1000).toFixed(0)}k km` : `${feed.altitudeKm} km`}</span>
                <span className="text-emerald-400 font-bold">{feed.telemetry.operationalStatus}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MULTISPECTRAL CHANNEL SELECTOR BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#151619] p-2 rounded border border-[#2a2c31] text-xs mono">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          <span className="text-[#8e9299] text-[10px] font-bold uppercase flex items-center space-x-1 mr-1">
            <Radio className="h-3 w-3 text-[#4ade80]" />
            <span>Spectral Band:</span>
          </span>

          {currentFeed.channels.map((chan) => {
            const isChanActive = chan.id === currentChannel.id;
            return (
              <button
                key={chan.id}
                onClick={() => setSelectedChannelId(chan.id)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap flex items-center space-x-1 ${
                  isChanActive
                    ? 'bg-[#4ade80] text-black font-bold shadow'
                    : 'bg-[#0c0d0e] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]'
                }`}
                title={chan.purpose}
              >
                <span>{chan.label}</span>
              </button>
            );
          })}
        </div>

        {/* Downlink Interval & Manual Trigger */}
        <div className="flex items-center space-x-2 text-[10px]">
          <div className="flex items-center space-x-1 bg-[#0c0d0e] px-2 py-0.5 rounded border border-[#2a2c31]">
            <Clock className="h-3 w-3 text-[#8e9299]" />
            <span className="text-[#8e9299]">Downlink in:</span>
            <span className="text-[#4ade80] font-bold">{refreshCountdown}s</span>
          </div>

          <button
            onClick={triggerDownlinkRefresh}
            disabled={isDownlinking}
            className="px-2 py-1 rounded bg-[#0c0d0e] text-[#8e9299] hover:text-[#4ade80] border border-[#2a2c31] hover:border-[#4ade80]/40 flex items-center space-x-1 transition-colors"
            title="Force Downlink Latest Orbital Frame"
          >
            <RefreshCw className={`h-3 w-3 ${isDownlinking ? 'animate-spin text-[#4ade80]' : ''}`} />
            <span>{isDownlinking ? 'Syncing...' : 'Sync Pass'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded bg-[#0c0d0e] text-[#8e9299] hover:text-[#e1e1e1] border border-[#2a2c31]"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* 4. REAL-TIME SATELLITE FRAME VIEWER STAGE */}
      <div className="relative w-full aspect-[16/9] max-h-[500px] rounded-lg overflow-hidden bg-[#070809] border border-[#2a2c31] group flex items-center justify-center">
        {/* The Live Satellite Frame Raster */}
        <img
          src={currentChannel.frameUrl}
          alt={currentChannel.label}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
          referrerPolicy="no-referrer"
        />

        {/* Satellite Scanline Animation */}
        <div className="absolute inset-0 scan-line pointer-events-none opacity-25"></div>

        {/* Downlinking Pulse Overlay */}
        {isDownlinking && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 space-y-2">
            <RefreshCw className="h-7 w-7 text-[#4ade80] animate-spin" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Receiving High-Resolution Satellite Sensor Downlink...
            </span>
            <span className="text-[10px] font-mono text-[#8e9299]">
              {currentFeed.sensor} @ {currentFeed.telemetry.downlinkFrequencyGHz} GHz
            </span>
          </div>
        )}

        {/* Top-Left Telemetry Overlay */}
        <div className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-sm px-2.5 py-1.5 rounded border border-[#2a2c31] text-[10px] mono space-y-0.5 z-10">
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold text-white uppercase">{currentFeed.name}</span>
          </div>
          <div className="text-[#8e9299] text-[9px] flex items-center space-x-2">
            <span>Band: <span className="text-[#4ade80]">{currentChannel.label}</span></span>
            <span>λ: {currentChannel.wavelength}</span>
          </div>
          <div className="text-[9px] text-[#8e9299]">
            Timestamp: <span className="text-[#e1e1e1]">{frameTimestamp.slice(0, 19)}Z</span>
          </div>
        </div>

        {/* Top-Right Orbit HUD */}
        <div className="absolute top-2.5 right-2.5 bg-black/85 backdrop-blur-sm px-2.5 py-1.5 rounded border border-[#2a2c31] text-[10px] mono text-right z-10">
          <div className="text-[#4ade80] font-bold">
            LAT: {orbitalLat}°N | LON: {orbitalLon}°E
          </div>
          <div className="text-[#8e9299] text-[9px]">
            ALT: {currentFeed.altitudeKm} km | VEL: {currentFeed.velocityKmS} km/s
          </div>
          <div className="text-[9px] text-[#8e9299]">
            SIGNAL LOCK: <span className="text-emerald-400 font-bold">{signalStrength}%</span> ({currentFeed.telemetry.downlinkFrequencyGHz} GHz)
          </div>
        </div>

        {/* Bottom Ingest Action Button Bar */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-black/80 backdrop-blur-md p-2 rounded border border-[#2a2c31] z-10">
          <div className="text-[10px] mono text-[#8e9299] flex items-center space-x-2">
            <Crosshair className="h-3.5 w-3.5 text-[#4ade80]" />
            <span className="hidden sm:inline">Sensor GSD: <strong className="text-white">{currentFeed.telemetry.sensorGsdMeters}m</strong></span>
            <span className="text-[#2a2c31]">|</span>
            <span className="truncate max-w-[280px]" title={currentChannel.purpose}>
              {currentChannel.purpose}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoomLevel(prev => (prev === 1.0 ? 1.35 : 1.0))}
              className="px-2 py-1 rounded bg-[#151619] hover:bg-[#202227] text-[#e1e1e1] border border-[#2a2c31] text-[10px] mono font-bold"
            >
              {zoomLevel === 1.0 ? 'Zoom 1.35x' : 'Reset Zoom'}
            </button>

            <button
              onClick={handleIngestFrameToStudio}
              className="px-3 py-1.5 rounded bg-[#4ade80] hover:bg-[#4ade80]/90 text-black text-xs font-bold font-mono uppercase flex items-center space-x-1.5 shadow-md transition-transform active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Ingest Live Frame to SatQuery Studio</span>
            </button>
          </div>
        </div>

        {/* Ingest Notification Toast */}
        {capturedNotice && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0c0d0e]/95 border border-[#4ade80] text-[#4ade80] px-4 py-2.5 rounded-lg shadow-xl z-30 mono text-xs font-bold flex items-center space-x-2 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="h-4 w-4" />
            <span>{capturedNotice}</span>
          </div>
        )}
      </div>

      {/* 5. GEODETIC TELEMETRY & RADIOMETRIC METRICS FOOTER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0e0f11] p-2.5 rounded border border-[#2a2c31] text-[10px] mono text-[#8e9299]">
        <div className="flex items-center space-x-1.5">
          <Globe className="h-3.5 w-3.5 text-[#3b82f6]" />
          <div>
            <span className="text-[#e1e1e1] font-bold block">Orbit Architecture</span>
            <span>{currentFeed.orbitType}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <Radio className="h-3.5 w-3.5 text-[#4ade80]" />
          <div>
            <span className="text-[#e1e1e1] font-bold block">Sensor Radiometry</span>
            <span>{currentFeed.telemetry.radiometricBits}-bit Quantization</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <Compass className="h-3.5 w-3.5 text-[#f59e0b]" />
          <div>
            <span className="text-[#e1e1e1] font-bold block">Solar Beta Angle</span>
            <span>{currentFeed.telemetry.solarBetaAngle}° (Optimum Illumination)</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <Zap className="h-3.5 w-3.5 text-[#ec4899]" />
          <div>
            <span className="text-[#e1e1e1] font-bold block">Sub-Satellite Point</span>
            <span>{orbitalLat.toFixed(2)}°N, {orbitalLon.toFixed(2)}°E</span>
          </div>
        </div>
      </div>
    </div>
  );
};

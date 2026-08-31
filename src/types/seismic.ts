/**
 * Types for Global Seismic & Tsunami Early Warning System
 * Applying Japan Meteorological Agency (JMA) EEW & S-net technologies
 * to Indian & Worldwide Geohazard monitoring (NCS, INCOIS ITEWS).
 */

export interface EarthquakeRecord {
  id: string;
  title: string;
  magnitude: number;
  place: string;
  time: number; // Unix timestamp in ms
  updated: number;
  url?: string;
  detailUrl?: string;
  felt?: number | null;
  cdi?: number | null; // Community Decimal Intensity
  mmi?: number | null; // Modified Mercalli Intensity
  alert?: 'green' | 'yellow' | 'orange' | 'red' | null;
  status: string;
  tsunami: number; // 0 or 1
  sig: number;
  net: string;
  code: string;
  coordinates: [number, number, number]; // [longitude, latitude, depthKm]
  type: string;
  // Computed & AI-enriched fields
  regionCategory: 'Japan' | 'India' | 'Himalaya' | 'RingOfFire' | 'Global';
  distanceToJapanKm: number;
  distanceToIndiaKm: number;
  jmaIntensity: string; // e.g. "Shindo 5+", "Shindo 6-", "Shindo 7"
  mskIntensity: string; // Indian MSK-64 scale (e.g. "VIII - Severe", "IX - Destructive")
  pgaG: number; // Peak Ground Acceleration in g
  pgvCms: number; // Peak Ground Velocity in cm/s
  tsunamiPotential: 'None' | 'Low' | 'Moderate' | 'High' | 'Catastrophic';
  faultMechanism?: 'Subduction Mega-thrust' | 'Continental Collision' | 'Strike-slip' | 'Normal Faulting' | 'Intraplate Fault';
}

export interface CitySeismicImpact {
  cityName: string;
  stateCountry: string;
  coordinates: [number, number]; // [lon, lat]
  distanceKm: number;
  pWaveArrivalSec: number;
  sWaveArrivalSec: number;
  leadTimeSec: number; // Warning time before destructive S-wave hits
  estimatedPgaG: number;
  jmaShindo: string;
  mskIntensity: string;
  expectedDamage: string;
  safetyAction: string;
}

export interface CoastalTsunamiImpact {
  coastalPoint: string;
  region: 'India' | 'Japan' | 'Indian Ocean' | 'Pacific';
  coordinates: [number, number]; // [lon, lat]
  distanceKm: number;
  oceanDepthM: number;
  waveEtaMinutes: number;
  predictedWaveHeightM: number;
  maxRunupElevationM: number;
  threatLevel: 'No Threat' | 'Advisory (0.2-1m)' | 'Warning (1-3m)' | 'Major Tsunami (>3m)';
  evacuationDirective: string;
  protectiveActionTimeRemainingMin: number;
}

export interface TsunamiThreatModel {
  isTsunamigenic: boolean;
  threatLevel: 'NONE' | 'ADVISORY' | 'WARNING' | 'MAJOR_WARNING';
  epicenterLon: number;
  epicenterLat: number;
  depthKm: number;
  magnitude: number;
  oceanBasin: 'Bay of Bengal' | 'Arabian Sea' | 'Pacific Ocean' | 'Japan Sea' | 'Global Waters';
  estimatedDeepWaterVelocityKmh: number;
  initialDisplacementMeters: number;
  coastalStations: CoastalTsunamiImpact[];
  isochrones: Array<{ timeMinutes: number; radiusKm: number; color: string }>;
  incoisSummary: string;
  jmaSummary: string;
}

export interface SeismicZoneVulnerability {
  id: string;
  name: string;
  country: 'India' | 'Japan' | 'Global';
  tectonicSetting: string;
  lockedFaultSlipRateMmYr: number;
  maxCredibleMagnitude: number;
  seismicGapElapsedYears: number;
  bValue: number; // Gutenberg-Richter b-value
  populationExposedMillions: number;
  keyVulnerableCities: string[];
  historicalEvents: string[];
  readinessRating: 'High (Automated J-Alert/S-net)' | 'Moderate (ITEWS Buoys/VSAT)' | 'Developing (Dense Accelerograph In-Progress)';
  aiRiskScore: number; // 0-100
}

export interface TechBenchmarkComparison {
  dimension: string;
  japanSystem: {
    name: string;
    details: string;
    metrics: string;
    icon: string;
  };
  indiaSystem: {
    name: string;
    details: string;
    metrics: string;
    icon: string;
  };
  globalStandard: string;
}

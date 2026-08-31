import { EarthquakeRecord, CitySeismicImpact, CoastalTsunamiImpact, TsunamiThreatModel, SeismicZoneVulnerability } from '../types/seismic';

// ----------------------------------------------------
// GEODETIC & WAVE TRAVEL CONSTANTS
// ----------------------------------------------------
const EARTH_RADIUS_KM = 6371;
const P_WAVE_CRUSTAL_VELOCITY_KM_S = 6.1; // km/s (Herrin/IASP91 crustal average)
const S_WAVE_CRUSTAL_VELOCITY_KM_S = 3.55; // km/s (Shear wave destructive phase)
const GRAVITY_M_S2 = 9.80665; // m/s^2

/**
 * Calculates Great-Circle distance between two coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Computes Hypocentral Distance R_hypo considering focal depth
 */
export function calculateHypocentralDistanceKm(epicentralDistKm: number, depthKm: number): number {
  return Math.sqrt(epicentralDistKm * epicentralDistKm + Math.max(5, depthKm) * Math.max(5, depthKm));
}

/**
 * Estimates Peak Ground Acceleration (PGA in g) using Si & Midorikawa (1999) attenuation formula
 */
export function estimatePgaG(magnitude: number, hypoDistKm: number, depthKm: number): number {
  const R = Math.max(10, hypoDistKm);
  // Si & Midorikawa GMPE log10(PGA cm/s^2) = 0.58*M - log10(R + 0.0038*10^(0.5M)) - 0.002*R + 0.98
  const logPga = 0.58 * magnitude - Math.log10(R + 0.0038 * Math.pow(10, 0.5 * magnitude)) - 0.002 * R + 0.98;
  const pgaCms2 = Math.pow(10, logPga);
  // Convert cm/s^2 (Gal) to g (1g ≈ 980.665 Gal)
  return Math.max(0.0001, Math.min(2.5, pgaCms2 / 980.665));
}

/**
 * Converts Peak Ground Acceleration (PGA) to JMA Shindo Scale (0 to 7)
 */
export function pgaToJmaShindo(pgaG: number): string {
  const gal = pgaG * 980.665;
  if (gal < 0.8) return 'Shindo 0';
  if (gal < 2.5) return 'Shindo 1';
  if (gal < 8.0) return 'Shindo 2';
  if (gal < 25.0) return 'Shindo 3';
  if (gal < 80.0) return 'Shindo 4';
  if (gal < 150.0) return 'Shindo 5-';
  if (gal < 250.0) return 'Shindo 5+';
  if (gal < 350.0) return 'Shindo 6-';
  if (gal < 500.0) return 'Shindo 6+';
  return 'Shindo 7 (Max)';
}

/**
 * Converts Peak Ground Acceleration (PGA) to Indian Standard MSK-64 / IS 1893 Intensity
 */
export function pgaToMskIntensity(pgaG: number): string {
  const gal = pgaG * 980.665;
  if (gal < 2.5) return 'I-II (Imperceptible/Very Slight)';
  if (gal < 7.0) return 'III-IV (Slight to Moderate)';
  if (gal < 25.0) return 'V (Awakening / Felt Indoors)';
  if (gal < 60.0) return 'VI (Frightening / Minor Plaster Cracks)';
  if (gal < 150.0) return 'VII (Damage to Unreinforced Masonry)';
  if (gal < 300.0) return 'VIII (Destructive / Partial Collapse)';
  if (gal < 600.0) return 'IX (Devastating / General Building Collapse)';
  if (gal < 1000.0) return 'X (Catastrophic / Ground Fissures)';
  return 'XI-XII (Total Annihilation / Landscape Shift)';
}

// ----------------------------------------------------
// CITY STATIONS DATABASE (INDIA & JAPAN & REGIONAL)
// ----------------------------------------------------
export interface MonitoringCity {
  name: string;
  stateCountry: string;
  region: 'India' | 'Japan' | 'Global';
  lat: number;
  lon: number;
  populationM: number;
  isCoastal: boolean;
}

export const MONITORED_CITIES: MonitoringCity[] = [
  // India - Northern & Himalayan Arc
  { name: 'New Delhi (NCR)', stateCountry: 'Delhi, India', region: 'India', lat: 28.6139, lon: 77.209, populationM: 32.9, isCoastal: false },
  { name: 'Dehradun (Garhwal)', stateCountry: 'Uttarakhand, India', region: 'India', lat: 30.3165, lon: 78.0322, populationM: 0.9, isCoastal: false },
  { name: 'Shimla (Himachal)', stateCountry: 'Himachal Pradesh, India', region: 'India', lat: 31.1048, lon: 77.1734, populationM: 0.3, isCoastal: false },
  { name: 'Chandigarh', stateCountry: 'Punjab/Haryana, India', region: 'India', lat: 30.7333, lon: 76.7794, populationM: 1.2, isCoastal: false },
  { name: 'Lucknow', stateCountry: 'Uttar Pradesh, India', region: 'India', lat: 26.8467, lon: 80.9462, populationM: 3.8, isCoastal: false },
  { name: 'Patna', stateCountry: 'Bihar, India', region: 'India', lat: 25.5941, lon: 85.1376, populationM: 2.6, isCoastal: false },
  { name: 'Guwahati', stateCountry: 'Assam, India', region: 'India', lat: 26.1445, lon: 91.7362, populationM: 1.1, isCoastal: false },
  { name: 'Kathmandu', stateCountry: 'Nepal (Himalayan Boundary)', region: 'India', lat: 27.7172, lon: 85.324, populationM: 1.5, isCoastal: false },

  // India - Western, Peninsular & Coastal
  { name: 'Mumbai', stateCountry: 'Maharashtra, India', region: 'India', lat: 18.922, lon: 72.8347, populationM: 21.3, isCoastal: true },
  { name: 'Ahmedabad / Gandhinagar', stateCountry: 'Gujarat, India', region: 'India', lat: 23.0225, lon: 72.5714, populationM: 8.6, isCoastal: false },
  { name: 'Bhuj (Kachchh Basin)', stateCountry: 'Gujarat, India', region: 'India', lat: 23.242, lon: 69.6669, populationM: 0.3, isCoastal: true },
  { name: 'Chennai', stateCountry: 'Tamil Nadu, India', region: 'India', lat: 13.0827, lon: 80.2707, populationM: 11.5, isCoastal: true },
  { name: 'Visakhapatnam', stateCountry: 'Andhra Pradesh, India', region: 'India', lat: 17.6868, lon: 83.2185, populationM: 2.3, isCoastal: true },
  { name: 'Port Blair', stateCountry: 'Andaman & Nicobar, India', region: 'India', lat: 11.6234, lon: 92.7265, populationM: 0.15, isCoastal: true },
  { name: 'Car Nicobar', stateCountry: 'Nicobar Islands, India', region: 'India', lat: 9.155, lon: 92.775, populationM: 0.05, isCoastal: true },
  { name: 'Kochi (Cochin)', stateCountry: 'Kerala, India', region: 'India', lat: 9.9312, lon: 76.2673, populationM: 2.1, isCoastal: true },
  { name: 'Bengaluru (Bangalore)', stateCountry: 'Karnataka, India', region: 'India', lat: 12.9716, lon: 77.5946, populationM: 13.6, isCoastal: false },
  { name: 'Kolkata', stateCountry: 'West Bengal, India', region: 'India', lat: 22.5726, lon: 88.3639, populationM: 15.1, isCoastal: true },

  // Japan Major Metros & Prefectures
  { name: 'Tokyo (Metropolitan Core)', stateCountry: 'Tokyo, Japan', region: 'Japan', lat: 35.6762, lon: 139.6503, populationM: 37.4, isCoastal: true },
  { name: 'Yokohama', stateCountry: 'Kanagawa, Japan', region: 'Japan', lat: 35.4437, lon: 139.638, populationM: 3.8, isCoastal: true },
  { name: 'Osaka', stateCountry: 'Kansai, Japan', region: 'Japan', lat: 34.6937, lon: 135.5023, populationM: 19.2, isCoastal: true },
  { name: 'Kyoto', stateCountry: 'Kyoto Prefecture, Japan', region: 'Japan', lat: 35.0116, lon: 135.7681, populationM: 1.5, isCoastal: false },
  { name: 'Nagoya (Aichi)', stateCountry: 'Chubu, Japan', region: 'Japan', lat: 35.1815, lon: 136.9066, populationM: 9.5, isCoastal: true },
  { name: 'Sendai (Tohoku Coast)', stateCountry: 'Miyagi, Japan', region: 'Japan', lat: 38.2682, lon: 140.8694, populationM: 1.1, isCoastal: true },
  { name: 'Shizuoka (Suruga Bay)', stateCountry: 'Shizuoka, Japan', region: 'Japan', lat: 34.9756, lon: 138.3828, populationM: 0.7, isCoastal: true },
  { name: 'Kochi (Tosa Bay / Nankai Front)', stateCountry: 'Shikoku, Japan', region: 'Japan', lat: 33.5597, lon: 133.5311, populationM: 0.33, isCoastal: true },
  { name: 'Wajima (Noto Peninsula)', stateCountry: 'Ishikawa, Japan', region: 'Japan', lat: 37.3986, lon: 136.9064, populationM: 0.03, isCoastal: true },
  { name: 'Naha (Okinawa Trench)', stateCountry: 'Okinawa, Japan', region: 'Japan', lat: 26.2124, lon: 127.6809, populationM: 0.32, isCoastal: true }
];

/**
 * Calculates real-time EEW impact for all cities given an epicenter and magnitude
 */
export function calculateCityImpacts(
  epiLat: number,
  epiLon: number,
  depthKm: number,
  magnitude: number,
  detectionLagSec: number = 3.5 // JMA UrEDAS typical automated P-wave trigger latency (seconds)
): CitySeismicImpact[] {
  return MONITORED_CITIES.map(city => {
    const distKm = calculateDistanceKm(epiLat, epiLon, city.lat, city.lon);
    const hypoDistKm = calculateHypocentralDistanceKm(distKm, depthKm);

    const pTimeSec = hypoDistKm / P_WAVE_CRUSTAL_VELOCITY_KM_S;
    const sTimeSec = hypoDistKm / S_WAVE_CRUSTAL_VELOCITY_KM_S;
    const leadTimeSec = Math.max(0, sTimeSec - (pTimeSec + detectionLagSec));

    const pgaG = estimatePgaG(magnitude, hypoDistKm, depthKm);
    const jmaShindo = pgaToJmaShindo(pgaG);
    const msk = pgaToMskIntensity(pgaG);

    let expectedDamage = 'No structural threat expected.';
    let safetyAction = 'Normal situational awareness.';

    if (pgaG > 0.35) {
      expectedDamage = 'CRITICAL: Severe structural collapse, liquefaction, unreinforced masonry failure.';
      safetyAction = 'DROP, COVER, HOLD ON immediately! Automated industrial trip & rail braking initiated!';
    } else if (pgaG > 0.15) {
      expectedDamage = 'HEAVY: Wall cracks, falling ceiling tiles, furniture tipping, utility pipeline ruptures.';
      safetyAction = 'Move away from windows and heavy furniture. Protect head under sturdy desk.';
    } else if (pgaG > 0.05) {
      expectedDamage = 'MODERATE: Strong shaking felt by all, glassware breaking, hanging lamps swinging violently.';
      safetyAction = 'Extinguish open flames, prepare to evacuate if in older unreinforced buildings.';
    } else if (pgaG > 0.01) {
      expectedDamage = 'LIGHT: Felt indoors, slight vibrations.';
      safetyAction = 'Remain calm, check local EEW emergency broadcasts.';
    }

    return {
      cityName: city.name,
      stateCountry: city.stateCountry,
      coordinates: [city.lon, city.lat] as [number, number],
      distanceKm: Math.round(distKm),
      pWaveArrivalSec: Number(pTimeSec.toFixed(1)),
      sWaveArrivalSec: Number(sTimeSec.toFixed(1)),
      leadTimeSec: Number(leadTimeSec.toFixed(1)),
      estimatedPgaG: Number(pgaG.toFixed(4)),
      jmaShindo,
      mskIntensity: msk,
      expectedDamage,
      safetyAction
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

// ----------------------------------------------------
// TSUNAMI HYDRODYNAMICS & RUNUP MODEL (INCOIS & JMA)
// ----------------------------------------------------
export const COASTAL_TSUNAMI_GAUGES: Array<{
  name: string;
  region: 'India' | 'Japan' | 'Indian Ocean' | 'Pacific';
  lat: number;
  lon: number;
  avgOceanDepthM: number;
}> = [
  // Indian Coastline & Island Territories (INCOIS ITEWS priority)
  { name: 'Port Blair Harbor (South Andaman)', region: 'India', lat: 11.67, lon: 92.75, avgOceanDepthM: 2800 },
  { name: 'Car Nicobar Coastal Gauge', region: 'India', lat: 9.16, lon: 92.78, avgOceanDepthM: 3200 },
  { name: 'Chennai Marina & Harbor', region: 'India', lat: 13.08, lon: 80.30, avgOceanDepthM: 3000 },
  { name: 'Puducherry Promenade', region: 'India', lat: 11.93, lon: 79.83, avgOceanDepthM: 3100 },
  { name: 'Visakhapatnam Outer Harbor', region: 'India', lat: 17.69, lon: 83.30, avgOceanDepthM: 2700 },
  { name: 'Puri Coast (Odisha)', region: 'India', lat: 19.80, lon: 85.83, avgOceanDepthM: 2400 },
  { name: 'Kochi (Cochin) Port', region: 'India', lat: 9.96, lon: 76.24, avgOceanDepthM: 2200 },
  { name: 'Dwarka / Kandla (Gujarat Coast)', region: 'India', lat: 22.24, lon: 68.96, avgOceanDepthM: 1800 },
  { name: 'Mumbai Colaba & Worli Seafront', region: 'India', lat: 18.90, lon: 72.81, avgOceanDepthM: 2100 },
  { name: 'Colombo Seafront (Sri Lanka)', region: 'Indian Ocean', lat: 6.93, lon: 79.85, avgOceanDepthM: 3400 },
  { name: 'Male Atoll (Maldives)', region: 'Indian Ocean', lat: 4.17, lon: 73.51, avgOceanDepthM: 3800 },
  { name: 'Phuket Coast (Thailand)', region: 'Indian Ocean', lat: 7.88, lon: 98.39, avgOceanDepthM: 1500 },

  // Japan Coastlines (JMA Tsunami Warning Priority)
  { name: 'Sendai & Ishinomaki Port (Miyagi)', region: 'Japan', lat: 38.28, lon: 141.05, avgOceanDepthM: 4200 },
  { name: 'Kamaishi & Sanriku Coast (Iwate)', region: 'Japan', lat: 39.27, lon: 141.89, avgOceanDepthM: 5000 },
  { name: 'Suruga Bay / Yaizu (Shizuoka)', region: 'Japan', lat: 34.86, lon: 138.33, avgOceanDepthM: 2500 },
  { name: 'Kochi Tosa Bay (Nankai Front)', region: 'Japan', lat: 33.52, lon: 133.57, avgOceanDepthM: 4000 },
  { name: 'Wajima Port (Noto Peninsula, Japan Sea)', region: 'Japan', lat: 37.40, lon: 136.91, avgOceanDepthM: 1600 },
  { name: 'Naha Port (Okinawa)', region: 'Japan', lat: 26.22, lon: 127.67, avgOceanDepthM: 4800 }
];

/**
 * Calculates Tsunami Travel Time (TTT), Wave Height, and Coastal Runup
 * based on shallow-water phase velocity C = sqrt(g * depth) and Green's Law shoaling
 */
export function calculateTsunamiThreat(
  epiLat: number,
  epiLon: number,
  depthKm: number,
  magnitude: number
): TsunamiThreatModel {
  // Criteria for tsunamigenic potential: Undersea/near-coast, shallow depth (<70km), M >= 6.5
  const isTsunamigenic = depthKm <= 75 && magnitude >= 6.5;

  let threatLevel: 'NONE' | 'ADVISORY' | 'WARNING' | 'MAJOR_WARNING' = 'NONE';
  if (isTsunamigenic) {
    if (magnitude >= 7.8) threatLevel = 'MAJOR_WARNING';
    else if (magnitude >= 7.2) threatLevel = 'WARNING';
    else threatLevel = 'ADVISORY';
  }

  // Determine ocean basin
  let oceanBasin: 'Bay of Bengal' | 'Arabian Sea' | 'Pacific Ocean' | 'Japan Sea' | 'Global Waters' = 'Global Waters';
  if (epiLat >= 0 && epiLat <= 25 && epiLon >= 80 && epiLon <= 100) oceanBasin = 'Bay of Bengal';
  else if (epiLat >= 0 && epiLat <= 26 && epiLon >= 55 && epiLon <= 77) oceanBasin = 'Arabian Sea';
  else if (epiLat >= 30 && epiLat <= 45 && epiLon >= 128 && epiLon <= 140) oceanBasin = 'Japan Sea';
  else if (epiLon >= 120 || epiLon <= -70) oceanBasin = 'Pacific Ocean';

  // Average deep water speed (e.g. at 3500m depth: sqrt(9.8 * 3500) ≈ 185 m/s ≈ 666 km/h)
  const avgDeepDepthM = 3500;
  const deepWaveSpeedMs = Math.sqrt(GRAVITY_M_S2 * avgDeepDepthM);
  const deepWaveSpeedKmh = Math.round(deepWaveSpeedMs * 3.6);

  // Initial seafloor displacement estimate from moment magnitude (Wells & Coppersmith / Papazachos)
  const initialDisplacementM = isTsunamigenic
    ? Math.max(0.1, Math.pow(10, 0.5 * (magnitude - 6.5)) * 0.4)
    : 0;

  // Compute impacts across key coastal stations
  const coastalStations: CoastalTsunamiImpact[] = COASTAL_TSUNAMI_GAUGES.map(gauge => {
    const distKm = calculateDistanceKm(epiLat, epiLon, gauge.lat, gauge.lon);

    // Dynamic wave velocity integrating average path depth
    const effectiveDepth = Math.max(500, (avgDeepDepthM + gauge.avgOceanDepthM) / 2);
    const pathSpeedKmh = Math.sqrt(GRAVITY_M_S2 * effectiveDepth) * 3.6;
    const etaHours = distKm / pathSpeedKmh;
    const etaMinutes = Math.round(etaHours * 60);

    // Green's Law coastal shoaling amplification: H_coast = H_deep * (depth_deep / depth_coast)^0.25
    const shallowCoastDepth = 15; // 15m depth near shore
    const shoalingFactor = Math.pow(gauge.avgOceanDepthM / shallowCoastDepth, 0.25);
    
    // Geometric dispersion + attenuation
    const dispersion = 1 / Math.sqrt(Math.max(1, distKm / 100));
    const predictedDeepHeightM = (initialDisplacementM * 0.5) * dispersion;
    const predictedCoastHeightM = isTsunamigenic
      ? Math.max(0.05, predictedDeepHeightM * shoalingFactor)
      : 0;

    // Runup elevation factor (typically 1.5x - 2.5x coastal wave height due to momentum)
    const runupM = predictedCoastHeightM * 2.1;

    let level: 'No Threat' | 'Advisory (0.2-1m)' | 'Warning (1-3m)' | 'Major Tsunami (>3m)' = 'No Threat';
    let directive = 'No coastal evacuation needed. Normal maritime operations.';

    if (predictedCoastHeightM >= 3.0) {
      level = 'Major Tsunami (>3m)';
      directive = 'IMMEDIATE EVACUATION: Move to high ground (>15m elevation) or inland beyond 2km instantly!';
    } else if (predictedCoastHeightM >= 1.0) {
      level = 'Warning (1-3m)';
      directive = 'COASTAL EVACUATION: Clear all beaches, harbors, and low-lying coastal structures.';
    } else if (predictedCoastHeightM >= 0.3) {
      level = 'Advisory (0.2-1m)';
      directive = 'MARITIME ADVISORY: Strong rip currents and harbor surges. Stay out of coastal waters.';
    }

    return {
      coastalPoint: gauge.name,
      region: gauge.region,
      coordinates: [gauge.lon, gauge.lat] as [number, number],
      distanceKm: Math.round(distKm),
      oceanDepthM: gauge.avgOceanDepthM,
      waveEtaMinutes: etaMinutes,
      predictedWaveHeightM: Number(predictedCoastHeightM.toFixed(2)),
      maxRunupElevationM: Number(runupM.toFixed(2)),
      threatLevel: level,
      evacuationDirective: directive,
      protectiveActionTimeRemainingMin: etaMinutes
    };
  }).sort((a, b) => a.waveEtaMinutes - b.waveEtaMinutes);

  // Concentric tsunami travel time (TTT) isochrones
  const isochroneTimes = [15, 30, 60, 120, 240, 480]; // in minutes
  const isochrones = isochroneTimes.map((min, idx) => ({
    timeMinutes: min,
    radiusKm: Math.round((min / 60) * deepWaveSpeedKmh),
    color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'][idx]
  }));

  const incoisSummary = isTsunamigenic
    ? `INCOIS ITEWS Bulletin: Undersea seismic rupture (M${magnitude.toFixed(1)}, Depth ${depthKm}km). Tsunami wave velocity estimated at ${deepWaveSpeedKmh} km/h across ${oceanBasin}. Coastal tide gauges and DART Bottom Pressure Recorders (BPRs) primed.`
    : `INCOIS ITEWS Assessment: Event parameters (M${magnitude.toFixed(1)}, Depth ${depthKm}km) indicate negligible tsunamigenic ocean-floor displacement. No oceanwide threat.`;

  const jmaSummary = isTsunamigenic
    ? `JMA Tsunami Evaluation: Seafloor cable network (S-net/DONET) and numerical hydrodynamic inverted rupture predict coastal wave heights up to ${coastalStations[0]?.predictedWaveHeightM || 0}m. Lead time to nearest coast: ${coastalStations[0]?.waveEtaMinutes || 0} min.`
    : `JMA Diagnostic: Non-tsunamigenic mechanism. Standard coastal tidal monitoring active.`;

  return {
    isTsunamigenic,
    threatLevel,
    epicenterLon: epiLon,
    epicenterLat: epiLat,
    depthKm,
    magnitude,
    oceanBasin,
    estimatedDeepWaterVelocityKmh: deepWaveSpeedKmh,
    initialDisplacementMeters: Number(initialDisplacementM.toFixed(2)),
    coastalStations,
    isochrones,
    incoisSummary,
    jmaSummary
  };
}

// ----------------------------------------------------
// HIGH-RISK SEISMIC ZONES (INDIA & JAPAN BENCHMARKS)
// ----------------------------------------------------
export const BENCHMARK_SEISMIC_ZONES: SeismicZoneVulnerability[] = [
  {
    id: 'himalaya_central_gap',
    name: 'Central Himalayan Seismic Gap (Garhwal-Kumaon-Western Nepal)',
    country: 'India',
    tectonicSetting: 'Continental Collision (Indian Plate underthrusting Eurasian Plate at ~45 mm/yr)',
    lockedFaultSlipRateMmYr: 18.5,
    maxCredibleMagnitude: 8.5,
    seismicGapElapsedYears: 221, // Since 1803 Garhwal earthquake
    bValue: 0.82,
    populationExposedMillions: 65.0,
    keyVulnerableCities: ['Dehradun', 'Haridwar', 'New Delhi NCR', 'Chandigarh', 'Shimla', 'Roorkee'],
    historicalEvents: ['1803 Garhwal M7.5', '1905 Kangra M7.8', '1991 Uttarkashi M6.8', '1999 Chamoli M6.8', '2015 Gorkha Nepal M7.8'],
    readinessRating: 'Moderate (ITEWS Buoys/VSAT)',
    aiRiskScore: 94
  },
  {
    id: 'andaman_sumatra_trench',
    name: 'Andaman-Nicobar & Sumatra Subduction Megathrust',
    country: 'India',
    tectonicSetting: 'Oceanic-Continental Subduction (Indo-Australian Plate subducting beneath Burma Microplate)',
    lockedFaultSlipRateMmYr: 35.0,
    maxCredibleMagnitude: 9.2,
    seismicGapElapsedYears: 20, // Since 2004 mega-thrust
    bValue: 0.95,
    populationExposedMillions: 120.0,
    keyVulnerableCities: ['Port Blair', 'Car Nicobar', 'Chennai', 'Visakhapatnam', 'Puducherry', 'Puri'],
    historicalEvents: ['2004 Great Sumatra-Andaman M9.1 (Boxing Day Tsunami)', '1881 Car Nicobar M7.9', '1941 Andaman M7.7'],
    readinessRating: 'Moderate (ITEWS Buoys/VSAT)',
    aiRiskScore: 91
  },
  {
    id: 'makran_subduction_zone',
    name: 'Makran Subduction Zone (Arabian Sea - Western Frontier)',
    country: 'India',
    tectonicSetting: 'Subduction of Arabian Oceanic Plate under Eurasian Plate',
    lockedFaultSlipRateMmYr: 19.0,
    maxCredibleMagnitude: 8.4,
    seismicGapElapsedYears: 79, // Since 1945 Makran tsunami
    bValue: 0.88,
    populationExposedMillions: 45.0,
    keyVulnerableCities: ['Dwarka', 'Kandla (Kachchh)', 'Porbandar', 'Mumbai Coast', 'Karachi', 'Gwadar'],
    historicalEvents: ['1945 Makran M8.1 (12m Tsunami in Gujarat/Kachchh)', '1765 Makran Event'],
    readinessRating: 'Moderate (ITEWS Buoys/VSAT)',
    aiRiskScore: 88
  },
  {
    id: 'kachchh_mainland_fault',
    name: 'Kachchh Mainland & Katrol Hill Fault (Gujarat Intraplate Basin)',
    country: 'India',
    tectonicSetting: 'Intraplate Reactivated Mesozoic Rift Basin',
    lockedFaultSlipRateMmYr: 4.5,
    maxCredibleMagnitude: 7.8,
    seismicGapElapsedYears: 23, // Since 2001 Bhuj earthquake
    bValue: 0.90,
    populationExposedMillions: 18.0,
    keyVulnerableCities: ['Bhuj', 'Gandhidham', 'Rajkot', 'Ahmedabad', 'Surat'],
    historicalEvents: ['2001 Bhuj M7.7 (20,000+ casualties)', '1819 Allah Bund M7.8', '1956 Anjar M6.1'],
    readinessRating: 'Developing (Dense Accelerograph In-Progress)',
    aiRiskScore: 84
  },
  {
    id: 'nankai_trough_japan',
    name: 'Nankai Trough Megathrust (Tokai-Tonankai-Nankai Segment)',
    country: 'Japan',
    tectonicSetting: 'Subduction of Philippine Sea Plate beneath Amurian / Eurasian Plate (~50 mm/yr)',
    lockedFaultSlipRateMmYr: 45.0,
    maxCredibleMagnitude: 9.0,
    seismicGapElapsedYears: 78, // Since 1946 Nankai earthquake (recurrence ~90-150 yrs)
    bValue: 0.78,
    populationExposedMillions: 80.0,
    keyVulnerableCities: ['Tokyo Metropolitan', 'Shizuoka', 'Nagoya', 'Osaka', 'Wakayama', 'Kochi (Shikoku)'],
    historicalEvents: ['1707 Hoei M8.6 (Fuji Eruption Trigger)', '1854 Ansei Nankai M8.4', '1944 Tonankai M8.1', '1946 Nankai M8.1'],
    readinessRating: 'High (Automated J-Alert/S-net)',
    aiRiskScore: 98
  },
  {
    id: 'japan_trench_tohoku',
    name: 'Japan Trench & Sanriku Segment (Pacific Subduction)',
    country: 'Japan',
    tectonicSetting: 'Pacific Plate subducting beneath Okhotsk/North American Plate at ~85 mm/yr',
    lockedFaultSlipRateMmYr: 85.0,
    maxCredibleMagnitude: 9.1,
    seismicGapElapsedYears: 13, // Since 2011 Tohoku
    bValue: 1.05,
    populationExposedMillions: 40.0,
    keyVulnerableCities: ['Sendai', 'Miyagi Coast', 'Fukushima', 'Iwate Kamaishi', 'Tokyo Bay'],
    historicalEvents: ['2011 Great East Japan M9.1 (40m Tsunami)', '1896 Meiji Sanriku M8.5', '1933 Showa Sanriku M8.4'],
    readinessRating: 'High (Automated J-Alert/S-net)',
    aiRiskScore: 89
  },
  {
    id: 'noto_peninsula_faults',
    name: 'Noto Peninsula Active Fault System (Japan Sea Coast)',
    country: 'Japan',
    tectonicSetting: 'Back-arc compressive reverse faulting along Japan Sea margin',
    lockedFaultSlipRateMmYr: 2.5,
    maxCredibleMagnitude: 7.6,
    seismicGapElapsedYears: 0.5, // 2024 New Year Day Noto Event
    bValue: 1.12,
    populationExposedMillions: 1.2,
    keyVulnerableCities: ['Wajima', 'Suzu', 'Nanao', 'Kanazawa', 'Toyama'],
    historicalEvents: ['2024 Noto Peninsula M7.6', '2007 Noto M6.9'],
    readinessRating: 'High (Automated J-Alert/S-net)',
    aiRiskScore: 76
  }
];

// ----------------------------------------------------
// CURATED BENCHMARK / HISTORICAL SCENARIO PRESETS
// ----------------------------------------------------
export interface ScenarioPreset {
  id: string;
  title: string;
  region: 'Japan' | 'India' | 'Global';
  magnitude: number;
  depthKm: number;
  lat: number;
  lon: number;
  description: string;
  historicalContext: string;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'preset_himalaya_central_gap',
    title: 'Himalayan Central Gap M7.9 Scenario (Chamoli-Garhwal Epicenter)',
    region: 'India',
    magnitude: 7.9,
    depthKm: 18,
    lat: 30.41,
    lon: 79.32,
    description: 'Simulates a locked rupture along the Main Frontal Thrust (MFT) / Main Boundary Thrust (MBT) in Uttarakhand.',
    historicalContext: 'High-strain seismic gap accumulated over 220+ years. High threat to Delhi NCR (lead time ~50s) and Dehradun (lead time ~8s).'
  },
  {
    id: 'preset_andaman_mega_tsunami',
    title: 'Andaman-Sumatra Subduction M8.8 Mega-Thrust Tsunami Scenario',
    region: 'India',
    magnitude: 8.8,
    depthKm: 22,
    lat: 9.25,
    lon: 92.85,
    description: 'Undersea subduction thrust rupture in Nicobar basin driving oceanwide tsunami propagation.',
    historicalContext: 'Similar fault segment to the 2004 Boxing Day event. INCOIS ITEWS alerts Chennai, Vizag, and Port Blair.'
  },
  {
    id: 'preset_makran_arabian_sea',
    title: 'Makran Arabian Sea M8.2 Tsunami & Shaking Scenario',
    region: 'India',
    magnitude: 8.2,
    depthKm: 25,
    lat: 24.50,
    lon: 63.20,
    description: 'Subduction rupture in the northern Arabian Sea affecting Gujarat, Kachchh ports, and Mumbai.',
    historicalContext: 'Re-evaluates the 1945 Makran earthquake (M8.1) which caused 12m tsunami waves along the Gujarat and Konkan coast.'
  },
  {
    id: 'preset_nankai_trough_japan',
    title: 'Nankai Trough Megathrust M8.7 Scenario (JMA S-net EEW)',
    region: 'Japan',
    magnitude: 8.7,
    depthKm: 20,
    lat: 33.20,
    lon: 135.80,
    description: 'Simulates the catastrophic Nankai Trough rupture along Tokai, Tonankai, and Nankai segments.',
    historicalContext: 'Anticipated mega-quake evaluated by JMA and Cabinet Office with up to 30m tsunami runup in Kochi and Shizuoka.'
  },
  {
    id: 'preset_noto_peninsula_2024',
    title: '2024 Noto Peninsula M7.6 (Real Benchmark Event)',
    region: 'Japan',
    magnitude: 7.6,
    depthKm: 16,
    lat: 37.498,
    lon: 137.242,
    description: 'New Year Day 2024 rupture along Noto Peninsula coast triggering JMA Major Tsunami Warning.',
    historicalContext: 'Ground uplift up to 4 meters, severe liquefaction, and rapid 5m tsunami arrival on Ishikawa coast.'
  },
  {
    id: 'preset_taiwan_hualien_2024',
    title: '2024 Taiwan Hualien Offshore M7.4 Event',
    region: 'Global',
    magnitude: 7.4,
    depthKm: 34.8,
    lat: 23.819,
    lon: 121.562,
    description: 'Offshore reverse faulting near Hualien City triggering regional tsunami advisories in Okinawa and Philippines.',
    historicalContext: 'Strongest earthquake to strike Taiwan in 25 years with high-speed EEW notification across Taipei.'
  }
];

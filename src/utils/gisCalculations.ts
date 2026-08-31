/**
 * GIS and Remote Sensing Mathematical Utility Suite
 * Provides geodetic calculations, MGRS grid conversion, spectral index probing,
 * geodesic distance measurement, area calculations, and dynamic scale computing.
 */

export interface GeodeticCoord {
  lat: number;
  lon: number;
  latStr: string;
  lonStr: string;
  mgrs: string;
  utm: string;
}

export interface PixelProbeData {
  pixelX: number;
  pixelY: number;
  geo: GeodeticCoord;
  dnRgb: [number, number, number];
  reflectance: number; // 0.00 - 1.00
  ndvi: number;        // -1.0 to +1.0
  ndwi: number;        // -1.0 to +1.0
  sarSigma0Db: number; // -35.0 to +10.0 dB
  surfaceType: string;
}

/**
 * Converts Normalized coordinates (0-1) to Geodetic Coordinates (WGS84 / UTM / MGRS)
 */
export function pixelToGeo(
  normX: number,
  normY: number,
  bbox?: [number, number, number, number]
): GeodeticCoord {
  const [minLon, minLat, maxLon, maxLat] = bbox || [4.412, 51.901, 4.498, 51.968];

  const lon = minLon + normX * (maxLon - minLon);
  const lat = maxLat - normY * (maxLat - minLat); // Top is maxLat

  const latDeg = Math.floor(Math.abs(lat));
  const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);
  const latSec = (((Math.abs(lat) - latDeg) * 60 - latMin) * 60).toFixed(1);
  const latDir = lat >= 0 ? 'N' : 'S';

  const lonDeg = Math.floor(Math.abs(lon));
  const lonMin = Math.floor((Math.abs(lon) - lonDeg) * 60);
  const lonSec = (((Math.abs(lon) - lonDeg) * 60 - lonMin) * 60).toFixed(1);
  const lonDir = lon >= 0 ? 'E' : 'W';

  const latStr = `${latDeg}°${latMin}'${latSec}"${latDir}`;
  const lonStr = `${lonDeg}°${lonMin}'${lonSec}"${lonDir}`;

  // Simplified MGRS / UTM grid square emulator
  const utmZone = Math.floor((lon + 180) / 6) + 1;
  const easting = Math.round(500000 + (lon - (utmZone * 6 - 183)) * 111320 * Math.cos((lat * Math.PI) / 180));
  const northing = Math.round(lat >= 0 ? lat * 110574 : 10000000 + lat * 110574);
  const utm = `${utmZone}N ${easting}E ${northing}N`;

  const col100k = String.fromCharCode(65 + (Math.floor(easting / 100000) % 8) + (utmZone % 3) * 8);
  const row100k = String.fromCharCode(65 + (Math.floor(northing / 100000) % 20));
  const e10k = String(easting % 100000).padStart(5, '0').substring(0, 4);
  const n10k = String(northing % 100000).padStart(5, '0').substring(0, 4);
  const mgrs = `${utmZone}U ${col100k}${row100k} ${e10k} ${n10k}`;

  return {
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
    latStr,
    lonStr,
    mgrs,
    utm
  };
}

/**
 * Calculates geodesic ground distance and azimuth bearing between two pixel points
 */
export function calculateGroundDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  widthPx: number,
  heightPx: number,
  gsdMeters: number = 10,
  bbox?: [number, number, number, number]
): {
  distanceMeters: number;
  formattedDistance: string;
  bearingDegrees: number;
  deltaX: number;
  deltaY: number;
} {
  const dxPixels = p2.x - p1.x;
  const dyPixels = p2.y - p1.y;

  // Ground distance in meters
  const distPixels = Math.sqrt(dxPixels * dxPixels + dyPixels * dyPixels);
  const distanceMeters = distPixels * (gsdMeters * (512 / Math.max(widthPx, 1)));

  let formattedDistance = '';
  if (distanceMeters >= 1000) {
    formattedDistance = `${(distanceMeters / 1000).toFixed(2)} km`;
  } else {
    formattedDistance = `${Math.round(distanceMeters)} m`;
  }

  // Bearing / Azimuth (0° North, 90° East)
  const angleRad = Math.atan2(dxPixels, -dyPixels);
  let bearingDegrees = Math.round((angleRad * 180) / Math.PI);
  if (bearingDegrees < 0) bearingDegrees += 360;

  return {
    distanceMeters,
    formattedDistance,
    bearingDegrees,
    deltaX: Math.round(dxPixels * gsdMeters),
    deltaY: Math.round(-dyPixels * gsdMeters)
  };
}

/**
 * Calculates area of bounding box or polygon in m², ha, km²
 */
export function calculateGroundArea(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  widthPx: number,
  heightPx: number,
  gsdMeters: number = 10
): {
  areaM2: number;
  hectares: number;
  sqKm: number;
  formatted: string;
} {
  const w = Math.abs(p2.x - p1.x) * (gsdMeters * (512 / Math.max(widthPx, 1)));
  const h = Math.abs(p2.y - p1.y) * (gsdMeters * (512 / Math.max(heightPx, 1)));
  const areaM2 = w * h;
  const hectares = areaM2 / 10000;
  const sqKm = areaM2 / 1000000;

  let formatted = '';
  if (sqKm >= 1) {
    formatted = `${sqKm.toFixed(2)} km² (${hectares.toFixed(1)} ha)`;
  } else if (hectares >= 1) {
    formatted = `${hectares.toFixed(2)} ha (${Math.round(areaM2).toLocaleString()} m²)`;
  } else {
    formatted = `${Math.round(areaM2).toLocaleString()} m²`;
  }

  return { areaM2, hectares, sqKm, formatted };
}

/**
 * Estimates dynamic scale bar width and label based on zoom factor & GSD
 */
export function calculateScaleBar(
  zoom: number,
  gsdMeters: number = 10,
  viewportWidthPx: number = 512
): { barWidthPx: number; label: string } {
  // Ground width of full 1x image = 512 * gsdMeters
  const visibleGroundWidthMeters = (512 * gsdMeters) / Math.max(0.1, zoom);

  // Desired scale intervals: 20m, 50m, 100m, 200m, 500m, 1km, 2km, 5km, 10km
  const candidateMeters = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  let targetMeters = 500;

  for (const c of candidateMeters) {
    const px = (c / visibleGroundWidthMeters) * viewportWidthPx;
    if (px >= 60 && px <= 140) {
      targetMeters = c;
      break;
    }
  }

  const barWidthPx = Math.max(40, Math.min(180, (targetMeters / visibleGroundWidthMeters) * viewportWidthPx));
  const label = targetMeters >= 1000 ? `${targetMeters / 1000} km` : `${targetMeters} m`;

  return { barWidthPx, label };
}

/**
 * Probes Radiometric, Spectral, and SAR attributes for a given normalized pixel
 */
export function probePixelSpectra(
  normX: number,
  normY: number,
  isSar: boolean = false,
  bbox?: [number, number, number, number]
): PixelProbeData {
  const geo = pixelToGeo(normX, normY, bbox);
  const px = Math.round(normX * 512);
  const py = Math.round(normY * 512);

  // Deterministic procedural spectral values based on pixel position & geometry
  let r = 50;
  let g = 80;
  let b = 60;
  let ndvi = 0.45;
  let ndwi = -0.3;
  let sarSigma0Db = -12.4;
  let surfaceType = 'Vegetation / Forest Canopy';
  let reflectance = 0.28;

  // Water detection zone (e.g. left port / lake basin)
  if (normX < 0.35 + Math.sin(normY * 12) * 0.05) {
    r = 18;
    g = 45;
    b = 75;
    ndvi = -0.42;
    ndwi = 0.78;
    sarSigma0Db = -26.8; // Specular calm water
    surfaceType = 'Waterway / Maritime Basin';
    reflectance = 0.06;
  }
  // Metallic / Built Structure (fuel tanks / ships / runways)
  else if (
    (normX > 0.48 && normX < 0.55 && normY > 0.15 && normY < 0.85) || // Runway
    (Math.hypot(normX - 0.82, normY - 0.22) < 0.05) || // Tank 1
    (Math.hypot(normX - 0.90, normY - 0.22) < 0.05)    // Tank 2
  ) {
    r = 210;
    g = 215;
    b = 220;
    ndvi = 0.08;
    ndwi = -0.15;
    sarSigma0Db = -2.1; // Strong double-bounce corner reflection
    surfaceType = 'Impervious Concrete / Metallic Infrastructure';
    reflectance = 0.64;
  }
  // Agricultural plots
  else if (normY > 0.5) {
    r = 85;
    g = 145;
    b = 35;
    ndvi = 0.72;
    ndwi = -0.55;
    sarSigma0Db = -9.8;
    surfaceType = 'Dense Cultivated Biomass (Healthy Crop)';
    reflectance = 0.42;
  }

  return {
    pixelX: px,
    pixelY: py,
    geo,
    dnRgb: [r, g, b],
    reflectance,
    ndvi,
    ndwi,
    sarSigma0Db,
    surfaceType: isSar ? `SAR Backscatter: ${sarSigma0Db} dB (${surfaceType})` : surfaceType
  };
}

/**
 * Generates an elevation / spectral cross section array along a drawn line
 */
export function sampleCrossSection(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  samplesCount: number = 32
): Array<{ index: number; distPercent: number; elevationM: number; ndvi: number; intensity: number; sarDb: number }> {
  const result = [];
  for (let i = 0; i <= samplesCount; i++) {
    const t = i / samplesCount;
    const curX = p1.x + t * (p2.x - p1.x);
    const curY = p1.y + t * (p2.y - p1.y);

    const normX = Math.max(0, Math.min(1, curX / 512));
    const normY = Math.max(0, Math.min(1, curY / 512));

    const probe = probePixelSpectra(normX, normY);

    // Simulated elevation in meters
    const elevationM = Math.round(12 + (1 - normY) * 35 + Math.sin(normX * 8) * 14);

    result.push({
      index: i,
      distPercent: Math.round(t * 100),
      elevationM,
      ndvi: probe.ndvi,
      intensity: Math.round(probe.reflectance * 255),
      sarDb: probe.sarSigma0Db
    });
  }
  return result;
}

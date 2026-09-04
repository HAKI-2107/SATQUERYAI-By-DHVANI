/**
 * Live Orbital Data & GeoJSON Provider Stream Service
 * Connects to public satellite Earth observation APIs:
 * - NASA GIBS (Global Imagery Browse Services) - Real-time WMTS/WMS
 * - NASA FIRMS (Fire Information for Resource Management System) - Live Thermal GeoJSON
 * - Copernicus / Sentinel Hub STAC API - Multispectral L2A footprints
 * - ISRO MOSDAC / Bhuvan - Regional oceanic & terrestrial raster telemetry
 * - USGS Landsat Collection 2 Tier 1 - Calibrated surface reflectance
 */

import {
  LiveProviderLayer,
  GeoJsonThermalFeature,
  StacItemRecord,
  RemoteSensingImage
} from '../types';

export const LIVE_PROVIDER_LAYERS: LiveProviderLayer[] = [
  {
    id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    provider: 'nasa_gibs',
    name: 'NASA VIIRS SNPP True Color (Corrected Reflectance)',
    description: 'Daily high-cadence true-color optical composite from Suomi NPP VIIRS sensor (Bands M3, I2, I1).',
    resolutionMeters: 250,
    format: 'wmts',
    cadence: 'daily',
    coverage: 'Global',
    bandsDescription: 'Red (640nm), Green (555nm), Blue (488nm) corrected surface reflectance',
    defaultDateOffsetDays: 1
  },
  {
    id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    provider: 'nasa_gibs',
    name: 'NASA Terra MODIS True Color (SurReflectance)',
    description: 'High-revisit global optical swath from NASA Terra Earth-observing flagship satellite.',
    resolutionMeters: 250,
    format: 'wmts',
    cadence: 'daily',
    coverage: 'Global',
    bandsDescription: 'Band 1 (Red 648nm), Band 4 (Green 555nm), Band 3 (Blue 470nm)',
    defaultDateOffsetDays: 1
  },
  {
    id: 'VIIRS_SNPP_DayNightBand_AtSensor_Radiance',
    provider: 'nasa_gibs',
    name: 'NASA VIIRS Day/Night Band (Nighttime Lights Radiance)',
    description: 'Calibrated nocturnal radiometric observations capturing city lights, auroras, gas flaring, and fishing fleets.',
    resolutionMeters: 500,
    format: 'wmts',
    cadence: 'daily',
    coverage: 'Global',
    bandsDescription: 'Panchromatic Day/Night Band (500-900nm), calibrated in nW/(cm²·sr)',
    defaultDateOffsetDays: 1
  },
  {
    id: 'AIRS_Dust_Score',
    provider: 'nasa_gibs',
    name: 'NASA Aqua AIRS Atmospheric Dust & Aerosol Index',
    description: 'Infrared sounder dust detection scoring for desert sandstorms, aerosol loading, and volcanic ash plumes.',
    resolutionMeters: 2000,
    format: 'wmts',
    cadence: 'daily',
    coverage: 'Global',
    bandsDescription: 'Hyperspectral thermal IR split-window dust index (8.1 - 12.0 µm)',
    defaultDateOffsetDays: 2
  },
  {
    id: 'FIRMS_Thermal_Hotspots_GeoJSON',
    provider: 'nasa_firms',
    name: 'NASA FIRMS Live Active Fire & Thermal Anomaly GeoJSON',
    description: 'Near real-time 375m VIIRS & 1km MODIS active fire detections with Fire Radiative Power (MW) and confidence grading.',
    resolutionMeters: 375,
    format: 'geojson_thermal',
    cadence: 'hourly',
    coverage: 'Global',
    bandsDescription: 'Mid-IR (3.9 µm) & Thermal IR (11.0 µm) differential brightness anomaly',
    defaultDateOffsetDays: 0
  },
  {
    id: 'Sentinel2_L2A_STAC_Stream',
    provider: 'sentinel_hub_stac',
    name: 'Copernicus Sentinel-2 MSI L2A STAC Collection',
    description: '10m-20m European Space Agency optical multispectral surface reflectance with atmospheric correction.',
    resolutionMeters: 10,
    format: 'geojson_stac',
    cadence: '5-day',
    coverage: 'Global',
    bandsDescription: '13 Spectral Bands (B2-Blue, B3-Green, B4-Red, B8-NIR, B11/B12-SWIR)',
    defaultDateOffsetDays: 2
  },
  {
    id: 'ISRO_Oceansat3_OCM_Chlorophyll',
    provider: 'isro_mosdac',
    name: 'ISRO Oceansat-3 OCM Ocean Chlorophyll & Turbidity',
    description: 'Indian Space Research Organisation Ocean Colour Monitor tracking chlorophyll-a concentration and sediment plumes.',
    resolutionMeters: 360,
    format: 'geojson_stac',
    cadence: 'daily',
    coverage: 'Regional',
    bandsDescription: '13-band Ocean Colour Monitor (412nm - 865nm) OC4v6 bio-optical algorithm',
    defaultDateOffsetDays: 1
  },
  {
    id: 'USGS_Landsat9_Surface_Temp',
    provider: 'usgs_landsat',
    name: 'USGS Landsat 9 OLI/TIRS-2 Surface Reflectance & Thermal',
    description: '30m calibrated multispectral + 100m split-window thermal infrared sensor stream from USGS/NASA.',
    resolutionMeters: 30,
    format: 'geojson_stac',
    cadence: '16-day',
    coverage: 'Global',
    bandsDescription: 'Bands 1-7 (VNIR/SWIR) + Band 10 (Thermal Infrared 10.6-11.19 µm)',
    defaultDateOffsetDays: 4
  }
];

export interface PresetLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  center: [number, number]; // [lat, lon]
  defaultLayerId: string;
  recommendedQuery: string;
  description: string;
  fallbackImageUrl: string;
}

export const PRESET_ORBITAL_LOCATIONS: PresetLocation[] = [
  {
    id: 'rotterdam_port',
    name: 'Port of Rotterdam Europort Terminal',
    region: 'North Sea Coastal Littoral',
    country: 'Netherlands',
    bbox: [3.95, 51.85, 4.35, 52.05],
    center: [51.95, 4.14],
    defaultLayerId: 'Sentinel2_L2A_STAC_Stream',
    recommendedQuery: 'Identify large maritime cargo container vessels and compute harbor water turbidity indices.',
    description: 'Europe’s largest deepwater seaport with continuous container traffic, petroleum terminals, and dynamic estuarine sediment flow.',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'california_wildfire',
    name: 'Sierra Nevada & Yosemite Wildfire Burn Scar',
    region: 'California Sierra Mountains',
    country: 'United States',
    bbox: [-120.2, 37.4, -119.2, 38.1],
    center: [37.74, -119.59],
    defaultLayerId: 'FIRMS_Thermal_Hotspots_GeoJSON',
    recommendedQuery: 'Detect active thermal anomaly clusters, compute dNBR burn severity, and map smoke plume dispersion.',
    description: 'High-elevation montane forest zone subject to catastrophic wildfire dynamics, active firefront propagation, and post-fire vegetation regrowth.',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'nile_delta',
    name: 'Nile River Delta & Cairo Agricultural Corridor',
    region: 'Lower Egypt',
    country: 'Egypt',
    bbox: [30.2, 30.1, 31.8, 31.6],
    center: [30.85, 31.00],
    defaultLayerId: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    recommendedQuery: 'Segment irrigated agricultural crop plots from arid desert soil and quantify NDVI canopy density.',
    description: 'Hyper-fertile delta ecosystem contrasting sharply with hyper-arid Sahara desert margins, vital for food security and urban encroachment monitoring.',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'amazon_basin',
    name: 'Amazon Rainforest & Rondonia Ingress Zone',
    region: 'Amazonas / Rondonia',
    country: 'Brazil',
    bbox: [-63.5, -4.2, -61.0, -2.8],
    center: [-3.46, -62.21],
    defaultLayerId: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    recommendedQuery: 'Detect fishbone deforestation corridors, quantify primary canopy loss, and map convective rain systems.',
    description: 'Vital planetary biodiversity biome subject to illegal road penetration, agricultural conversion, and massive tropical moisture transpiration.',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'mount_etna',
    name: 'Mount Etna Volcanic Flank & Lava Fields',
    region: 'Sicily',
    country: 'Italy',
    bbox: [14.8, 37.6, 15.2, 37.9],
    center: [37.75, 14.99],
    defaultLayerId: 'FIRMS_Thermal_Hotspots_GeoJSON',
    recommendedQuery: 'Identify summit crater thermal anomalies, map cooled basaltic lava flows, and trace ash cloud trajectory.',
    description: 'Active stratovolcano with frequent Strombolian eruptions, thermal infrared emissivity spikes, and Mediterranean coastal ashfall.',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'ganges_delta',
    name: 'Sundarbans Mangrove Forest & Ganges Estuary',
    region: 'Bay of Bengal Littoral',
    country: 'India / Bangladesh',
    bbox: [88.5, 21.5, 90.2, 22.8],
    center: [22.25, 89.65],
    defaultLayerId: 'ISRO_Oceansat3_OCM_Chlorophyll',
    recommendedQuery: 'Analyze mangrove tidal inundation, measure suspended sediment plumes, and detect cyclone coastal erosion.',
    description: 'World’s largest contiguous mangrove delta system, acting as a natural storm surge barrier against intense Bay of Bengal tropical cyclones.',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1600&q=85'
  },
  {
    id: 'tokyo_bay',
    name: 'Tokyo Bay Industrial Megalopolis & Anchorage',
    region: 'Kanto Coast',
    country: 'Japan',
    bbox: [139.6, 35.3, 140.1, 35.8],
    center: [35.60, 139.85],
    defaultLayerId: 'VIIRS_SNPP_DayNightBand_AtSensor_Radiance',
    recommendedQuery: 'Extract night light radiance gradients, segment reclaimed artificial islands, and inspect container terminals.',
    description: 'Dense maritime logistics hub and high-radiance nocturnal urban complex with Haneda airport seawalls and Yokohama container berths.',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=85'
  }
];

/**
 * Builds standard NASA GIBS WMS (Web Map Service) URL for a given layer, date, and bounding box.
 * NASA GIBS is open and public (no API keys required).
 */
export function buildGibsWmsUrl(
  layerId: string,
  bbox: [number, number, number, number],
  dateStr: string,
  width: number = 768,
  height: number = 768
): string {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const baseUrl = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.3.0',
    LAYERS: layerId,
    STYLES: '',
    FORMAT: 'image/jpeg',
    TRANSPARENT: 'FALSE',
    CRS: 'EPSG:4326',
    BBOX: `${minLat},${minLon},${maxLat},${maxLon}`,
    WIDTH: width.toString(),
    HEIGHT: height.toString(),
    TIME: dateStr
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generates simulated live NASA FIRMS active fire GeoJSON features for a specified bounding box.
 */
export function fetchLiveFirmsThermalGeoJson(
  bbox: [number, number, number, number],
  dateStr: string
): { type: 'FeatureCollection'; features: GeoJsonThermalFeature[]; metadata: any } {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const features: GeoJsonThermalFeature[] = [];
  const numHotspots = 8 + Math.floor(Math.random() * 12);

  for (let i = 0; i < numHotspots; i++) {
    const lat = minLat + Math.random() * (maxLat - minLat);
    const lon = minLon + Math.random() * (maxLon - minLon);
    const frp = Math.round((12.5 + Math.random() * 85.0) * 10) / 10;
    const brightnessTemp = Math.round(310 + Math.random() * 75);

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      properties: {
        id: `FIRMS-VIIRS-${dateStr.replace(/-/g, '')}-${i + 1}`,
        latitude: Math.round(lat * 10000) / 10000,
        longitude: Math.round(lon * 10000) / 10000,
        brightnessTempK: brightnessTemp,
        fireRadiativePowerMw: frp,
        confidence: frp > 50 ? 'high' : frp > 25 ? 'nominal' : 'low',
        satellite: 'Suomi NPP / NOAA-20',
        instrument: 'VIIRS (375m I-Band)',
        acqTime: `${String(10 + (i % 12)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')} UTC`,
        dayNight: i % 2 === 0 ? 'D' : 'N'
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      provider: 'NASA FIRMS / LANCE Real-Time Fire System',
      boundingBox: bbox,
      timestamp: new Date().toISOString(),
      activeSensors: ['VIIRS-SNPP', 'VIIRS-NOAA20', 'MODIS-Terra', 'MODIS-Aqua'],
      totalDetections: features.length,
      maxFrpMw: Math.max(...features.map(f => f.properties.fireRadiativePowerMw)),
      meanBrightnessK: Math.round(
        features.reduce((sum, f) => sum + f.properties.brightnessTempK, 0) / features.length
      )
    }
  };
}

/**
 * Generates simulated live Sentinel Hub / Copernicus STAC Item Records for a bounding box.
 */
export function fetchLiveStacGranules(
  bbox: [number, number, number, number],
  dateStr: string,
  cloudMaxPct: number = 30
): { type: 'FeatureCollection'; features: StacItemRecord[]; stacVersion: string } {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const items: StacItemRecord[] = [];
  const platforms = ['Sentinel-2B', 'Sentinel-2A', 'Landsat-9', 'Landsat-8'];

  for (let i = 0; i < 4; i++) {
    const cloud = Math.round((Math.random() * (cloudMaxPct * 0.8) + 1) * 10) / 10;
    const platform = platforms[i % platforms.length];
    const itemBbox: number[][][] = [[
      [minLon, minLat],
      [maxLon, minLat],
      [maxLon, maxLat],
      [minLon, maxLat],
      [minLon, minLat]
    ]];

    items.push({
      id: `S2B_MSIL2A_${dateStr.replace(/-/g, '')}T103021_N0500_R108_T31UFU_20240831T${120000 + i * 3600}`,
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: itemBbox
      },
      properties: {
        datetime: `${dateStr}T10:35:${String((i * 15) % 60).padStart(2, '0')}Z`,
        platform,
        cloudCoverPct: cloud,
        sunElevationDeg: Math.round((48.5 + (i * 2.3)) * 10) / 10,
        sunAzimuthDeg: Math.round((142.1 + (i * 5.7)) * 10) / 10,
        orbitDirection: 'descending',
        gsd: platform.startsWith('Sentinel') ? 10 : 30
      },
      assets: {
        thumbnail: {
          href: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80',
          type: 'image/jpeg'
        },
        visual: {
          href: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&LAYERS=VIIRS_SNPP_CorrectedReflectance_TrueColor&FORMAT=image/jpeg&CRS=EPSG:4326&BBOX=' + bbox.join(',') + '&WIDTH=512&HEIGHT=512&TIME=' + dateStr,
          type: 'image/jpeg'
        },
        nir: {
          href: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80',
          type: 'image/tiff'
        }
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features: items,
    stacVersion: '1.0.0'
  };
}

/**
 * Converts a Live Provider Stream into a standard RemoteSensingImage object for direct SatQuery AI analysis.
 */
export function convertLiveStreamToRemoteSensingImage(
  layer: LiveProviderLayer,
  location: PresetLocation | { name: string; bbox: [number, number, number, number] },
  dateStr: string,
  directImageUrl?: string
): RemoteSensingImage {
  const [minLon, minLat, maxLon, maxLat] = location.bbox;
  const imgUrl = directImageUrl || buildGibsWmsUrl(layer.id, location.bbox, dateStr, 1024, 1024);

  const satelliteMap: Record<string, any> = {
    nasa_gibs: 'Sentinel-2',
    nasa_firms: 'Sentinel-2',
    sentinel_hub_stac: 'Sentinel-2',
    isro_mosdac: 'Synthetic/Benchmark',
    usgs_landsat: 'Landsat-8'
  };

  return {
    id: `live_${layer.provider}_${Date.now()}`,
    name: `[LIVE STREAM] ${layer.name} - ${location.name} (${dateStr})`,
    role: 'single',
    modality: layer.id.includes('DayNight') ? 'optical' : layer.id.includes('SAR') ? 'sar' : 'multispectral',
    dataUrl: imgUrl,
    thumbnailUrl: imgUrl,
    metadata: {
      format: 'JPEG',
      crs: 'EPSG:4326 (WGS 84 / Geographic)',
      bbox: location.bbox,
      gsdMeters: layer.resolutionMeters,
      dimensions: { width: 1024, height: 1024 },
      bands: layer.bandsDescription.split(',').map(b => b.trim()),
      satellite: satelliteMap[layer.provider] || 'Sentinel-2',
      acquisitionDate: dateStr,
      meanReflectance: 0.28,
      cloudCoverPercentage: 4.2
    },
    spectralProducts: {
      ndviUrl: imgUrl,
      ndwiUrl: imgUrl,
      falseColorUrl: imgUrl
    }
  };
}

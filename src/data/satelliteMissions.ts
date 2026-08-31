/**
 * NASA and ISRO Satellite Mission Specifications & Radiometric Calibration Profiles
 * Multi-mission Earth Observation data for enhanced object identification and ground area analysis
 */

export interface SatelliteMission {
  id: string;
  name: string;
  agency: 'NASA' | 'ISRO' | 'NASA-ISRO' | 'ESA';
  sensor: string;
  orbitType: string;
  altitudeKm: number;
  swathWidthKm: number;
  gsdMeters: number; // Spatial resolution (Ground Sampling Distance in meters)
  panGsdMeters?: number;
  thermalGsdMeters?: number;
  radiometricBits: number;
  revisitDays: number;
  bands: {
    name: string;
    wavelengthMicrons: string;
    gsdMeters: number;
    primaryUse: string;
  }[];
  description: string;
  identificationStrengths: string[];
  samplePayloadLocation: string;
}

export const SATELLITE_MISSIONS: Record<string, SatelliteMission> = {
  'isro_cartosat3': {
    id: 'isro_cartosat3',
    name: 'Cartosat-3',
    agency: 'ISRO',
    sensor: 'High-Resolution Panchromatic & 4-Band Multispectral MX Imager',
    orbitType: 'Sun-Synchronous Polar (SSO, 97.5° inclination)',
    altitudeKm: 505,
    swathWidthKm: 17.0,
    gsdMeters: 1.12, // 1.12m MX, 0.28m PAN
    panGsdMeters: 0.28,
    radiometricBits: 12,
    revisitDays: 4,
    bands: [
      { name: 'PAN (Panchromatic)', wavelengthMicrons: '0.45 - 0.75 µm', gsdMeters: 0.28, primaryUse: 'Sub-meter urban building footprint, individual vehicle & cadastral asset mapping' },
      { name: 'B2 (Blue)', wavelengthMicrons: '0.45 - 0.52 µm', gsdMeters: 1.12, primaryUse: 'Coastal bathymetry, waterbody delineation, atmospheric aerosol penetration' },
      { name: 'B3 (Green)', wavelengthMicrons: '0.52 - 0.59 µm', gsdMeters: 1.12, primaryUse: 'Vegetation canopy reflection, urban park delineation, sediment plume tracking' },
      { name: 'B4 (Red)', wavelengthMicrons: '0.62 - 0.68 µm', gsdMeters: 1.12, primaryUse: 'Chlorophyll absorption, road asphalt vs concrete boundary segmentation' },
      { name: 'B5 (NIR)', wavelengthMicrons: '0.77 - 0.86 µm', gsdMeters: 1.12, primaryUse: 'High-contrast water-land boundaries, biomass density, leaf cellular structure' }
    ],
    description: 'ISRO third-generation agile Earth observation satellite featuring world-class 0.28m resolution for ultra-precise urban infrastructure, infrastructure boundary detection, and cadastral mapping.',
    identificationStrengths: [
      'Pinpoint individual commercial and residential building footprints (< 1m accuracy)',
      'Distinguish runway markings, road medians, highway interchanges, and maritime docks',
      'Accurate cadastral parcel delineation and urban encroachment forensic analysis'
    ],
    samplePayloadLocation: 'NRSC Shadnagar / ISRO SAC Ahmedabad Ground Station'
  },
  'isro_resourcesat2_liss4': {
    id: 'isro_resourcesat2_liss4',
    name: 'Resourcesat-2A (LISS-IV)',
    agency: 'ISRO',
    sensor: 'Linear Imaging Self-Scanning Sensor (LISS-IV & AWiFS)',
    orbitType: 'Sun-Synchronous Polar (SSO, 817 km)',
    altitudeKm: 817,
    swathWidthKm: 70.3,
    gsdMeters: 5.8,
    radiometricBits: 10,
    revisitDays: 5,
    bands: [
      { name: 'Band 2 (Green)', wavelengthMicrons: '0.52 - 0.59 µm', gsdMeters: 5.8, primaryUse: 'Vegetation vigor and green reflectance' },
      { name: 'Band 3 (Red)', wavelengthMicrons: '0.62 - 0.68 µm', gsdMeters: 5.8, primaryUse: 'Chlorophyll absorption and crop canopy classification' },
      { name: 'Band 4 (NIR)', wavelengthMicrons: '0.77 - 0.86 µm', gsdMeters: 5.8, primaryUse: 'Biomass estimation, agricultural field boundaries, surface water mapping' }
    ],
    description: 'ISRO dedicated agricultural and natural resources satellite. The 5.8m multi-spectral LISS-IV sensor provides unmatched precision for crop parcel classification and forest canopy stratification.',
    identificationStrengths: [
      'Crop type classification (paddy, sugarcane, wheat, cotton, center-pivot parcels)',
      'Forest canopy density stratification (dense, moderately dense, open scrub)',
      'Inland water reservoir capacity and surface area estimation'
    ],
    samplePayloadLocation: 'ISRO NRSC Balanagar / IRS Multi-Mission Processing System'
  },
  'isro_risat1a_sar': {
    id: 'isro_risat1a_sar',
    name: 'RISAT-1A / EOS-04 (SAR)',
    agency: 'ISRO',
    sensor: 'C-Band Synthetic Aperture Radar (5.35 GHz)',
    orbitType: 'Sun-Synchronous Polar (529 km)',
    altitudeKm: 529,
    swathWidthKm: 25.0, // in FRS-1 mode
    gsdMeters: 3.0,
    radiometricBits: 12,
    revisitDays: 12,
    bands: [
      { name: 'RH (Right Circular - Horizontal)', wavelengthMicrons: '5.6 cm (C-band)', gsdMeters: 3.0, primaryUse: 'Compact Polarimetry for soil moisture & crop phenology' },
      { name: 'RV (Right Circular - Vertical)', wavelengthMicrons: '5.6 cm (C-band)', gsdMeters: 3.0, primaryUse: 'Double-bounce urban structure detection and flood surface backscatter' }
    ],
    description: 'ISRO radar imaging satellite with active microwave C-band antenna providing 24/7 day-and-night all-weather flood inundation, soil dielectric assessment, and maritime monitoring.',
    identificationStrengths: [
      'All-weather cloud and monsoon penetration for flood water mapping',
      'High-dielectric metallic object and maritime vessel radar signature detection',
      'Paddy crop transplantation stage detection via radar roughness indices'
    ],
    samplePayloadLocation: 'ISRO ISTRAC Bangalore / Space Applications Centre (SAC)'
  },
  'isro_oceansat3': {
    id: 'isro_oceansat3',
    name: 'Oceansat-3 / EOS-06',
    agency: 'ISRO',
    sensor: 'Ocean Color Monitor (OCM-3) & Sea Surface Temperature Monitor',
    orbitType: 'Sun-Synchronous Polar (720 km)',
    altitudeKm: 720,
    swathWidthKm: 1400.0,
    gsdMeters: 360.0,
    radiometricBits: 12,
    revisitDays: 2,
    bands: [
      { name: '13 VNIR Spectral Bands', wavelengthMicrons: '0.40 - 0.88 µm', gsdMeters: 360.0, primaryUse: 'Ocean chlorophyll-a, Total Suspended Sediments (TSS), colored dissolved organic matter' }
    ],
    description: 'ISRO oceanographic satellite dedicated to coastal zone management, sediment plume dynamics, and potential fishing zone (PFZ) advisory identification.',
    identificationStrengths: [
      'Coastal sediment runoff and estuary plume trajectory identification',
      'Harmful algal bloom (HAB) and ocean chlorophyll concentration tracking',
      'Macro-scale coastal wetland and mangrove belt health analysis'
    ],
    samplePayloadLocation: 'INCOIS Hyderabad / ISRO NRSC'
  },
  'nasa_landsat9_oli2': {
    id: 'nasa_landsat9_oli2',
    name: 'Landsat 9 (OLI-2 & TIRS-2)',
    agency: 'NASA',
    sensor: 'Operational Land Imager-2 & Thermal Infrared Sensor-2',
    orbitType: 'Sun-Synchronous Polar (705 km, 98.2° inclination)',
    altitudeKm: 705,
    swathWidthKm: 185.0,
    gsdMeters: 30.0,
    panGsdMeters: 15.0,
    thermalGsdMeters: 100.0,
    radiometricBits: 14,
    revisitDays: 8, // With Landsat 8
    bands: [
      { name: 'Band 1 (Coastal Aerosol)', wavelengthMicrons: '0.43 - 0.45 µm', gsdMeters: 30.0, primaryUse: 'Coastal water bathymetry, atmospheric aerosol correction' },
      { name: 'Band 2 (Blue)', wavelengthMicrons: '0.45 - 0.51 µm', gsdMeters: 30.0, primaryUse: 'Bathymetric mapping, soil vs vegetation distinction' },
      { name: 'Band 3 (Green)', wavelengthMicrons: '0.53 - 0.59 µm', gsdMeters: 30.0, primaryUse: 'Peak vegetation reflectance, waterbody sediment assessment' },
      { name: 'Band 4 (Red)', wavelengthMicrons: '0.64 - 0.67 µm', gsdMeters: 30.0, primaryUse: 'Chlorophyll absorption, plant health & urban boundary differentiation' },
      { name: 'Band 5 (NIR)', wavelengthMicrons: '0.85 - 0.88 µm', gsdMeters: 30.0, primaryUse: 'Biomass content, NDVI calculation, sharp water-land boundary isolation' },
      { name: 'Band 6 (SWIR 1)', wavelengthMicrons: '1.57 - 1.65 µm', gsdMeters: 30.0, primaryUse: 'Moisture content in soil and vegetation, thin cloud penetration' },
      { name: 'Band 7 (SWIR 2)', wavelengthMicrons: '2.11 - 2.29 µm', gsdMeters: 30.0, primaryUse: 'Hydrothermal mineral mapping, wildfire burn scar severity (NBR)' },
      { name: 'Band 8 (Panchromatic)', wavelengthMicrons: '0.50 - 0.68 µm', gsdMeters: 15.0, primaryUse: '15m pan-sharpening resolution enhancement' },
      { name: 'Band 10 (TIRS 1)', wavelengthMicrons: '10.60 - 11.19 µm', gsdMeters: 100.0, primaryUse: 'Surface brightness temperature and thermal anomaly detection' }
    ],
    description: 'Flagship NASA / USGS Earth observation satellite providing continuous 50-year global record with radiometrically superior 14-bit data for rigorous decadal land-cover change analysis.',
    identificationStrengths: [
      'Multi-decadal baseline land-cover classification and deforestation quantification',
      'Surface water reservoir evaporation and drought recession monitoring',
      'Differenced Normalized Burn Ratio (dNBR) wildfire perimeter analysis'
    ],
    samplePayloadLocation: 'NASA Goddard Space Flight Center / USGS EROS Data Center'
  },
  'nasa_terra_modis': {
    id: 'nasa_terra_modis',
    name: 'Terra / Aqua (MODIS)',
    agency: 'NASA',
    sensor: 'Moderate Resolution Imaging Spectroradiometer (36 Bands)',
    orbitType: 'Sun-Synchronous Polar (705 km)',
    altitudeKm: 705,
    swathWidthKm: 2330.0,
    gsdMeters: 250.0,
    radiometricBits: 12,
    revisitDays: 1,
    bands: [
      { name: 'Band 1 (Red)', wavelengthMicrons: '0.62 - 0.67 µm', gsdMeters: 250.0, primaryUse: 'Vegetation / land boundaries' },
      { name: 'Band 2 (NIR)', wavelengthMicrons: '0.84 - 0.87 µm', gsdMeters: 250.0, primaryUse: 'High temporal NDVI / EVI calculations' },
      { name: 'Bands 3-7 (VIS/SWIR)', wavelengthMicrons: '0.45 - 2.15 µm', gsdMeters: 500.0, primaryUse: 'Land, cloud, and aerosol surface reflectance products' }
    ],
    description: 'NASA primary daily global monitoring payload delivering 1-2 day whole-globe coverage for continental fire tracking, flood extent, and global biosphere productivity.',
    identificationStrengths: [
      'Continental-scale rapid flood extent and inland lake recession tracking',
      'Active thermal anomaly and mega-wildfire hotspot detection',
      'Global seasonal vegetation phenology and crop cycle tracking'
    ],
    samplePayloadLocation: 'NASA LP DAAC / GSFC Earthdata'
  },
  'nasa_isro_nisar': {
    id: 'nasa_isro_nisar',
    name: 'NISAR (NASA-ISRO SAR)',
    agency: 'NASA-ISRO',
    sensor: 'Dual-Frequency L-band (24 cm, NASA) & S-band (12 cm, ISRO) Polarimetric Radar',
    orbitType: 'Sun-Synchronous Polar (747 km, 98.4° inclination)',
    altitudeKm: 747,
    swathWidthKm: 242.0,
    gsdMeters: 6.0,
    radiometricBits: 16,
    revisitDays: 12,
    bands: [
      { name: 'L-Band SAR (24 cm wavelength)', wavelengthMicrons: '1.25 GHz', gsdMeters: 6.0, primaryUse: 'NASA payload: Deep canopy penetration, tree trunk volume, soil moisture under forest' },
      { name: 'S-Band SAR (12 cm wavelength)', wavelengthMicrons: '3.20 GHz', gsdMeters: 6.0, primaryUse: 'ISRO payload: Crop phenology, light vegetation, coastal wetland deformation' }
    ],
    description: 'Historic joint flagship mission between NASA (JPL) and ISRO combining dual L-band & S-band SweepSAR radar for millimetric tectonic displacement, forest biomass inventory, and disaster response.',
    identificationStrengths: [
      'Sub-canopy flood inundation mapping beneath dense rainforest vegetation',
      'Millimeter-precision ground deformation & earthquake fault line displacement',
      'Forest above-ground biomass (AGB) and structural carbon stock estimation'
    ],
    samplePayloadLocation: 'NASA JPL Pasadena & ISRO U R Rao Satellite Centre (URSC) Bengaluru'
  },
  'esa_sentinel2': {
    id: 'esa_sentinel2',
    name: 'Sentinel-2 (MSI)',
    agency: 'ESA',
    sensor: 'Multi-Spectral Instrument (13 Bands VNIR & SWIR)',
    orbitType: 'Sun-Synchronous Polar (786 km)',
    altitudeKm: 786,
    swathWidthKm: 290.0,
    gsdMeters: 10.0,
    radiometricBits: 12,
    revisitDays: 5,
    bands: [
      { name: 'B2-B4 (RGB)', wavelengthMicrons: '0.49 - 0.66 µm', gsdMeters: 10.0, primaryUse: '10m True Color visual inspection' },
      { name: 'B8 (NIR)', wavelengthMicrons: '0.84 µm', gsdMeters: 10.0, primaryUse: '10m Vegetation index (NDVI) & land-water separation' },
      { name: 'B11-B12 (SWIR)', wavelengthMicrons: '1.61 - 2.19 µm', gsdMeters: 20.0, primaryUse: 'Moisture content, burn severity, geology' }
    ],
    description: 'European Copernicus constellation delivering 10m multispectral imagery every 5 days for systematic global land monitoring.',
    identificationStrengths: [
      'Standard 10m Land-Use and Land-Cover (LULC) classification',
      'Agricultural crop parcel boundary and vigor mapping',
      'Inland waterbody surface area calculation'
    ],
    samplePayloadLocation: 'ESA Copernicus Open Access Hub'
  }
};

/**
 * Standard Land-Cover Classification Categories (UN FAO / CORINE / LISS-IV aligned)
 */
export interface LandCoverClassDef {
  id: 'urban' | 'forest' | 'water' | 'agriculture' | 'barren' | 'snow_cloud';
  name: string;
  shortLabel: string;
  colorHex: string;
  rgb: [number, number, number];
  description: string;
  typicalObjects: string[];
}

export const LAND_COVER_CLASSES: Record<string, LandCoverClassDef> = {
  'urban': {
    id: 'urban',
    name: 'Urban & Built-Up Infrastructure',
    shortLabel: 'Urban',
    colorHex: '#f43f5e', // Vibrant Rose / Coral
    rgb: [244, 63, 94],
    description: 'Impervious surfaces, asphalt roads, residential & commercial structures, industrial yards, concrete runways, and port berths.',
    typicalObjects: ['Commercial Logistics Complex', 'Built-Up Industrial Facility', 'Transportation & Road Corridor', 'Container Port Terminal', 'Urban Infrastructure Zone']
  },
  'forest': {
    id: 'forest',
    name: 'Forest & Dense Tree Canopy',
    shortLabel: 'Forest',
    colorHex: '#22c55e', // Vibrant Green
    rgb: [34, 197, 94],
    description: 'Continuous tree canopy, evergreen conifers, deciduous woodlands, riparian gallery forests, and protected natural reserves.',
    typicalObjects: ['Coniferous Forest Stand', 'Deciduous Woodland Ridge', 'Riparian Forest Buffer', 'Mangrove Forest Belt', 'Sub-Canopy Biomass Stand']
  },
  'water': {
    id: 'water',
    name: 'Water Bodies & Hydrological Channels',
    shortLabel: 'Water',
    colorHex: '#3b82f6', // Bright Blue
    rgb: [59, 130, 246],
    description: 'Inland lakes, reservoirs, river channels, drainage basins, coastal estuaries, retention ponds, and flooded marshlands.',
    typicalObjects: ['Inland Reservoir Basin', 'Meandering River Channel', 'Commercial Harbor Docking Basin', 'Irrigation Supply Canal', 'Estuary Sediment Zone']
  },
  'agriculture': {
    id: 'agriculture',
    name: 'Cropland & Cultivated Agriculture',
    shortLabel: 'Cropland',
    colorHex: '#eab308', // Amber / Gold
    rgb: [234, 179, 8],
    description: 'Actively cultivated crop parcels, center-pivot circular irrigation fields, irrigated paddy fields, orchards, and pastures.',
    typicalObjects: ['Center-Pivot Circular Field', 'Rectangular Paddy Field Parcel', 'Greenhouse Canopy Grid', 'Orchard Plantation Stand', 'Irrigated Arable Field']
  },
  'barren': {
    id: 'barren',
    name: 'Barren Land, Bare Soil & Rocks',
    shortLabel: 'Barren',
    colorHex: '#d97706', // Ochre / Brown
    rgb: [217, 119, 6],
    description: 'Exposed soil, desert sand dunes, dry riverbeds, rocky outcrops, quarries, and non-vegetated earth terrain.',
    typicalObjects: ['Exposed Bare Soil Plot', 'Quarry Mineral Extraction Basin', 'Arid Desert Dune Ridge', 'Excavation Site Ground', 'Dry Sediment Sandbar']
  },
  'snow_cloud': {
    id: 'snow_cloud',
    name: 'Snow, Ice & High-Albedo Surfaces',
    shortLabel: 'Snow / Bright',
    colorHex: '#06b6d4', // Cyan
    rgb: [6, 182, 212],
    description: 'Glacial snowpack, seasonal ice cover, high-reflectance bright surfaces, and cloud reflection boundaries.',
    typicalObjects: ['Alpine Snowpack Perimeter', 'Glacial Ice Margin', 'High-Albedo Reflective Roof Panel', 'Bright Mineral Salt Pan']
  }
};
